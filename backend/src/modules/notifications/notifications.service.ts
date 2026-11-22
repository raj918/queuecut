import { prisma } from '../../database/prisma';
import { getFirebaseMessaging } from '../../config/firebase';
import { broadcastRealtimeEvent } from '../../config/supabase';

export interface PushPayload {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  eventType: string;
}

export class NotificationsService {
  /**
   * Register or update an FCM device token for an authenticated user
   */
  static async registerDeviceToken(userId: string, token: string, platform: 'android' | 'ios' = 'android') {
    return prisma.deviceToken.upsert({
      where: { token },
      update: {
        userId,
        platform,
        lastActiveAt: new Date(),
      },
      create: {
        userId,
        token,
        platform,
        lastActiveAt: new Date(),
      },
    });
  }

  /**
   * Remove device token on logout
   */
  static async removeDeviceToken(token: string) {
    try {
      await prisma.deviceToken.deleteMany({
        where: { token },
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Core dispatch function: sends FCM message and records audit logs
   */
  static async sendNotification(payload: PushPayload): Promise<boolean> {
    try {
      // 1. Check user notification preferences
      const pref = await prisma.notificationPreference.findUnique({
        where: { userId: payload.userId },
      });

      if (pref && !pref.bookingUpdates && payload.eventType.includes('BOOKING')) {
        return false;
      }
      if (pref && !pref.queueAlerts && payload.eventType.includes('QUEUE')) {
        return false;
      }

      // 2. Fetch all device tokens registered for this user
      const devices = await prisma.deviceToken.findMany({
        where: { userId: payload.userId },
      });

      if (devices.length === 0) {
        // Log outbox as pending or no-device
        await prisma.notificationLog.create({
          data: {
            userId: payload.userId,
            title: payload.title,
            body: payload.body,
            eventType: payload.eventType,
            status: 'NO_ACTIVE_DEVICE',
            error: 'No FCM device tokens registered for this user',
          },
        });
        return false;
      }

      const messaging = getFirebaseMessaging();
      const tokens = devices.map((d) => d.token);

      if (!messaging) {
        // Fallback / mock mode when Firebase credentials are not yet supplied
        console.log(`[Push Notification Mock] To user ${payload.userId}: "${payload.title}" - ${payload.body}`);
        await prisma.notificationLog.create({
          data: {
            userId: payload.userId,
            title: payload.title,
            body: payload.body,
            eventType: payload.eventType,
            status: 'MOCK_DISPATCHED',
            error: null,
          },
        });
        return true;
      }

      // Send multicast push message via Firebase Admin SDK
      const response = await messaging.sendEachForMulticast({
        tokens,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data || {},
        android: {
          priority: 'high',
          notification: {
            channelId: 'queue_updates',
            sound: 'default',
            priority: 'high',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      });

      // Handle invalid / unregistered tokens cleanup
      const failedTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const errCode = resp.error?.code;
          if (
            errCode === 'messaging/invalid-registration-token' ||
            errCode === 'messaging/registration-token-not-registered'
          ) {
            failedTokens.push(tokens[idx]);
          }
        }
      });

      if (failedTokens.length > 0) {
        await prisma.deviceToken.deleteMany({
          where: { token: { in: failedTokens } },
        });
      }

      await prisma.notificationLog.create({
        data: {
          userId: payload.userId,
          title: payload.title,
          body: payload.body,
          eventType: payload.eventType,
          status: response.successCount > 0 ? 'DELIVERED' : 'FAILED',
          fcmMessageId: response.responses[0]?.messageId || null,
          error: response.failureCount > 0 ? `${response.failureCount} tokens failed` : null,
        },
      });

      return response.successCount > 0;
    } catch (error: any) {
      console.error('Error dispatching push notification:', error);
      await prisma.notificationLog.create({
        data: {
          userId: payload.userId,
          title: payload.title,
          body: payload.body,
          eventType: payload.eventType,
          status: 'ERROR',
          error: error.message || 'Unknown error',
        },
      });
      return false;
    }
  }

  // --- Specific Event Triggers ---

  static async notifyNewBookingToOwner(booking: any, salon: any) {
    if (!salon.ownerId) return;

    await this.sendNotification({
      userId: salon.ownerId,
      title: 'New Booking Received! ✂️',
      body: `Token ${booking.tokenNumber} has been booked for ₹${booking.totalPrice}. Check the live queue!`,
      data: {
        bookingId: booking.id,
        salonId: salon.id,
        screen: 'OwnerQueue',
      },
      eventType: 'OWNER_NEW_BOOKING',
    });

    // Realtime broadcast to owner salon channel
    await broadcastRealtimeEvent(`salon_${salon.id}`, 'NEW_BOOKING', {
      bookingId: booking.id,
      tokenNumber: booking.tokenNumber,
      status: booking.status,
    });
  }

  static async notifyCustomerBookingConfirmed(booking: any, salonName: string) {
    if (!booking.customerId) return;

    await this.sendNotification({
      userId: booking.customerId,
      title: 'Booking Confirmed! 🎟️',
      body: `Your token is ${booking.tokenNumber} at ${salonName}. We'll notify you when your turn approaches!`,
      data: {
        bookingId: booking.id,
        screen: 'QueueTracker',
      },
      eventType: 'CUSTOMER_BOOKING_CONFIRMED',
    });

    await broadcastRealtimeEvent(`booking_${booking.id}`, 'STATUS_UPDATED', {
      status: 'CONFIRMED',
      tokenNumber: booking.tokenNumber,
    });
  }

  static async notifyCustomerCalled(booking: any, salonName: string, barberName: string) {
    if (!booking.customerId) return;

    await this.sendNotification({
      userId: booking.customerId,
      title: "It's Your Turn! 💈",
      body: `${barberName} at ${salonName} is calling for Token ${booking.tokenNumber}. Please step up to the chair!`,
      data: {
        bookingId: booking.id,
        screen: 'QueueTracker',
      },
      eventType: 'CUSTOMER_CALLED',
    });

    await broadcastRealtimeEvent(`booking_${booking.id}`, 'STATUS_UPDATED', {
      status: 'CALLED',
      tokenNumber: booking.tokenNumber,
    });
    await broadcastRealtimeEvent(`salon_${booking.salonId}`, 'QUEUE_UPDATED', {
      bookingId: booking.id,
      status: 'CALLED',
    });
  }

  static async notifyServiceStarted(booking: any, salonName: string) {
    if (!booking.customerId) return;

    await this.sendNotification({
      userId: booking.customerId,
      title: 'Service Started ✂️',
      body: `Your styling session has officially started at ${salonName}. Enjoy your cut!`,
      data: {
        bookingId: booking.id,
        screen: 'QueueTracker',
      },
      eventType: 'CUSTOMER_SERVICE_STARTED',
    });

    await broadcastRealtimeEvent(`booking_${booking.id}`, 'STATUS_UPDATED', {
      status: 'IN_SERVICE',
    });
  }

  static async notifyServiceCompleted(booking: any, salonName: string) {
    if (!booking.customerId) return;

    await this.sendNotification({
      userId: booking.customerId,
      title: 'Service Completed! ✨',
      body: `Thank you for visiting ${salonName}! Please pay ₹${booking.totalPrice} directly at the counter.`,
      data: {
        bookingId: booking.id,
        screen: 'QueueTracker',
      },
      eventType: 'CUSTOMER_SERVICE_COMPLETED',
    });

    await broadcastRealtimeEvent(`booking_${booking.id}`, 'STATUS_UPDATED', {
      status: 'COMPLETED',
    });
    await broadcastRealtimeEvent(`salon_${booking.salonId}`, 'QUEUE_UPDATED', {
      bookingId: booking.id,
      status: 'COMPLETED',
    });
  }

  static async notifyBookingCancelled(booking: any, salonName: string, reason?: string) {
    if (!booking.customerId) return;

    await this.sendNotification({
      userId: booking.customerId,
      title: 'Booking Cancelled ❌',
      body: `Your token ${booking.tokenNumber} at ${salonName} has been cancelled.${reason ? ` Reason: ${reason}` : ''}`,
      data: {
        bookingId: booking.id,
        screen: 'Bookings',
      },
      eventType: 'CUSTOMER_BOOKING_CANCELLED',
    });

    await broadcastRealtimeEvent(`booking_${booking.id}`, 'STATUS_UPDATED', {
      status: 'CANCELLED',
    });
  }
}
