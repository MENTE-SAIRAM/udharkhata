import { z } from 'zod';

export const createContactSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(100),
    phone: z.string().regex(/^\d{10}$/, 'Phone number must be exactly 10 digits'),
    colorHex: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/, 'Invalid hex color')
      .optional(),
    avatarUrl: z.string().url().optional(),
    notes: z.string().max(500).optional(),
  }),
});

export const updateContactSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    phone: z.string().regex(/^\d{10}$/, 'Phone number must be exactly 10 digits').optional(),
    colorHex: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/, 'Invalid hex color')
      .optional(),
    avatarUrl: z.string().url().optional(),
    notes: z.string().max(500).optional(),
  }),
});
