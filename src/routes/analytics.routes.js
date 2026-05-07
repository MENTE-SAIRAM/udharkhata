import { Router } from 'express';
import {
  summary,
  monthly,
  topContacts,
  categories,
} from '../controllers/analytics.controller.js';
import { verifyJWT, requirePremium } from '../middleware/auth.middleware.js';

const router = Router();

router.use(verifyJWT, requirePremium);

router.get('/summary', summary);
router.get('/monthly', monthly);
router.get('/top-contacts', topContacts);
router.get('/categories', categories);

export default router;
