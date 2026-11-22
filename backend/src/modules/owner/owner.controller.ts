import { Request, Response, NextFunction } from 'express';
import { OwnerService } from './owner.service';
import { sendSuccess, sendError } from '../../utils/response';

export class OwnerController {
  static async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return sendError(res, 'Unauthenticated', 401);
      const dashboard = await OwnerService.getDashboard(req.user.userId);
      return sendSuccess(res, dashboard, 'Owner dashboard retrieved');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to get owner dashboard', 400);
    }
  }

  static async getBookings(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return sendError(res, 'Unauthenticated', 401);

      const { date, status, staffId, source } = req.query as any;
      const bookings = await OwnerService.getOwnerBookings(req.user.userId, {
        date,
        status,
        staffId,
        source,
      });

      return sendSuccess(res, bookings, 'Salon bookings retrieved');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to get bookings', 400);
    }
  }

  static async getCommission(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return sendError(res, 'Unauthenticated', 401);

      const commission = await OwnerService.getOwnerCommission(req.user.userId);
      return sendSuccess(res, commission, 'Commission report retrieved');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to get commission summary', 400);
    }
  }
}
