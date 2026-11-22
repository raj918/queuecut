import { prisma } from '../../database/prisma';
import { BookingStatus, BookingSource } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { CommissionsService } from '../commissions/commissions.service';

export class QueueService {
  /**
   * Generates atomic, sequential token number Q-001, Q-002 per salon business date.
   * Runs inside an ACID database transaction to avoid concurrency race conditions.
   */
  static async generateAtomicToken(salonId: string, tx: any): Promise<string> {
    const todayStr = new Date().toISOString().split('T')[0];

    // Atomically upsert & increment the counter
    const counter = await tx.queueCounter.upsert({
      where: {
        salonId_businessDate: {
          salonId,
          businessDate: todayStr,
        },
      },
      update: {
        lastTokenNumber: {
          increment: 1,
        },
      },
      create: {
        salonId,
        businessDate: todayStr,
        lastTokenNumber: 1,
      },
    });

    const tokenNum = counter.lastTokenNumber;
    const formattedToken = `Q-${tokenNum.toString().padStart(3, '0')}`;
    return formattedToken;
  }

  /**
   * Get live queue tokens for a salon for the current business date
   */
  static async getLiveQueue(salonId: string) {
    const todayStr = new Date().toISOString().split('T')[0];

    const salon = await prisma.salon.findUnique({
      where: { id: salonId },
      select: { id: true, name: true, isOpen: true, isPaused: true, pauseReason: true },
    });

    if (!salon) {
      throw new Error('Salon not found');
    }

    const bookings = await prisma.booking.findMany({
      where: {
        salonId,
        scheduledDate: todayStr,
        status: {
          in: [
            BookingStatus.CONFIRMED,
            BookingStatus.CHECKED_IN,
            BookingStatus.WAITING,
            BookingStatus.CALLED,
            BookingStatus.IN_SERVICE,
          ],
        },
      },
      include: {
        customer: {
          select: { id: true, name: true, phone: true, avatarUrl: true },
        },
        staff: {
          select: { id: true, name: true, role: true, avatarUrl: true, isAvailable: true },
        },
        bookingServices: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Partition into in-service, called, and waiting
    const inService = bookings.filter((b) => b.status === BookingStatus.IN_SERVICE);
    const called = bookings.filter((b) => b.status === BookingStatus.CALLED);
    const waiting = bookings.filter((b) =>
      ([BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN, BookingStatus.WAITING] as BookingStatus[]).includes(b.status)
    );

    return {
      salon,
      summary: {
        totalActive: bookings.length,
        inServiceCount: inService.length,
        calledCount: called.length,
        waitingCount: waiting.length,
      },
      inService,
      called,
      waiting,
      allTokens: bookings,
    };
  }

  /**
   * Calculate live queue position & wait time for a customer booking
   */
  static async getBookingQueuePosition(bookingId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        salon: {
          select: {
            id: true,
            name: true,
            phone: true,
            address: true,
            locality: true,
            latitude: true,
            longitude: true,
            isPaused: true,
            pauseReason: true,
          },
        },
        staff: true,
        bookingServices: true,
      },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    // If already in service or finished
    if (booking.status === BookingStatus.IN_SERVICE) {
      return {
        booking,
        status: booking.status,
        position: 0,
        customersAhead: 0,
        estimatedWaitMinutes: 0,
        message: 'Your service is currently underway in the styling chair.',
      };
    }

    if ((['COMPLETED', 'CANCELLED', 'SKIPPED', 'NO_SHOW'] as string[]).includes(booking.status)) {
      return {
        booking,
        status: booking.status,
        position: 0,
        customersAhead: 0,
        estimatedWaitMinutes: 0,
        message: `Booking has concluded with status: ${booking.status}`,
      };
    }

    if (booking.status === BookingStatus.CALLED) {
      return {
        booking,
        status: booking.status,
        position: 1,
        customersAhead: 0,
        estimatedWaitMinutes: 0,
        message: 'Barber is calling for you! Please proceed to the salon chair.',
      };
    }

    // For WAITING / CONFIRMED / CHECKED_IN
    // Count active bookings ahead in the queue created prior to this booking
    const activeAhead = await prisma.booking.findMany({
      where: {
        salonId: booking.salonId,
        scheduledDate: booking.scheduledDate,
        status: {
          in: [
            BookingStatus.CONFIRMED,
            BookingStatus.CHECKED_IN,
            BookingStatus.WAITING,
            BookingStatus.CALLED,
            BookingStatus.IN_SERVICE,
          ],
        },
        createdAt: { lt: booking.createdAt },
      },
      select: {
        id: true,
        totalDurationMinutes: true,
        staffId: true,
        status: true,
      },
    });

    // Check available staff count
    const staffCount = await prisma.staff.count({
      where: { salonId: booking.salonId, isActive: true, isAvailable: true },
    });
    const effectiveStaff = Math.max(1, staffCount);

    const customersAhead = activeAhead.length;
    const totalDurationAhead = activeAhead.reduce((sum, b) => sum + b.totalDurationMinutes, 0);

    const estimatedWaitMinutes = Math.round(totalDurationAhead / effectiveStaff);

    return {
      booking,
      status: booking.status,
      position: customersAhead + 1,
      customersAhead,
      estimatedWaitMinutes,
      isPaused: booking.salon.isPaused,
      pauseReason: booking.salon.pauseReason,
      message:
        customersAhead === 0
          ? 'You are next in line! Stay ready.'
          : `${customersAhead} customer(s) ahead of you. Estimated wait: ~${estimatedWaitMinutes} mins.`,
    };
  }

  /**
   * Action: Call Next Customer
   */
  static async callCustomer(bookingId: string, assignedStaffId?: string, actor = 'OWNER') {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { salon: true, staff: true },
    });

    if (!booking) throw new Error('Booking not found');

    if ((['COMPLETED', 'CANCELLED', 'SKIPPED', 'NO_SHOW'] as string[]).includes(booking.status)) {
      throw new Error(`Cannot call customer. Booking is already ${booking.status}`);
    }

    if (booking.status === BookingStatus.IN_SERVICE) {
      throw new Error('Customer is already in service');
    }

    let finalStaffId = assignedStaffId || booking.staffId;

    // If no staff assigned yet, assign first available staff
    if (!finalStaffId) {
      const availableBarber = await prisma.staff.findFirst({
        where: { salonId: booking.salonId, isActive: true, isAvailable: true },
      });
      if (availableBarber) {
        finalStaffId = availableBarber.id;
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const b = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.CALLED,
          calledTime: new Date(),
          ...(finalStaffId ? { staffId: finalStaffId } : {}),
        },
        include: { staff: true, salon: true },
      });

      await tx.queueEvent.create({
        data: {
          salonId: booking.salonId,
          bookingId,
          eventType: 'CALLED',
          oldStatus: booking.status,
          newStatus: BookingStatus.CALLED,
          details: `Customer called for turn by ${actor}`,
          triggeredBy: actor,
        },
      });

      return b;
    });

    // Trigger push notification to customer
    await NotificationsService.notifyCustomerCalled(
      updated,
      updated.salon.name,
      updated.staff?.name || 'Your Stylist'
    );

    return updated;
  }

  /**
   * Action: Start Service
   */
  static async startService(bookingId: string, actor = 'OWNER') {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { salon: true, staff: true },
    });

    if (!booking) throw new Error('Booking not found');

    if (booking.status === BookingStatus.IN_SERVICE) {
      throw new Error('Service is already in progress');
    }

    if ((['COMPLETED', 'CANCELLED', 'SKIPPED', 'NO_SHOW'] as string[]).includes(booking.status)) {
      throw new Error(`Cannot start service. Booking is ${booking.status}`);
    }

    // Ensure staff member is not currently serving another customer
    if (booking.staffId) {
      const activeBarberBooking = await prisma.booking.findFirst({
        where: {
          staffId: booking.staffId,
          status: BookingStatus.IN_SERVICE,
          id: { not: bookingId },
        },
      });

      if (activeBarberBooking) {
        throw new Error(
          `Staff member is currently serving Token ${activeBarberBooking.tokenNumber}. Please complete or finish previous service first.`
        );
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const b = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.IN_SERVICE,
          serviceStartTime: new Date(),
        },
        include: { staff: true, salon: true },
      });

      if (b.staffId) {
        await tx.staff.update({
          where: { id: b.staffId },
          data: {
            isAvailable: false,
            currentBookingId: b.id,
          },
        });
      }

      await tx.queueEvent.create({
        data: {
          salonId: booking.salonId,
          bookingId,
          eventType: 'STARTED',
          oldStatus: booking.status,
          newStatus: BookingStatus.IN_SERVICE,
          details: `Service started by ${actor}`,
          triggeredBy: actor,
        },
      });

      return b;
    });

    await NotificationsService.notifyServiceStarted(updated, updated.salon.name);

    return updated;
  }

  /**
   * Action: Complete Service
   */
  static async completeService(bookingId: string, actor = 'OWNER') {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { salon: true, staff: true },
    });

    if (!booking) throw new Error('Booking not found');

    if (booking.status === BookingStatus.COMPLETED) {
      return booking;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const b = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.COMPLETED,
          serviceEndTime: new Date(),
        },
        include: { staff: true, salon: true },
      });

      // Free up the barber
      if (b.staffId) {
        await tx.staff.update({
          where: { id: b.staffId },
          data: {
            isAvailable: true,
            currentBookingId: null,
          },
        });
      }

      await tx.queueEvent.create({
        data: {
          salonId: booking.salonId,
          bookingId,
          eventType: 'COMPLETED',
          oldStatus: booking.status,
          newStatus: BookingStatus.COMPLETED,
          details: `Service completed. Ready for counter checkout.`,
          triggeredBy: actor,
        },
      });

      return b;
    });

    // Calculate and log commission
    await CommissionsService.recordBookingCommission(booking.id);

    // Push notification to customer
    await NotificationsService.notifyServiceCompleted(updated, updated.salon.name);

    return updated;
  }

  /**
   * Action: Skip Customer
   */
  static async skipCustomer(bookingId: string, reason = 'Customer did not respond', actor = 'OWNER') {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new Error('Booking not found');

    if (booking.status === BookingStatus.IN_SERVICE) {
      throw new Error('Cannot skip customer while service is in progress');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const b = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.SKIPPED,
          cancellationReason: reason,
        },
      });

      await tx.queueEvent.create({
        data: {
          salonId: booking.salonId,
          bookingId,
          eventType: 'SKIPPED',
          oldStatus: booking.status,
          newStatus: BookingStatus.SKIPPED,
          details: reason,
          triggeredBy: actor,
        },
      });

      return b;
    });

    return updated;
  }

  /**
   * Action: Mark No-Show
   */
  static async markNoShow(bookingId: string, reason = 'Customer did not arrive', actor = 'OWNER') {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new Error('Booking not found');

    if (booking.status === BookingStatus.IN_SERVICE) {
      throw new Error('Cannot mark as no-show while service is active');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const b = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.NO_SHOW,
          cancellationReason: reason,
        },
      });

      await tx.queueEvent.create({
        data: {
          salonId: booking.salonId,
          bookingId,
          eventType: 'NO_SHOW',
          oldStatus: booking.status,
          newStatus: BookingStatus.NO_SHOW,
          details: reason,
          triggeredBy: actor,
        },
      });

      return b;
    });

    return updated;
  }

  /**
   * Add Walk-in customer directly into the queue
   */
  static async addWalkIn(data: {
    salonId: string;
    customerName: string;
    customerPhone?: string | null;
    serviceIds: string[];
    staffId?: string | null;
    notes?: string;
  }) {
    // Verify salon exists and not closed
    const salon = await prisma.salon.findUnique({
      where: { id: data.salonId },
    });

    if (!salon) throw new Error('Salon not found');

    // Fetch services to snapshot price and duration
    const services = await prisma.service.findMany({
      where: {
        id: { in: data.serviceIds },
        salonId: data.salonId,
        isActive: true,
      },
    });

    if (services.length === 0) {
      throw new Error('Selected services are invalid or no longer active');
    }

    const totalPrice = services.reduce((sum, s) => sum + s.price, 0);
    const totalDurationMinutes = services.reduce((sum, s) => sum + s.durationMinutes, 0);

    const todayStr = new Date().toISOString().split('T')[0];

    const result = await prisma.$transaction(async (tx) => {
      const tokenNumber = await this.generateAtomicToken(data.salonId, tx);
      const bookingNumber = `QC-W-${Date.now().toString().slice(-6)}`;

      const booking = await tx.booking.create({
        data: {
          salonId: data.salonId,
          walkInCustomerName: data.customerName,
          walkInCustomerPhone: data.customerPhone || null,
          staffId: data.staffId || null,
          bookingNumber,
          tokenNumber,
          bookingSource: BookingSource.WALK_IN,
          status: BookingStatus.WAITING,
          scheduledDate: todayStr,
          totalPrice,
          totalDurationMinutes,
          commissionRate: 0.0, // Walk-ins exempt
          commissionAmount: 0.0,
          customerNotes: data.notes || 'Walk-in customer',
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
          bookingServices: true,
          staff: true,
        },
      });

      await tx.queueEvent.create({
        data: {
          salonId: data.salonId,
          bookingId: booking.id,
          eventType: 'WALK_IN_ADDED',
          oldStatus: null,
          newStatus: BookingStatus.WAITING,
          details: `Walk-in customer ${data.customerName} entered queue`,
          triggeredBy: 'OWNER',
        },
      });

      return booking;
    });

    return result;
  }

  /**
   * Pause queue bookings
   */
  static async pauseQueue(salonId: string, reason: string) {
    const salon = await prisma.salon.update({
      where: { id: salonId },
      data: {
        isPaused: true,
        pauseReason: reason,
      },
    });
    return salon;
  }

  /**
   * Resume queue bookings
   */
  static async resumeQueue(salonId: string) {
    const salon = await prisma.salon.update({
      where: { id: salonId },
      data: {
        isPaused: false,
        pauseReason: null,
      },
    });
    return salon;
  }
}
