# QueueCut — Deployment & Hosting Guide

This guide details deploying the QueueCut backend to Vercel and connecting it to Supabase PostgreSQL and Firebase Cloud Messaging within the free-tier showcase architecture.

---

## 1. Free-Tier Architecture & Quota Summary

| Service | Role | Free Tier Capacity | Upgrade / Limits |
| :--- | :--- | :--- | :--- |
| **Vercel** | Serverless Node.js API | 100GB-hours / month, 10s execution timeout per function | Pro tier (\$20/mo) for 60s functions |
| **Supabase** | PostgreSQL Database & Realtime | 500MB database storage, 2 active projects, 200 concurrent Realtime connections | Pro (\$25/mo) for 8GB storage |
| **Firebase (Google)**| FCM Push Notifications | Unlimited FCM notifications at zero cost | No fee for cloud messaging |
| **OpenFreeMap / OSM**| MapLibre Map Tiles | Free vector tiles with worldwide coverage | Self-hosted or MapTiler free tier |

---

## 2. Supabase Database Configuration

1. Log in to [supabase.com](https://supabase.com) and create a project (e.g. `queuecut-kanpur`).
2. Go to **Project Settings** -> **Database**.
3. Copy your database connection strings:
   - **Direct Connection** (Port 5432):  
     `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`
   - **Connection Pooler (Transaction Mode)** (Port 6543):  
     `postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true`
4. Set these in your backend `.env`:
   ```bash
   DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
   DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
   ```
5. Run migrations and seed data:
   ```bash
   cd backend
   npx prisma migrate deploy
   npm run seed
   ```

---

## 3. Vercel Backend Deployment

### Option A: Using Vercel CLI (Recommended)

1. Install the Vercel CLI:
   ```bash
   npm install -g vercel
   ```
2. Link and deploy from workspace root:
   ```bash
   vercel
   ```
3. Set your production environment variables in Vercel:
   ```bash
   vercel env add DATABASE_URL
   vercel env add JWT_SECRET
   vercel env add JWT_REFRESH_SECRET
   vercel env add SUPABASE_URL
   vercel env add SUPABASE_ANON_KEY
   vercel env add FIREBASE_PROJECT_ID
   vercel env add FIREBASE_CLIENT_EMAIL
   vercel env add FIREBASE_PRIVATE_KEY
   ```
4. Deploy production build:
   ```bash
   vercel --prod
   ```

### Option B: Deploying via GitHub Git Integration

1. Push your repository to GitHub.
2. In the [Vercel Dashboard](https://vercel.com), click **Add New** -> **Project** and select your repository.
3. Configure settings:
   - **Framework Preset**: Other
   - **Root Directory**: `./`
   - **Build Command**: `cd backend && npm run prisma:generate && npm run build`
4. Enter the environment variables listed in `.env.example`.
5. Click **Deploy**.

---

## 4. Connecting Mobile App to Deployed Backend

Update `apps/mobile/.env` or `apps/mobile/src/services/api.ts`:

```typescript
export const API_BASE_URL = 'https://your-queuecut-app.vercel.app/api';
```
