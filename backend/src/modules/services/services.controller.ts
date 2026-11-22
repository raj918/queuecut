import { Request, Response, NextFunction } from 'express';
import { ServicesService } from './services.service';
import { sendSuccess, sendError } from '../../utils/response';

export class ServicesController {
  static async getBySalon(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const services = await ServicesService.getServicesBySalon(id);
      return sendSuccess(res, services, 'Services retrieved');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to get services', 400);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const service = await ServicesService.createService(req.body);
      return sendSuccess(res, service, 'Service created successfully', 201);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to create service', 400);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updated = await ServicesService.updateService(id, req.body);
      return sendSuccess(res, updated, 'Service updated successfully');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to update service', 400);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await ServicesService.deleteService(id);
      return sendSuccess(res, { deleted: true }, 'Service disabled successfully');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to delete service', 400);
    }
  }
}
