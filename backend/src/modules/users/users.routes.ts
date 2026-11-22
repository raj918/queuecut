import { Router } from 'express';
import { UsersController } from './users.controller';
import { authenticateJwt } from '../../middleware/auth';

const router = Router();

router.use(authenticateJwt);

router.patch('/profile', UsersController.updateProfile);
router.get('/favorites', UsersController.getFavorites);
router.post('/favorites/toggle', UsersController.toggleFavorite);

export default router;
