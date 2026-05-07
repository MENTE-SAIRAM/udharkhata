import { Router } from 'express';
import { generateNudge } from '../controllers/nudge.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.middleware.js';
import { generateNudgeSchema } from '../validators/nudge.validator.js';

const router = Router();

router.use(verifyJWT);

router.post('/generate', validate(generateNudgeSchema), generateNudge);

export default router;
