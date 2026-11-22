import { Router } from 'express';
import { BookingsController } from './bookings.controller';
import { validate } from '../../middleware/validate';
import { CreateBookingSchema, CancelBookingSchema } from './bookings.schema';
import { authenticateJwt, requireRole } from '../../middleware/auth';

const router = Router();

// --- MVP Public Slot Request & Partner Flow (No token wall for fast onboarding) ---
router.post('/slot-request', BookingsController.requestSlot);
router.get('/public/:id', BookingsController.getPublicById);
router.get('/salon/:salonId/requests', BookingsController.getSalonRequests);
router.post('/:id/respond', BookingsController.respondToSlotRequest);
router.post('/:id/customer-confirm', BookingsController.customerConfirm);
router.post('/:id/start-service', BookingsController.startService);
router.post('/:id/complete-service', BookingsController.completeService);

// --- Authenticated routes ---
router.use(authenticateJwt);

router.post('/', requireRole('CUSTOMER'), validate(CreateBookingSchema), BookingsController.create);
router.get('/my', requireRole('CUSTOMER'), BookingsController.getMy);
router.get('/:id', BookingsController.getById);
router.post('/:id/cancel', validate(CancelBookingSchema), BookingsController.cancel);
router.post('/:id/check-in', requireRole('CUSTOMER'), BookingsController.checkIn);

export default router;
