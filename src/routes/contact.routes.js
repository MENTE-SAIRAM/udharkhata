import { Router } from 'express';
import {
  getContacts,
  createContact,
  getContact,
  updateContact,
  deleteContact,
  getContactTransactions,
} from '../controllers/contact.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.middleware.js';
import {
  createContactSchema,
  updateContactSchema,
} from '../validators/contact.validator.js';

const router = Router();

router.use(verifyJWT);

router.get('/', getContacts);
router.post('/', validate(createContactSchema), createContact);
router.get('/:id', getContact);
router.put('/:id', validate(updateContactSchema), updateContact);
router.delete('/:id', deleteContact);
router.get('/:id/transactions', getContactTransactions);

export default router;
