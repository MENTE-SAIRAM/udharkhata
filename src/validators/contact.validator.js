import { z } from 'zod';

export const createContactSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(100),
    phone: z.string().min(10, 'Phone number is required'),
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
    phone: z.string().min(10).optional(),
    colorHex: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/, 'Invalid hex color')
      .optional(),
    avatarUrl: z.string().url().optional(),
    notes: z.string().max(500).optional(),
  }),
});
