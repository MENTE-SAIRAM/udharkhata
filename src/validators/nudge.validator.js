import { z } from 'zod';
import { NUDGE_STYLES } from '../utils/constants.js';

export const generateNudgeSchema = z.object({
  body: z.object({
    contactId: z.string().min(1, 'Contact ID is required'),
    style: z.enum(NUDGE_STYLES).optional(),
  }),
});
