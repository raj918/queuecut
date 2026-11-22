import { prisma } from '../../database/prisma';
import { BookingStatus, BookingSource } from '@prisma/client';
import { QueueService } from '../queue/queue.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CommissionsService } from '../commissions/commissions.service';

export class BookingsService {
  /**
   * Create an online booking with atomic token creation and idempotency protection
   */
  static async createBooking(
    customerId: string,
    data: {
      salonId: string;
      serviceIds: string[];
      staffId?: string | null;
      scheduledDate?: string;
      customerNotes?: string;
      idempotencyKey?: string;
    }
  ) {
    // 1. Idempotency check: if request was already processed, return existing booking
    if (data.idempotencyKey) {
      const existing = await prisma.booking.findUnique({
        where: { idempotencyKey: data.idempotencyKey },
        include: {
          salon: true,
          staff: true,
          bookingServices: true,
        },
      });
      if (existing) {
        return existing;
      }
    }

    // 2. Validate salon status
    const salon = await prisma.salon.findUnique({
      where: { id: data.salonId },
    });

    if (!salon) {
      throw new Error('Salon not found');
    }

    if (!salon.isOpen) {
      throw new Error('This salon is currently closed.');
    }

    if (salon.isPaused) {
      throw new Error(`Bookings for this salon are temporarily paused: ${salon.pauseReason || 'Please check back shortly.'}`);
    }

    // 3. Fetch services and validate
    const services = await prisma.service.findMany({
      where: {
        id: { in: data.serviceIds },
        salonId: data.salonId,
        isActive: true,
      },
    });

    if (services.length !== data.serviceIds.length) {
      throw new Error('One or more selected services are invalid or no longer offered.');
    }

    const totalPrice = services.reduce((sum, s) => sum + s.price, 0);
    const totalDurationMinutes = services.reduce((sum, s) => sum + s.durationMinutes, 0);

    // 4. Validate staff qualification if staffId is specified
    let finalStaffId = data.staffId || null;
    if (finalStaffId) {
      const staff = await prisma.staff.findUnique({
        where: { id: finalStaffId },
        include: { staffServices: true },
      });

      if (!staff || !staff.isActive) {
        throw new Error('Selected stylist is no longer active.');
      }

      // Check if staff has capability for all services
      const staffServiceIds = new Set(staff.staffServices.map((ss) => ss.serviceId));
      const hasAll = data.serviceIds.every((sId) => staffServiceIds.has(sId));
      if (!hasAll && staff.staffServices.length > 0) {
        throw new Error(`Stylist ${staff.name} is not qualified for all selected services. Choose 'Any available' or select a different stylist.`);
      }
    }

    const todayStr = data.scheduledDate || new Date().toISOString().split('T')[0];

    // 5. Transaction: Atomic Token generation & Booking creation
    const booking = await prisma.$transaction(async (tx) => {
      const tokenNumber = await QueueService.generateAtomicToken(data.salonId, tx);
      const bookingNumber = `QC-${todayStr.replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;

      const newBooking = await tx.booking.create({
        data: {
          salonId: data.salonId,
          customerId,
          staffId: finalStaffId,
          bookingNumber,
          tokenNumber,
          bookingSource: BookingSource.ONLINE,
          status: BookingStatus.CONFIRMED,
          scheduledDate: todayStr,
          totalPrice,
          totalDurationMinutes,
          commissionRate: salon.commissionRate || 5.0,
          customerNotes: data.customerNotes || null,
          idempotencyKey: data.idempotencyKey || null,
          bookingServices: {
            create: services.map((s) => ({
              serviceId: s.id,
              serviceNameSnapshot: s.name,
              priceSnapshot: s.price,
              durationSnapshot: s.durationMinutes,
            })),
          },
        },
        include: {
          salon: true,
          staff: true,
          bookingServices: true,
        },
      });

      // Audit queue event
      await tx.queueEvent.create({
        data: {
          salonId: data.salonId,
          bookingId: newBooking.id,
          eventType: 'TOKEN_CREATED',
          oldStatus: null,
          newStatus: BookingStatus.CONFIRMED,
          details: `Online token ${tokenNumber} issued to customer`,
          triggeredBy: 'CUSTOMER',
        },
      });

      return newBooking;
    });

    // 6. Push notifications asynchronously
    NotificationsService.notifyNewBookingToOwner(booking, salon).catch(console.error);
    NotificationsService.notifyCustomerBookingConfirmed(booking, salon.name).catch(console.error);

    return booking;
  }

  /**
   * Get authenticated customer's bookings by tab/status
   */
  static async getMyBookings(customerId: string, tab?: 'active' | 'upcoming' | 'completed' | 'cancelled') {
    let statusFilter: BookingStatus[] | undefined;

    switch (tab) {
      case 'active':
        statusFilter = [
          BookingStatus.CONFIRMED,
          BookingStatus.CHECKED_IN,
          BookingStatus.WAITING,
          BookingStatus.CALLED,
          BookingStatus.IN_SERVICE,
        ];
        break;
      case 'completed':
        statusFilter = [BookingStatus.COMPLETED];
        break;
      case 'cancelled':
        statusFilter = [BookingStatus.CANCELLED, BookingStatus.SKIPPED, BookingStatus.NO_SHOW, BookingStatus.EXPIRED];
        break;
      case 'upcoming':
        statusFilter = [BookingStatus.CONFIRMED];
        break;
      default:
        statusFilter = undefined;
    }

    return prisma.booking.findMany({
      where: {
        customerId,
        ...(statusFilter ? { status: { in: statusFilter } } : {}),
      },
      include: {
        salon: {
          select: {
            id: true,
            name: true,
            address: true,
            locality: true,
            coverImage: true,
            phone: true,
            averageRating: true,
          },
        },
        staff: {
          select: { id: true, name: true, role: true, avatarUrl: true },
        },
        bookingServices: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get single booking details
   */
  static async getBookingById(bookingId: string, userId: string, userRole: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        salon: true,
        staff: true,
        bookingServices: true,
        customer: {
          select: { id: true, name: true, phone: true },
        },
      },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    // Role security check
    if (userRole === 'CUSTOMER' && booking.customerId !== userId) {
      throw new Error('Unauthorized to view this booking');
    }

    if (userRole === 'SALON_OWNER' && booking.salon.ownerId !== userId) {
      throw new Error('Unauthorized to view bookings from other salons');
    }

    return booking;
  }

  /**
   * Cancel booking
   */
  static async cancelBooking(bookingId: string, userId: string, userRole: string, reason: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { salon: true },
    });

    if (!booking) throw new Error('Booking not found');

    if (userRole === 'CUSTOMER' && booking.customerId !== userId) {
      throw new Error('Unauthorized');
    }
    if (userRole === 'SALON_OWNER' && booking.salon.ownerId !== userId) {
      throw new Error('Unauthorized');
    }

    if (booking.status === BookingStatus.IN_SERVICE) {
      throw new Error('Cannot cancel booking after service has already begun in chair');
    }

    if (booking.status === BookingStatus.COMPLETED) {
      throw new Error('Cannot cancel a completed service');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const b = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.CANCELLED,
          cancellationReason: reason,
        },
        include: { salon: true },
      });

      // Release staff if assigned
      if (b.staffId) {
        await tx.staff.update({
          where: { id: b.staffId },
          data: { isAvailable: true, currentBookingId: null },
        });
      }

      await tx.queueEvent.create({
        data: {
          salonId: booking.salonId,
          bookingId,
          eventType: 'CANCELLED',
          oldStatus: booking.status,
          newStatus: BookingStatus.CANCELLED,
          details: `Cancelled by ${userRole}: ${reason}`,
          triggeredBy: userRole,
        },
      });

      return b;
    });

    // Reverse any pending commission ledger
    await CommissionsService.reverseCommission(bookingId, reason);

    // Notify customer
    NotificationsService.notifyBookingCancelled(updated, updated.salon.name, reason).catch(console.error);

    return updated;
  }

  /**
   * Customer check-in at the salon
   */
  static async checkInBooking(bookingId: string, customerId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) throw new Error('Booking not found');
    if (booking.customerId !== customerId) throw new Error('Unauthorized');

    if (booking.status !== BookingStatus.CONFIRMED) {
      return booking; // Already checked in or ahead
    }

    const updated = await prisma.$transaction(async (tx) => {
      const b = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.WAITING,
          checkInTime: new Date(),
        },
      });

      await tx.queueEvent.create({
        data: {
          salonId: booking.salonId,
          bookingId,
          eventType: 'CHECKED_IN',
          oldStatus: BookingStatus.CONFIRMED,
          newStatus: BookingStatus.WAITING,
          details: 'Customer arrived and checked in at salon',
          triggeredBy: 'CUSTOMER',
        },
      });

      return b;
    });

    return updated;
  }
}
