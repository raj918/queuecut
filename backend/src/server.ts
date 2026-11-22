import app from './app';
import { ENV } from './config/env';
import { connectDatabase } from './database/prisma';
import { initializeFirebase } from './config/firebase';

const PORT = ENV.PORT || 5000;

async function bootstrap() {
  console.log(`💈 Starting ${ENV.APP_NAME} Backend Services...`);

  // Connect Database
  await connectDatabase();

  // Initialize Firebase Admin (optional fallback if credentials not set yet)
  initializeFirebase();

  // Start HTTP Server
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 QueueCut Server running on http://0.0.0.0:${PORT}`);
    console.log(`📍 API endpoints available at http://localhost:${PORT}/api`);
    console.log(`🩺 Health check: http://localhost:${PORT}/api/health`);
  });
}

bootstrap().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
