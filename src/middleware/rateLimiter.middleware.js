import rateLimit from 'express-rate-limit';
import ApiError from '../utils/ApiError.js';

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
  handler: (req, res, next) => {
    next(new ApiError(429, 'Too many OTP requests. Please try again after an hour.'));
  },
});

export { generalLimiter, otpLimiter };
