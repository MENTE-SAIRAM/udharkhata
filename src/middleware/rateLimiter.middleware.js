import rateLimit from 'express-rate-limit';
import ApiError from '../utils/ApiError.js';

const OTP_RATE_LIMIT_BYPASS_PHONE = '8712173349';

const normalizePhone = (phone) => String(phone || '').replace(/\D/g, '').slice(-10);

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new ApiError(429, 'Too many requests. Please try again after 15 minutes.'));
  },
});

const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.body?.phone || req.ip,
  skip: (req) => normalizePhone(req.body?.phone) === OTP_RATE_LIMIT_BYPASS_PHONE,
  handler: (req, res, next) => {
    next(new ApiError(429, 'Too many OTP requests. Please try again after an hour.'));
  },
});

export { generalLimiter, otpLimiter };
