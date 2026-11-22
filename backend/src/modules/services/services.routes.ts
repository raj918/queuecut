import { Router } from 'express';
import { ServicesController } from './services.controller';
import { validate } from '../../middleware/validate';
import { CreateServiceSchema, UpdateServiceSchema } from './services.schema';
import { authenticateJwt, requireRole, requireSalonOwner } from '../../middleware/auth';

const router = Router();

// Public: view services of a salon
router.get('/salons/:id/services', ServicesController.getBySalon);

// Owner routes
router.post(
  '/salons/:id/services',
  authenticateJwt,
  requireRole('SALON_OWNER'),
  requireSalonOwner,
  validate(CreateServiceSchema),
  ServicesController.create
);

router.patch(
  '/:id',
  authenticateJwt,
  requireRole('SALON_OWNER'),
  validate(UpdateServiceSchema),
  ServicesController.update
);

router.delete(
  '/:id',
  authenticateJwt,
  requireRole('SALON_OWNER'),
  ServicesController.delete
);

export default router;
