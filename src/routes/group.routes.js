import { Router } from 'express';
import {
  createGroup,
  getGroup,
  markMemberPaid,
  deleteGroup,
} from '../controllers/group.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.middleware.js';
import { createGroupSchema } from '../validators/group.validator.js';

const router = Router();

router.use(verifyJWT);

router.post('/', validate(createGroupSchema), createGroup);
router.get('/:id', getGroup);
router.put('/:id/members/:memberId/pay', markMemberPaid);
router.delete('/:id', deleteGroup);

export default router;
