# QueueCut — Firebase Cloud Messaging Setup Guide

This guide details configuring Firebase Cloud Messaging for native push notifications on Android & iOS without exposing private credentials in client code.

---

## 1. Firebase Console Project Setup

1. Open the [Firebase Console](https://console.firebase.google.com).
2. Click **Add Project** and name it `QueueCut` (or `queuecut-production`).
3. Google Analytics can be toggled on or off according to preference.

---

## 2. Android Configuration (`com.queuecut`)

1. In Project Overview, click the **Android** icon to add an Android app.
2. Enter the exact Android package name:
   ```
   com.queuecut
   ```
3. Enter App nickname: `QueueCut Android`.
4. Register the app and download `google-services.json`.
5. Place this file in:
   ```
   apps/mobile/android/app/google-services.json
   ```
6. The Android gradle setup has already been configured with:
   - Root `android/build.gradle`: `classpath("com.google.gms:google-services:4.4.2")`
   - App `android/app/build.gradle`: `apply plugin: 'com.google.gms.google-services'`

---

## 3. Backend Service Account Credentials

To allow the Node.js backend to dispatch push notifications:

1. In Firebase Console, go to **Project Settings** (gear icon) -> **Service Accounts**.
2. Click **Generate new private key** and confirm.
3. A JSON file will download. Open it and extract:
   - `project_id`
   - `client_email`
   - `private_key`
4. Add these to `backend/.env`:
   ```bash
   FIREBASE_PROJECT_ID="your-project-id"
   FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com"
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
   ```

---

## 4. Testing Push Notifications

The backend includes a dedicated test notification endpoint:
```bash
POST /api/notifications/test
Authorization: Bearer <your_access_token>
```

When called, the server looks up the user's registered FCM device token and dispatches a heads-up test notification through the `queue_updates` Android channel.
