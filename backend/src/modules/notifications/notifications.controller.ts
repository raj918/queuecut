import { Request, Response, NextFunction } from 'express';
import { NotificationsService } from './notifications.service';
import { prisma } from '../../database/prisma';
import { sendSuccess, sendError } from '../../utils/response';

export class NotificationsController {
  static async registerDevice(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return sendError(res, 'Unauthenticated', 401);
      const { token, platform } = req.body;

      if (!token) {
        return sendError(res, 'Device token is required', 400);
      }

      await NotificationsService.registerDeviceToken(req.user.userId, token, platform || 'android');
      return sendSuccess(res, { registered: true }, 'Device registered for push notifications');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to register device', 400);
    }
  }

  static async removeDevice(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.body;
      if (!token) return sendError(res, 'Device token is required', 400);

      await NotificationsService.removeDeviceToken(token);
      return sendSuccess(res, { removed: true }, 'Device unregistered');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to remove device', 400);
    }
  }

  static async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return sendError(res, 'Unauthenticated', 401);

      const logs = await prisma.notificationLog.findMany({
        where: { userId: req.user.userId },
        orderBy: { createdAt: 'desc' },
        take: 30,
      });

      return sendSuccess(res, logs, 'Notification history retrieved');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to get notification history', 400);
    }
  }

  static async updatePreferences(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return sendError(res, 'Unauthenticated', 401);

      const { bookingUpdates, queueAlerts, soundEnabled } = req.body;

      const updated = await prisma.notificationPreference.upsert({
        where: { userId: req.user.userId },
        update: {
          ...(bookingUpdates !== undefined ? { bookingUpdates } : {}),
          ...(queueAlerts !== undefined ? { queueAlerts } : {}),
          ...(soundEnabled !== undefined ? { soundEnabled } : {}),
        },
        create: {
          userId: req.user.userId,
          bookingUpdates: bookingUpdates ?? true,
          queueAlerts: queueAlerts ?? true,
          soundEnabled: soundEnabled ?? true,
        },
      });

      return sendSuccess(res, updated, 'Preferences updated successfully');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to update preferences', 400);
    }
  }

  /**
   * Development / test endpoint to trigger a push notification to oneself
   */
  static async sendTestNotification(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return sendError(res, 'Unauthenticated', 401);

      const sent = await NotificationsService.sendNotification({
        userId: req.user.userId,
        title: 'QueueCut Test Alert 💈',
        body: 'This is a test notification confirming FCM setup is active and reachable!',
        eventType: 'TEST_ALERT',
        data: { test: 'true', timestamp: Date.now().toString() },
      });

      return sendSuccess(res, { delivered: sent }, 'Test push message dispatched');
    } catch (error: any) {
      return sendError(res, error.message || 'Test push notification failed', 500);
    }
  }
}
