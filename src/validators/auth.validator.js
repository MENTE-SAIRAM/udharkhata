import { z } from 'zod';

export const sendOTPSchema = z.object({
  body: z.object({
    phone: z
      .string()
      .regex(/^\+91[0-9]{10}$/, 'Phone must be in +91 format with 10 digits'),
  }),
});

export const verifyOTPSchema = z.object({
  body: z.object({
    phone: z
      .string()
      .regex(/^\+91[0-9]{10}$/, 'Phone must be in +91 format with 10 digits'),
    otp: z.string().length(6, 'OTP must be 6 digits'),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(50).optional(),
    avatarUrl: z.string().url().optional(),
  }),
});

export const updateFCMTokenSchema = z.object({
  body: z.object({
    fcmToken: z.string().min(1, 'FCM token is required'),
  }),
});
