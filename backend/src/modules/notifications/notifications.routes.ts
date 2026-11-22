import { Router } from 'express';
import { NotificationsController } from './notifications.controller';
import { authenticateJwt } from '../../middleware/auth';

const router = Router();

router.use(authenticateJwt);

router.post('/register-device', NotificationsController.registerDevice);
router.delete('/remove-device', NotificationsController.removeDevice);
router.get('/', NotificationsController.getHistory);
router.patch('/preferences', NotificationsController.updatePreferences);
router.post('/test', NotificationsController.sendTestNotification);

export default router;
