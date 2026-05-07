import Group from '../models/Group.js';
import GroupMember from '../models/GroupMember.js';
import Contact from '../models/Contact.js';
import Transaction from '../models/Transaction.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';

const createGroup = asyncHandler(async (req, res) => {
  const { name, type, members } = req.body;

  if (!name || !type || !members || !Array.isArray(members) || members.length < 2) {
    throw new ApiError(400, 'Group requires a name, type, and at least 2 members');
  }

  const group = await Group.create({
    owner: req.user._id,
    name,
    type,
  });

  let totalAmount = 0;
  const groupMembers = [];

  for (const member of members) {
    const contact = await Contact.findOne({
      _id: member.contactId,
      owner: req.user._id,
      deletedAt: null,
    });
    if (!contact) {
      await Group.deleteOne({ _id: group._id });
      throw new ApiError(404, `Contact ${member.contactId} not found`);
    }

    const shareAmount = member.shareAmount || 0;
    totalAmount += shareAmount;

    groupMembers.push({
      group: group._id,
      contact: contact._id,
      shareAmount,
    });
  }

  group.totalAmount = totalAmount;
  await group.save();

  await GroupMember.insertMany(groupMembers);

  const populated = await Group.findById(group._id).lean();
  const membersPopulated = await GroupMember.find({ group: group._id })
    .populate('contact', 'name phone colorHex')
    .lean();

  new ApiResponse(201, { group: populated, members: membersPopulated }, 'Group created').send(res);
});

const getGroup = asyncHandler(async (req, res) => {
  const group = await Group.findOne({
    _id: req.params.id,
    owner: req.user._id,
  });

  if (!group) {
    throw new ApiError(404, 'Group not found');
  }

  const members = await GroupMember.find({ group: group._id })
    .populate('contact', 'name phone colorHex netBalance')
    .lean();

  const paidCount = members.filter((m) => m.isPaid).length;
  const totalPaid = members
    .filter((m) => m.isPaid)
    .reduce((sum, m) => sum + m.shareAmount, 0);

  new ApiResponse(200, {
    group,
    members,
    summary: {
      totalMembers: members.length,
      paidCount,
      pendingCount: members.length - paidCount,
      totalPaid,
      totalPending: group.totalAmount - totalPaid,
    },
  }).send(res);
});

const markMemberPaid = asyncHandler(async (req, res) => {
  const { id, memberId } = req.params;

  const group = await Group.findOne({ _id: id, owner: req.user._id });
  if (!group) {
    throw new ApiError(404, 'Group not found');
  }

  const member = await GroupMember.findOne({ _id: memberId, group: id });
  if (!member) {
    throw new ApiError(404, 'Group member not found');
  }

  if (member.isPaid) {
    throw new ApiError(400, 'Member is already marked as paid');
  }

  member.isPaid = true;
  member.paidAt = new Date();
  await member.save();

  const populated = await GroupMember.findById(member._id)
    .populate('contact', 'name phone')
    .lean();

  new ApiResponse(200, { member: populated }, 'Member marked as paid').send(res);
});

const deleteGroup = asyncHandler(async (req, res) => {
  const group = await Group.findOne({ _id: req.params.id, owner: req.user._id });
  if (!group) {
    throw new ApiError(404, 'Group not found');
  }

  await Transaction.updateMany(
    { group: group._id },
    { $set: { group: null } }
  );

  await GroupMember.deleteMany({ group: group._id });
  await Group.deleteOne({ _id: group._id });

  new ApiResponse(200, null, 'Group deleted successfully').send(res);
});

export { createGroup, getGroup, markMemberPaid, deleteGroup };
