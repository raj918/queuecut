import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { ENV } from './config/env';
import { errorHandler } from './middleware/errorHandler';

// Route modules
import authRoutes from './modules/auth/auth.routes';
import salonsRoutes from './modules/salons/salons.routes';
import servicesRoutes from './modules/services/services.routes';
import staffRoutes from './modules/staff/staff.routes';
import bookingsRoutes from './modules/bookings/bookings.routes';
import queueRoutes from './modules/queue/queue.routes';
import ownerRoutes from './modules/owner/owner.routes';
import notificationsRoutes from './modules/notifications/notifications.routes';
import usersRoutes from './modules/users/users.routes';

const app: Application = express();

// Security and utility middleware
app.use(helmet());
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (ENV.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// System Health Endpoints
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'QueueCut API',
  });
});

app.get('/api/version', (req: Request, res: Response) => {
  res.status(200).json({
    version: '1.0.0',
    platform: 'QueueCut Indian Salon Discovery & Digital Queue Platform',
    environment: ENV.NODE_ENV,
    region: 'Kanpur, UP Showcase',
  });
});

// Mount Feature Modules
app.use('/api/auth', authRoutes);
app.use('/api/salons', salonsRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/owner', ownerRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/users', usersRoutes);

// Catch-all 404
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      message: `Route ${req.method} ${req.originalUrl} not found`,
      statusCode: 404,
    },
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

export default app;
