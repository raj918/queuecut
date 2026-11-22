import { Router } from 'express';
import { QueueController } from './queue.controller';
import { validate } from '../../middleware/validate';
import { WalkInSchema, QueueActionSchema, PauseQueueSchema, ResumeQueueSchema } from './queue.schema';
import { authenticateJwt, requireRole } from '../../middleware/auth';

const router = Router();

// Public / Customer: View live salon queue & check individual booking position
router.get('/salons/:id/queue', QueueController.getLiveQueue);
router.get('/bookings/:id/queue-position', QueueController.getBookingQueuePosition);

// Salon Owner Queue Actions
router.post(
  '/walk-in',
  authenticateJwt,
  requireRole('SALON_OWNER'),
  validate(WalkInSchema),
  QueueController.addWalkIn
);

router.post(
  '/:id/call',
  authenticateJwt,
  requireRole('SALON_OWNER'),
  validate(QueueActionSchema),
  QueueController.callCustomer
);

router.post(
  '/:id/start',
  authenticateJwt,
  requireRole('SALON_OWNER'),
  validate(QueueActionSchema),
  QueueController.startService
);

router.post(
  '/:id/complete',
  authenticateJwt,
  requireRole('SALON_OWNER'),
  validate(QueueActionSchema),
  QueueController.completeService
);

router.post(
  '/:id/skip',
  authenticateJwt,
  requireRole('SALON_OWNER'),
  validate(QueueActionSchema),
  QueueController.skipCustomer
);

router.post(
  '/:id/no-show',
  authenticateJwt,
  requireRole('SALON_OWNER'),
  validate(QueueActionSchema),
  QueueController.markNoShow
);

router.post(
  '/pause',
  authenticateJwt,
  requireRole('SALON_OWNER'),
  validate(PauseQueueSchema),
  QueueController.pauseQueue
);

router.post(
  '/resume',
  authenticateJwt,
  requireRole('SALON_OWNER'),
  validate(ResumeQueueSchema),
  QueueController.resumeQueue
);

export default router;
