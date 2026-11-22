import { prisma } from '../../database/prisma';
import { CommissionStatus } from '@prisma/client';

export class CommissionsService {
  /**
   * Process commission for a completed booking
   */
  static async recordBookingCommission(bookingId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { salon: true },
    });

    if (!booking) {
      throw new Error(`Booking ${bookingId} not found`);
    }

    // Rule: Walk-in customers are completely exempt from commission
    if (booking.bookingSource === 'WALK_IN') {
      await prisma.commissionLedger.create({
        data: {
          salonId: booking.salonId,
          bookingId: booking.id,
          amount: 0.0,
          rate: 0.0,
          status: CommissionStatus.NOT_ELIGIBLE,
          notes: 'Walk-in booking is commission-exempt',
        },
      });
      return { amount: 0, status: CommissionStatus.NOT_ELIGIBLE };
    }

    // Rule: Only COMPLETED bookings incur commission
    if (booking.status !== 'COMPLETED') {
      return { amount: 0, status: CommissionStatus.NOT_ELIGIBLE };
    }

    const rate = booking.salon.commissionRate || 5.0; // 5% default
    const commissionAmount = Math.round((booking.totalPrice * (rate / 100)) * 100) / 100;

    // Update booking record snapshot
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        commissionRate: rate,
        commissionAmount,
      },
    });

    // Immutable ledger record
    const ledger = await prisma.commissionLedger.create({
      data: {
        salonId: booking.salonId,
        bookingId: booking.id,
        amount: commissionAmount,
        rate,
        status: CommissionStatus.DUE,
        notes: `Platform fee (${rate}%) for completed online booking ${booking.tokenNumber}`,
      },
    });

    return ledger;
  }

  /**
   * Reverse commission if booking is cancelled or refunded
   */
  static async reverseCommission(bookingId: string, reason: string) {
    const existing = await prisma.commissionLedger.findFirst({
      where: { bookingId, status: { in: [CommissionStatus.DUE, CommissionStatus.PENDING] } },
    });

    if (!existing) return null;

    const reversed = await prisma.$transaction(async (tx) => {
      const updated = await tx.commissionLedger.update({
        where: { id: existing.id },
        data: {
          status: CommissionStatus.REVERSED,
          notes: `${existing.notes} | REVERSED: ${reason}`,
        },
      });

      await tx.commissionAdjustment.create({
        data: {
          ledgerId: existing.id,
          amount: -existing.amount,
          reason,
          createdBy: 'SYSTEM_REVERSAL',
        },
      });

      return updated;
    });

    return reversed;
  }

  /**
   * Get salon commission summary for owner
   */
  static async getSalonCommissionSummary(salonId: string) {
    const ledgers = await prisma.commissionLedger.findMany({
      where: { salonId },
      include: {
        booking: {
          select: {
            tokenNumber: true,
            totalPrice: true,
            bookingSource: true,
            scheduledDate: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalDue = ledgers
      .filter((l) => l.status === CommissionStatus.DUE)
      .reduce((sum, l) => sum + l.amount, 0);

    const totalSettled = ledgers
      .filter((l) => l.status === CommissionStatus.SETTLED)
      .reduce((sum, l) => sum + l.amount, 0);

    const totalEligibleBookings = ledgers.filter(
      (l) => l.status === CommissionStatus.DUE || l.status === CommissionStatus.SETTLED
    ).length;

    return {
      totalDue: Math.round(totalDue * 100) / 100,
      totalSettled: Math.round(totalSettled * 100) / 100,
      totalEligibleBookings,
      ledgers,
    };
  }
}
