import { Router } from 'express';
import { exportPDF, exportCSV } from '../controllers/export.controller.js';
import { verifyJWT, requirePremium } from '../middleware/auth.middleware.js';

const router = Router();

router.use(verifyJWT, requirePremium);

router.get('/pdf', exportPDF);
router.get('/csv', exportCSV);

export default router;
