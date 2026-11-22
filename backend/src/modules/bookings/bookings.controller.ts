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
}
