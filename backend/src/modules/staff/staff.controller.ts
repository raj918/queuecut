import { Request, Response, NextFunction } from 'express';
import { StaffService } from './staff.service';
import { sendSuccess, sendError } from '../../utils/response';

export class StaffController {
  static async getBySalon(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const staffList = await StaffService.getStaffBySalon(id);
      return sendSuccess(res, staffList, 'Staff list retrieved');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to get staff', 400);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const staff = await StaffService.createStaff(req.body);
      return sendSuccess(res, staff, 'Staff member added successfully', 201);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to add staff', 400);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updated = await StaffService.updateStaff(id, req.body);
      return sendSuccess(res, updated, 'Staff member updated successfully');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to update staff', 400);
    }
  }

  static async startBreak(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { durationMinutes, reason } = req.body;
      const b = await StaffService.startBreak(id, durationMinutes, reason);
      return sendSuccess(res, b, 'Staff break started');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to start break', 400);
    }
  }

  static async endBreak(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await StaffService.endBreak(id);
      return sendSuccess(res, { ended: true }, 'Staff break ended, marked available');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to end break', 400);
    }
  }
}
