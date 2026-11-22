import { Router } from 'express';
import { SalonsController } from './salons.controller';
import { validate } from '../../middleware/validate';
import { CreateSalonsSchema, UpdateSalonSchema } from './salons.schema';
import { authenticateJwt, requireRole, requireSalonOwner } from '../../middleware/auth';

const router = Router();

// Public routes
router.get('/nearby', SalonsController.getNearby);
router.get('/:id', SalonsController.getById);

// MVP Quick Owner endpoints (for simple salon partner app)
router.patch('/:id/manual-wait', async (req, res) => {
  try {
    const { id } = req.params;
    const { estimatedWaitMinutes } = req.body;
    const { prisma } = await import('../../database/prisma');
    const updated = await prisma.salon.update({
      where: { id },
      data: { pauseReason: `Manual Wait: ${estimatedWaitMinutes || 15}m` }
    });
    return res.json({ success: true, data: { ...updated, estimatedWaitMinutes: parseInt(estimatedWaitMinutes, 10) || 15 }, message: 'Waiting time updated' });
  } catch (e: any) {
    return res.status(500).json({ success: false, error: { message: e.message } });
  }
});

router.patch('/:id/toggle-status', async (req, res) => {
  try {
    const { id } = req.params;
    const { isOpen } = req.body;
    const { prisma } = await import('../../database/prisma');
    const updated = await prisma.salon.update({
      where: { id },
      data: { isOpen: Boolean(isOpen) }
    });
    return res.json({ success: true, data: updated, message: `Salon marked ${isOpen ? 'OPEN' : 'CLOSED'}` });
  } catch (e: any) {
    return res.status(500).json({ success: false, error: { message: e.message } });
  }
});

// Salon Owner routes
router.post('/', authenticateJwt, requireRole('SALON_OWNER'), validate(CreateSalonsSchema), SalonsController.create);
router.patch('/:id', authenticateJwt, requireRole('SALON_OWNER'), requireSalonOwner, validate(UpdateSalonSchema), SalonsController.update);

export default router;
