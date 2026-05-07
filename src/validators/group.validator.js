import { z } from 'zod';
import { GROUP_TYPES } from '../utils/constants.js';

export const createGroupSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Group name is required').max(100),
    type: z.enum(GROUP_TYPES),
    members: z
      .array(
        z.object({
          contactId: z.string().min(1),
          shareAmount: z.number().int().min(0).default(0),
        })
      )
      .min(2, 'At least 2 members are required'),
  }),
});
