import { prisma } from '../../database/prisma';
import { BookingStatus, BookingSource } from '@prisma/client';
import { CommissionsService } from '../commissions/commissions.service';

export class OwnerService {
  /**
   * Fetch primary dashboard metrics for a salon owner
   */
  static async getDashboard(ownerId: string) {
    const salon = await prisma.salon.findFirst({
      where: { ownerId },
      include: {
        staff: { where: { isActive: true } },
      },
    });

    if (!salon) {
      throw new Error('No salon associated with this owner account. Please register a salon first.');
    }

    const todayStr = new Date().toISOString().split('T')[0];

    // Fetch today's bookings for this salon
    const todayBookings = await prisma.booking.findMany({
      where: {
        salonId: salon.id,
        scheduledDate: todayStr,
      },
      include: {
        customer: { select: { name: true, phone: true } },
        staff: { select: { name: true, role: true } },
        bookingServices: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const waitingBookings = todayBookings.filter((b) =>
      ([BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN, BookingStatus.WAITING] as BookingStatus[]).includes(b.status)
    );
    const inServiceBookings = todayBookings.filter((b) => b.status === BookingStatus.IN_SERVICE);
    const completedBookings = todayBookings.filter((b) => b.status === BookingStatus.COMPLETED);
    const cancelledCount = todayBookings.filter((b) =>
      ([BookingStatus.CANCELLED, BookingStatus.SKIPPED, BookingStatus.NO_SHOW] as BookingStatus[]).includes(b.status)
    ).length;

    // Estimated revenue from completed + in-service today
    const todayRevenue = [...completedBookings, ...inServiceBookings].reduce(
      (sum, b) => sum + b.totalPrice,
      0
    );

    const availableBarbers = salon.staff.filter((s) => s.isAvailable);

    // Next customer up (first called or first waiting)
    const nextCustomer =
      todayBookings.find((b) => b.status === BookingStatus.CALLED) ||
      waitingBookings[0] ||
      null;

    // Commission summary
    const commission = await CommissionsService.getSalonCommissionSummary(salon.id);

    return {
      salon: {
        id: salon.id,
        name: salon.name,
        isOpen: salon.isOpen,
        isPaused: salon.isPaused,
        pauseReason: salon.pauseReason,
      },
      metrics: {
        todayTotalBookings: todayBookings.length,
        waitingCount: waitingBookings.length,
        inServiceCount: inServiceBookings.length,
        completedCount: completedBookings.length,
        cancelledCount,
        todayEstimatedRevenue: todayRevenue,
        availableBarbersCount: availableBarbers.length,
        totalBarbersCount: salon.staff.length,
      },
      nextCustomer,
      inServiceList: inServiceBookings,
      waitingList: waitingBookings.slice(0, 5),
      commission: {
        totalDue: commission.totalDue,
        totalSettled: commission.totalSettled,
        eligibleBookings: commission.totalEligibleBookings,
      },
    };
  }

  /**
   * Get all salon bookings with filters
   */
  static async getOwnerBookings(
    ownerId: string,
    filters: {
      date?: string;
      status?: BookingStatus;
      staffId?: string;
      source?: BookingSource;
    }
  ) {
    const salon = await prisma.salon.findFirst({
      where: { ownerId },
      select: { id: true },
    });

    if (!salon) throw new Error('Salon not found');

    const bookings = await prisma.booking.findMany({
      where: {
        salonId: salon.id,
        ...(filters.date ? { scheduledDate: filters.date } : {}),
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.staffId ? { staffId: filters.staffId } : {}),
        ...(filters.source ? { bookingSource: filters.source } : {}),
      },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        staff: { select: { id: true, name: true } },
        bookingServices: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return bookings;
  }

  /**
   * Get owner commission ledger and breakdown
   */
  static async getOwnerCommission(ownerId: string) {
    const salon = await prisma.salon.findFirst({
      where: { ownerId },
      select: { id: true, commissionRate: true },
    });

    if (!salon) throw new Error('Salon not found');

    return CommissionsService.getSalonCommissionSummary(salon.id);
  }
}
