import { Request, Response, NextFunction } from 'express';
import { QueueService } from './queue.service';
import { sendSuccess, sendError } from '../../utils/response';

export class QueueController {
  static async getLiveQueue(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params; // salonId
      const liveQueue = await QueueService.getLiveQueue(id);
      return sendSuccess(res, liveQueue, 'Live queue retrieved successfully');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to get live queue', 400);
    }
  }

  static async getBookingQueuePosition(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params; // bookingId
      const position = await QueueService.getBookingQueuePosition(id);
      return sendSuccess(res, position, 'Queue position retrieved successfully');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to get queue position', 400);
    }
  }

  static async addWalkIn(req: Request, res: Response, next: NextFunction) {
    try {
      const booking = await QueueService.addWalkIn(req.body);
      return sendSuccess(res, booking, 'Walk-in added to queue successfully', 201);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to add walk-in', 400);
    }
  }

  static async callCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { staffId } = req.body || {};
      const booking = await QueueService.callCustomer(id, staffId, 'OWNER');
      return sendSuccess(res, booking, 'Customer called successfully');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to call customer', 400);
    }
  }

  static async startService(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const booking = await QueueService.startService(id, 'OWNER');
      return sendSuccess(res, booking, 'Service started successfully');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to start service', 400);
    }
  }

  static async completeService(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const booking = await QueueService.completeService(id, 'OWNER');
      return sendSuccess(res, booking, 'Service completed successfully');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to complete service', 400);
    }
  }

  static async skipCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { reason } = req.body || {};
      const booking = await QueueService.skipCustomer(id, reason, 'OWNER');
      return sendSuccess(res, booking, 'Customer skipped');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to skip customer', 400);
    }
  }

  static async markNoShow(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { reason } = req.body || {};
      const booking = await QueueService.markNoShow(id, reason, 'OWNER');
      return sendSuccess(res, booking, 'Marked as no show');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to mark as no show', 400);
    }
  }

  static async pauseQueue(req: Request, res: Response, next: NextFunction) {
    try {
      const { salonId, reason } = req.body;
      const salon = await QueueService.pauseQueue(salonId, reason);
      return sendSuccess(res, salon, 'Queue paused successfully');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to pause queue', 400);
    }
  }

  static async resumeQueue(req: Request, res: Response, next: NextFunction) {
    try {
      const { salonId } = req.body;
      const salon = await QueueService.resumeQueue(salonId);
      return sendSuccess(res, salon, 'Queue resumed successfully');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to resume queue', 400);
    }
  }
}
