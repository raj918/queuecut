import { Router } from 'express';
import { BookingsController } from './bookings.controller';
import { validate } from '../../middleware/validate';
import { CreateBookingSchema, CancelBookingSchema } from './bookings.schema';
import { authenticateJwt, requireRole } from '../../middleware/auth';

const router = Router();

router.use(authenticateJwt);

router.post('/', requireRole('CUSTOMER'), validate(CreateBookingSchema), BookingsController.create);
router.get('/my', requireRole('CUSTOMER'), BookingsController.getMy);
router.get('/:id', BookingsController.getById);
router.post('/:id/cancel', validate(CancelBookingSchema), BookingsController.cancel);
router.post('/:id/check-in', requireRole('CUSTOMER'), BookingsController.checkIn);

export default router;
