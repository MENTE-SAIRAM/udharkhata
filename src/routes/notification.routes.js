import { Router } from 'express';
import {
  getNotifications,
  markAllRead,
} from '../controllers/notification.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';

const router = Router();

router.use(verifyJWT);

router.get('/', getNotifications);
router.put('/read-all', markAllRead);

export default router;
