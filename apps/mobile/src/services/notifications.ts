import { Platform, PermissionsAndroid } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';
import { api } from './api';

export class MobileNotificationService {
  /**
   * Create Android Notification Channel
   */
  static async setupChannels() {
    if (Platform.OS === 'android') {
      await notifee.createChannel({
        id: 'queue_updates',
        name: 'Queue & Booking Updates',
        importance: AndroidImportance.HIGH,
        sound: 'default',
        vibration: true,
      });
    }
  }

  /**
   * Request native push notification permission
   */
  static async requestPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        if (Platform.Version >= 33) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
        return true;
      } else {
        const authStatus = await messaging().requestPermission();
        return (
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL
        );
      }
    } catch (e) {
      console.warn('Could not request notification permission:', e);
      return false;
    }
  }

  /**
   * Retrieve device FCM token and register with backend
   */
  static async registerDeviceWithBackend(): Promise<string | null> {
    try {
      await this.setupChannels();
      const hasPerm = await this.requestPermission();
      if (!hasPerm) return null;

      let fcmToken = '';
      try {
        fcmToken = await messaging().getToken();
      } catch (err) {
        // Fallback for emulator or unconfigured Google Play services
        fcmToken = `sim_token_${Platform.OS}_${Date.now()}`;
      }

      if (fcmToken) {
        await api.post('/notifications/register-device', {
          token: fcmToken,
          platform: Platform.OS,
        });
        return fcmToken;
      }
      return null;
    } catch (error) {
      console.warn('Failed to register FCM device token with backend:', error);
      return null;
    }
  }

  /**
   * Listen to foreground push messages and show local heads-up notification
   */
  static setupForegroundListener(onNotificationTap?: (data: any) => void) {
    try {
      return messaging().onMessage(async (remoteMessage) => {
        if (remoteMessage.notification) {
          await notifee.displayNotification({
            title: remoteMessage.notification.title || 'QueueCut Alert',
            body: remoteMessage.notification.body || '',
            data: remoteMessage.data,
            android: {
              channelId: 'queue_updates',
              importance: AndroidImportance.HIGH,
              pressAction: {
                id: 'default',
              },
            },
          });
        }
      });
    } catch {
      return () => {};
    }
  }
}
