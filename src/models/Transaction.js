import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    contact: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contact',
      required: true,
      index: true,
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      default: null,
    },
    type: {
      type: String,
      enum: ['gave', 'received'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    note: {
      type: String,
      default: '',
      trim: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    isSettled: {
      type: Boolean,
      default: false,
    },
    settledAt: {
      type: Date,
      default: null,
    },
    categoryTag: {
      type: String,
      enum: ['food', 'travel', 'household', 'business', 'other'],
      default: 'other',
    },
    receiptImageUrl: {
      type: String,
      default: null,
    },
    reminderSentAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

transactionSchema.index({ owner: 1, contact: 1 });
transactionSchema.index({ owner: 1, date: -1 });
transactionSchema.index({ contact: 1, isSettled: 1 });
transactionSchema.index({ dueDate: 1, reminderSentAt: 1 });

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;
