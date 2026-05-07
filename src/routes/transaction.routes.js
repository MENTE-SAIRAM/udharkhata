import { Router } from 'express';
import {
  createTransaction,
  updateTransaction,
  deleteTransaction,
  settleTransaction,
  uploadReceiptHandler,
} from '../controllers/transaction.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.middleware.js';
import upload from '../middleware/upload.middleware.js';
import {
  createTransactionSchema,
  updateTransactionSchema,
} from '../validators/transaction.validator.js';

const router = Router();

router.use(verifyJWT);

router.post('/', validate(createTransactionSchema), createTransaction);
router.put('/:id', validate(updateTransactionSchema), updateTransaction);
router.delete('/:id', deleteTransaction);
router.post('/:id/settle', settleTransaction);
router.post('/:id/receipt', upload.single('receipt'), uploadReceiptHandler);

export default router;
