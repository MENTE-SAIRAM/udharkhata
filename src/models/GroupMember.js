import mongoose from 'mongoose';

const groupMemberSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
      index: true,
    },
    contact: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contact',
      required: true,
    },
    shareAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    paidAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

groupMemberSchema.index({ group: 1, contact: 1 }, { unique: true });

const GroupMember = mongoose.model('GroupMember', groupMemberSchema);

export default GroupMember;
