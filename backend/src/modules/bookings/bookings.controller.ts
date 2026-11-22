import { Request, Response, NextFunction } from 'express';
import { BookingsService } from './bookings.service';
import { sendSuccess, sendError } from '../../utils/response';

export class BookingsController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return sendError(res, 'Unauthenticated', 401);

      const booking = await BookingsService.createBooking(req.user.userId, req.body);
      return sendSuccess(res, booking, 'Token booked successfully', 201);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to create booking', 400);
    }
  }

  static async getMy(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return sendError(res, 'Unauthenticated', 401);

      const { tab } = req.query as any;
      const bookings = await BookingsService.getMyBookings(req.user.userId, tab);
      return sendSuccess(res, bookings, 'My bookings retrieved');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to get bookings', 400);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return sendError(res, 'Unauthenticated', 401);

      const { id } = req.params;
      const booking = await BookingsService.getBookingById(id, req.user.userId, req.user.role);
      return sendSuccess(res, booking, 'Booking details retrieved');
    } catch (error: any) {
      return sendError(res, error.message || 'Booking not found', 404);
    }
  }

  static async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return sendError(res, 'Unauthenticated', 401);

      const { id } = req.params;
      const { reason } = req.body || {};
      const updated = await BookingsService.cancelBooking(id, req.user.userId, req.user.role, reason);
      return sendSuccess(res, updated, 'Booking cancelled successfully');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to cancel booking', 400);
    }
  }

  static async checkIn(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return sendError(res, 'Unauthenticated', 401);

      const { id } = req.params;
      const updated = await BookingsService.checkInBooking(id, req.user.userId);
      return sendSuccess(res, updated, 'Checked in successfully');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to check in', 400);
    }
  }

  // --- MVP Slot Request & Simple Salon Partner Flow ---

  static async requestSlot(req: Request, res: Response, next: NextFunction) {
    try {
      const { salonId, customerName, customerPhone, serviceIds, preferredTime, customerNotes } = req.body;

      if (!salonId || !customerName || !customerPhone) {
        return sendError(res, 'salonId, customerName, and customerPhone are required', 400);
      }

      const todayStr = new Date().toISOString().split('T')[0];
      const tokenRandom = Math.floor(100 + Math.random() * 900);
      const tokenNumber = `QC-${tokenRandom}`;
      const bookingNumber = `QC-${todayStr.replace(/-/g, '')}-${tokenRandom}`;

      const { prisma } = await import('../../database/prisma');
      const { BookingSource, BookingStatus } = await import('@prisma/client');

      // Fetch salon services if IDs provided, or use default estimate
      let totalPrice = 250.0;
      let totalDurationMinutes = 30;
      let serviceNames: string[] = ['Haircut'];

      if (serviceIds && Array.isArray(serviceIds) && serviceIds.length > 0) {
        const services = await prisma.service.findMany({
          where: { id: { in: serviceIds }, salonId }
        });
        if (services.length > 0) {
          totalPrice = services.reduce((sum, s) => sum + s.price, 0);
          totalDurationMinutes = services.reduce((sum, s) => sum + s.durationMinutes, 0);
          serviceNames = services.map(s => s.name);
        }
      }

      const noteText = `Preferred: ${preferredTime || 'ASAP'}${customerNotes ? ' | ' + customerNotes : ''}`;

      const booking = await prisma.booking.create({
        data: {
          salonId,
          walkInCustomerName: customerName,
          walkInCustomerPhone: customerPhone,
          bookingNumber,
          tokenNumber,
          bookingSource: BookingSource.ONLINE,
          status: BookingStatus.WAITING,
          scheduledDate: todayStr,
          totalPrice,
          totalDurationMinutes,
          customerNotes: noteText,
        },
        include: {
          salon: {
            select: { id: true, name: true, locality: true, city: true, phone: true }
          }
        }
      });

      return sendSuccess(res, {
        ...booking,
        serviceNames,
        preferredTime: preferredTime || 'ASAP',
        slotStatus: 'PENDING'
      }, 'Slot request submitted to salon successfully', 201);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to submit slot request', 500);
    }
  }

  static async getPublicById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { prisma } = await import('../../database/prisma');

      const booking = await prisma.booking.findUnique({
        where: { id },
        include: {
          salon: {
            select: { id: true, name: true, locality: true, city: true, phone: true, coverImage: true }
          },
          bookingServices: true
        }
      });

      if (!booking) {
        return sendError(res, 'Booking request not found', 404);
      }

      return sendSuccess(res, booking, 'Booking status retrieved');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to get booking', 500);
    }
  }

  static async getSalonRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const { salonId } = req.params;
      const { prisma } = await import('../../database/prisma');

      const bookings = await prisma.booking.findMany({
        where: { salonId },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          bookingServices: true
        }
      });

      return sendSuccess(res, bookings, 'Salon requests retrieved');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to get salon requests', 500);
    }
  }

  static async respondToSlotRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { action, suggestedTime, rejectionReason } = req.body;
      const { prisma } = await import('../../database/prisma');
      const { BookingStatus } = await import('@prisma/client');

      let newStatus: any = BookingStatus.WAITING;
      let updatedNotes = '';

      if (action === 'ACCEPT') {
        newStatus = BookingStatus.CONFIRMED;
        updatedNotes = `[ACCEPTED] Arrival confirmed`;
      } else if (action === 'SUGGEST_TIME') {
        newStatus = BookingStatus.WAITING;
        updatedNotes = `[SUGGESTED_TIME: ${suggestedTime || 'In 30 mins'}]`;
      } else if (action === 'REJECT') {
        newStatus = BookingStatus.CANCELLED;
        updatedNotes = `[REJECTED: ${rejectionReason || 'Salon is currently full'}]`;
      }

      const existing = await prisma.booking.findUnique({ where: { id } });
      if (!existing) return sendError(res, 'Booking not found', 404);

      const updated = await prisma.booking.update({
        where: { id },
        data: {
          status: newStatus,
          customerNotes: existing.customerNotes ? `${existing.customerNotes} | ${updatedNotes}` : updatedNotes,
          cancellationReason: action === 'REJECT' ? (rejectionReason || 'Salon is currently full') : existing.cancellationReason
        }
      });

      return sendSuccess(res, updated, `Slot request ${action} processed`);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to respond to slot request', 500);
    }
  }

  static async customerConfirm(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { prisma } = await import('../../database/prisma');
      const { BookingStatus } = await import('@prisma/client');

      const updated = await prisma.booking.update({
        where: { id },
        data: {
          status: BookingStatus.CHECKED_IN,
          checkInTime: new Date()
        }
      });

      return sendSuccess(res, updated, 'Customer confirmed arrival window');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to confirm', 500);
    }
  }

  static async startService(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { prisma } = await import('../../database/prisma');
      const { BookingStatus } = await import('@prisma/client');

      const updated = await prisma.booking.update({
        where: { id },
        data: {
          status: BookingStatus.IN_SERVICE,
          serviceStartTime: new Date()
        }
      });

      return sendSuccess(res, updated, 'Service started successfully');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to start service', 500);
    }
  }

  static async completeService(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { prisma } = await import('../../database/prisma');
      const { BookingStatus } = await import('@prisma/client');

      const updated = await prisma.booking.update({
        where: { id },
        data: {
          status: BookingStatus.COMPLETED,
          serviceEndTime: new Date()
        }
      });

      return sendSuccess(res, updated, 'Service completed successfully');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to complete service', 500);
    }
  }
}
