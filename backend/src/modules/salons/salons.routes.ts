import { Router } from 'express';
import { SalonsController } from './salons.controller';
import { validate } from '../../middleware/validate';
import { CreateSalonsSchema, UpdateSalonSchema } from './salons.schema';
import { authenticateJwt, requireRole, requireSalonOwner } from '../../middleware/auth';

const router = Router();

// Public routes
router.get('/nearby', SalonsController.getNearby);
router.get('/:id', SalonsController.getById);

// Salon Owner routes
router.post('/', authenticateJwt, requireRole('SALON_OWNER'), validate(CreateSalonsSchema), SalonsController.create);
router.patch('/:id', authenticateJwt, requireRole('SALON_OWNER'), requireSalonOwner, validate(UpdateSalonSchema), SalonsController.update);

export default router;
