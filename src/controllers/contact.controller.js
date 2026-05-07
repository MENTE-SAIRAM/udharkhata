import Contact from '../models/Contact.js';
import Transaction from '../models/Transaction.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import { FREE_TIER_MAX_CONTACTS, PAGINATION_DEFAULT_LIMIT } from '../utils/constants.js';

const getContacts = asyncHandler(async (req, res) => {
  const contacts = await Contact.find({ owner: req.user._id, deletedAt: null })
    .sort({ netBalance: -1 })
    .lean();

  const contactsWithAbs = contacts.map((c) => ({
    ...c,
    absoluteBalance: Math.abs(c.netBalance),
  }));

  contactsWithAbs.sort((a, b) => b.absoluteBalance - a.absoluteBalance);

  new ApiResponse(200, { contacts: contactsWithAbs, count: contactsWithAbs.length }).send(res);
});

const createContact = asyncHandler(async (req, res) => {
  const { name, phone, colorHex, avatarUrl, notes } = req.body;

  const contactCount = await Contact.countDocuments({ owner: req.user._id, deletedAt: null });
  if (!req.user.isPremium && contactCount >= FREE_TIER_MAX_CONTACTS) {
    throw new ApiError(403, `Free tier limited to ${FREE_TIER_MAX_CONTACTS} contacts. Upgrade to premium to add more.`);
  }

  const existing = await Contact.findOne({ owner: req.user._id, phone, deletedAt: null });
  if (existing) {
    throw new ApiError(409, 'A contact with this phone number already exists');
  }

  const contact = await Contact.create({
    owner: req.user._id,
    name,
    phone,
    colorHex: colorHex || '#6366f1',
    avatarUrl: avatarUrl || '',
    notes: notes || '',
  });

  new ApiResponse(201, { contact }, 'Contact created successfully').send(res);
});

const getContact = asyncHandler(async (req, res) => {
  const contact = await Contact.findOne({
    _id: req.params.id,
    owner: req.user._id,
    deletedAt: null,
  });

  if (!contact) {
    throw new ApiError(404, 'Contact not found');
  }

  const recentTransactions = await Transaction.find({
    owner: req.user._id,
    contact: contact._id,
  })
    .sort({ date: -1 })
    .limit(20)
    .lean();

  new ApiResponse(200, { contact, recentTransactions }).send(res);
});

const updateContact = asyncHandler(async (req, res) => {
  const { name, phone, colorHex, avatarUrl, notes } = req.body;

  const contact = await Contact.findOne({
    _id: req.params.id,
    owner: req.user._id,
    deletedAt: null,
  });

  if (!contact) {
    throw new ApiError(404, 'Contact not found');
  }

  if (phone && phone !== contact.phone) {
    const existing = await Contact.findOne({
      owner: req.user._id,
      phone,
      _id: { $ne: contact._id },
      deletedAt: null,
    });
    if (existing) {
      throw new ApiError(409, 'A contact with this phone number already exists');
    }
  }

  if (name !== undefined) contact.name = name;
  if (phone !== undefined) contact.phone = phone;
  if (colorHex !== undefined) contact.colorHex = colorHex;
  if (avatarUrl !== undefined) contact.avatarUrl = avatarUrl;
  if (notes !== undefined) contact.notes = notes;

  await contact.save();

  new ApiResponse(200, { contact }, 'Contact updated successfully').send(res);
});

const deleteContact = asyncHandler(async (req, res) => {
  const contact = await Contact.findOne({
    _id: req.params.id,
    owner: req.user._id,
    deletedAt: null,
  });

  if (!contact) {
    throw new ApiError(404, 'Contact not found');
  }

  contact.deletedAt = new Date();
  await contact.save();

  new ApiResponse(200, null, 'Contact deleted successfully').send(res);
});

const getContactTransactions = asyncHandler(async (req, res) => {
  const contact = await Contact.findOne({
    _id: req.params.id,
    owner: req.user._id,
    deletedAt: null,
  });

  if (!contact) {
    throw new ApiError(404, 'Contact not found');
  }

  const { cursor, limit } = req.query;
  const limitVal = Math.min(parseInt(limit) || PAGINATION_DEFAULT_LIMIT, 50);

  const filter = {
    owner: req.user._id,
    contact: contact._id,
  };

  if (cursor) {
    filter._id = { $lt: cursor };
  }

  const transactions = await Transaction.find(filter)
    .sort({ _id: -1 })
    .limit(limitVal + 1)
    .lean();

  const hasMore = transactions.length > limitVal;
  if (hasMore) transactions.pop();

  const nextCursor = hasMore ? transactions[transactions.length - 1]._id : null;

  new ApiResponse(200, {
    transactions,
    pagination: {
      nextCursor,
      hasMore,
      limit: limitVal,
    },
  }).send(res);
});

export {
  getContacts,
  createContact,
  getContact,
  updateContact,
  deleteContact,
  getContactTransactions,
};
