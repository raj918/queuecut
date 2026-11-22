import { Router } from 'express';
import { OwnerController } from './owner.controller';
import { authenticateJwt, requireRole } from '../../middleware/auth';

const router = Router();

router.use(authenticateJwt);
router.use(requireRole('SALON_OWNER'));

router.get('/dashboard', OwnerController.getDashboard);
router.get('/bookings', OwnerController.getBookings);
router.get('/commission', OwnerController.getCommission);

export default router;
