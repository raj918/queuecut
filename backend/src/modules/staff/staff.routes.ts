import { Router } from 'express';
import { StaffController } from './staff.controller';
import { validate } from '../../middleware/validate';
import { CreateStaffSchema, UpdateStaffSchema, StaffBreakSchema } from './staff.schema';
import { authenticateJwt, requireRole } from '../../middleware/auth';

const router = Router();

// Public: view staff of a salon
router.get('/salons/:id/staff', StaffController.getBySalon);

// Owner routes
router.post(
  '/salons/:id/staff',
  authenticateJwt,
  requireRole('SALON_OWNER'),
  validate(CreateStaffSchema),
  StaffController.create
);

router.patch(
  '/:id',
  authenticateJwt,
  requireRole('SALON_OWNER'),
  validate(UpdateStaffSchema),
  StaffController.update
);

router.post(
  '/:id/break',
  authenticateJwt,
  requireRole('SALON_OWNER'),
  validate(StaffBreakSchema),
  StaffController.startBreak
);

router.post(
  '/:id/break/end',
  authenticateJwt,
  requireRole('SALON_OWNER'),
  StaffController.endBreak
);

export default router;
