import { Router } from 'express';
import {
  sendOTPHandler,
  verifyOTPHandler,
  refreshTokenHandler,
  logoutHandler,
  updateProfileHandler,
  updateFCMTokenHandler,
} from '../controllers/auth.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';
import { otpLimiter } from '../middleware/rateLimiter.middleware.js';
import validate from '../middleware/validate.middleware.js';
import {
  sendOTPSchema,
  verifyOTPSchema,
  updateProfileSchema,
  updateFCMTokenSchema,
} from '../validators/auth.validator.js';

const router = Router();

router.post('/send-otp', otpLimiter, validate(sendOTPSchema), sendOTPHandler);
router.post('/verify-otp', otpLimiter, validate(verifyOTPSchema), verifyOTPHandler);
router.post('/refresh', refreshTokenHandler);
router.post('/logout', verifyJWT, logoutHandler);
router.put('/profile', verifyJWT, validate(updateProfileSchema), updateProfileHandler);
router.put('/fcm-token', verifyJWT, validate(updateFCMTokenSchema), updateFCMTokenHandler);

export default router;
