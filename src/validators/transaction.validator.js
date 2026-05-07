import { z } from 'zod';
import { TRANSACTION_TYPES, CATEGORY_TAGS } from '../utils/constants.js';

export const createTransactionSchema = z.object({
  body: z.object({
    contactId: z.string().min(1, 'Contact ID is required'),
    type: z.enum(TRANSACTION_TYPES),
    amount: z.number().int().min(1, 'Amount must be at least 1 paise'),
    note: z.string().max(500).optional(),
    date: z.string().optional(),
    dueDate: z.string().nullable().optional(),
    categoryTag: z.enum(CATEGORY_TAGS).optional(),
    groupId: z.string().nullable().optional(),
  }),
});

export const updateTransactionSchema = z.object({
  body: z.object({
    note: z.string().max(500).optional(),
    date: z.string().optional(),
    categoryTag: z.enum(CATEGORY_TAGS).optional(),
    dueDate: z.string().nullable().optional(),
    type: z.enum(TRANSACTION_TYPES).optional(),
    amount: z.number().int().min(1).optional(),
  }),
});
