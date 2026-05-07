import Transaction from '../models/Transaction.js';
import Contact from '../models/Contact.js';
import Notification from '../models/Notification.js';
import { uploadReceipt } from '../services/cloudinary.service.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';

const recalculateNetBalance = async (contactId) => {
  const result = await Transaction.aggregate([
    { $match: { contact: contactId } },
    {
      $group: {
        _id: '$type',
        total: { $sum: '$amount' },
      },
    },
  ]);

  let gave = 0;
  let received = 0;
  result.forEach((r) => {
    if (r._id === 'gave') gave = r.total;
    if (r._id === 'received') received = r.total;
  });

  await Contact.findByIdAndUpdate(contactId, { netBalance: gave - received });
};

const createTransaction = asyncHandler(async (req, res) => {
  const { contactId, type, amount, note, date, dueDate, categoryTag, groupId } = req.body;

  const contact = await Contact.findOne({
    _id: contactId,
    owner: req.user._id,
    deletedAt: null,
  });
  if (!contact) {
    throw new ApiError(404, 'Contact not found');
  }

  const transaction = await Transaction.create({
    owner: req.user._id,
    contact: contactId,
    group: groupId || null,
    type,
    amount,
    note: note || '',
    date: date ? new Date(date) : new Date(),
    dueDate: dueDate ? new Date(dueDate) : null,
    categoryTag: categoryTag || 'other',
  });

  await recalculateNetBalance(contactId);

  const populated = await Transaction.findById(transaction._id)
    .populate('contact', 'name phone')
    .lean();

  new ApiResponse(201, { transaction: populated }, 'Transaction created').send(res);
});

const updateTransaction = asyncHandler(async (req, res) => {
  const { note, date, categoryTag, dueDate, type, amount } = req.body;

  const transaction = await Transaction.findOne({
    _id: req.params.id,
    owner: req.user._id,
  });

  if (!transaction) {
    throw new ApiError(404, 'Transaction not found');
  }

  if (note !== undefined) transaction.note = note;
  if (date !== undefined) transaction.date = new Date(date);
  if (categoryTag !== undefined) transaction.categoryTag = categoryTag;
  if (dueDate !== undefined) transaction.dueDate = dueDate ? new Date(dueDate) : null;
  if (type !== undefined) transaction.type = type;
  if (amount !== undefined) transaction.amount = amount;

  await transaction.save();

  await recalculateNetBalance(transaction.contact);

  const populated = await Transaction.findById(transaction._id)
    .populate('contact', 'name phone')
    .lean();

  new ApiResponse(200, { transaction: populated }, 'Transaction updated').send(res);
});

const deleteTransaction = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findOne({
    _id: req.params.id,
    owner: req.user._id,
  });

  if (!transaction) {
    throw new ApiError(404, 'Transaction not found');
  }

  const contactId = transaction.contact;
  await Transaction.deleteOne({ _id: transaction._id });
  await recalculateNetBalance(contactId);

  new ApiResponse(200, null, 'Transaction deleted').send(res);
});

const settleTransaction = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findOne({
    _id: req.params.id,
    owner: req.user._id,
  });

  if (!transaction) {
    throw new ApiError(404, 'Transaction not found');
  }

  if (transaction.isSettled) {
    throw new ApiError(400, 'Transaction is already settled');
  }

  transaction.isSettled = true;
  transaction.settledAt = new Date();
  await transaction.save();

  await recalculateNetBalance(transaction.contact);

  await Notification.create({
    user: req.user._id,
    type: 'settlement',
    title: 'Transaction Settled',
    body: `Transaction of ₹${(transaction.amount / 100).toLocaleString('en-IN')} has been marked as settled.`,
    transactionId: transaction._id,
  });

  const populated = await Transaction.findById(transaction._id)
    .populate('contact', 'name phone')
    .lean();

  new ApiResponse(200, { transaction: populated }, 'Transaction settled').send(res);
});

const uploadReceiptHandler = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findOne({
    _id: req.params.id,
    owner: req.user._id,
  });

  if (!transaction) {
    throw new ApiError(404, 'Transaction not found');
  }

  if (!req.file) {
    throw new ApiError(400, 'Receipt image is required');
  }

  const imageUrl = await uploadReceipt(req.file.path, req.user._id.toString());
  transaction.receiptImageUrl = imageUrl;
  await transaction.save();

  new ApiResponse(200, { receiptImageUrl: imageUrl }, 'Receipt uploaded').send(res);
});

export {
  createTransaction,
  updateTransaction,
  deleteTransaction,
  settleTransaction,
  uploadReceiptHandler,
};
