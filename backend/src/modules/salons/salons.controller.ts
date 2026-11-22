import { Request, Response, NextFunction } from 'express';
import { SalonsService } from './salons.service';
import { sendSuccess, sendError } from '../../utils/response';

export class SalonsController {
  static async getNearby(req: Request, res: Response, next: NextFunction) {
    try {
      const { latitude, longitude, radiusMeters, category, search } = req.query as any;

      if (!latitude || !longitude) {
        return sendError(res, 'Latitude and longitude are required query parameters', 400);
      }

      const salons = await SalonsService.findNearbySalons({
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        radiusMeters: radiusMeters ? parseInt(radiusMeters, 10) : 500,
        category: category as string,
        search: search as string,
      });

      return sendSuccess(res, salons, 'Nearby salons retrieved successfully', 200, {
        count: salons.length,
        radiusMeters: radiusMeters ? parseInt(radiusMeters, 10) : 500,
        center: { latitude: parseFloat(latitude), longitude: parseFloat(longitude) },
      });
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to search salons', 500);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { lat, lon } = req.query as any;
      const userLat = lat ? parseFloat(lat) : undefined;
      const userLon = lon ? parseFloat(lon) : undefined;

      const salon = await SalonsService.getSalonDetails(id, userLat, userLon);
      return sendSuccess(res, salon, 'Salon details retrieved');
    } catch (error: any) {
      return sendError(res, error.message || 'Salon not found', 404);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'SALON_OWNER') {
        return sendError(res, 'Only salon owners can register a salon', 403);
      }

      const salon = await SalonsService.createSalon(req.user.userId, req.body);
      return sendSuccess(res, salon, 'Salon created successfully', 201);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to create salon', 400);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updated = await SalonsService.updateSalon(id, req.body);
      return sendSuccess(res, updated, 'Salon updated successfully');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to update salon', 400);
    }
  }
}
