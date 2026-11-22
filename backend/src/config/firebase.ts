import * as admin from 'firebase-admin';
import { ENV } from './env';

let firebaseApp: admin.app.App | null = null;

export function initializeFirebase(): admin.app.App | null {
  if (firebaseApp) return firebaseApp;

  if (ENV.FIREBASE_PROJECT_ID && ENV.FIREBASE_CLIENT_EMAIL && ENV.FIREBASE_PRIVATE_KEY) {
    try {
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: ENV.FIREBASE_PROJECT_ID,
          clientEmail: ENV.FIREBASE_CLIENT_EMAIL,
          privateKey: ENV.FIREBASE_PRIVATE_KEY,
        }),
      });
      console.log('✅ Firebase Admin SDK initialized for FCM push notifications');
      return firebaseApp;
    } catch (error) {
      console.warn('⚠️ Error initializing Firebase Admin SDK:', error);
      return null;
    }
  } else {
    console.log('ℹ️ Firebase credentials not provided in ENV. FCM push notifications running in fallback mode.');
    return null;
  }
}

export function getFirebaseMessaging(): admin.messaging.Messaging | null {
  const app = initializeFirebase();
  if (!app) return null;
  return admin.messaging(app);
}
