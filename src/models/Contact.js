import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    colorHex: {
      type: String,
      default: '#6366f1',
    },
    avatarUrl: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    netBalance: {
      type: Number,
      default: 0,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

contactSchema.index({ owner: 1, phone: 1 });
contactSchema.index({ owner: 1, deletedAt: 1 });
contactSchema.index({ netBalance: -1 });

const Contact = mongoose.model('Contact', contactSchema);

export default Contact;
