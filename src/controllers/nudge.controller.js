import Contact from '../models/Contact.js';
import { generateNudgeMessage, generateWhatsAppUrl } from '../services/nudge.service.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import { NUDGE_STYLES } from '../utils/constants.js';

const generateNudge = asyncHandler(async (req, res) => {
  const { contactId, style } = req.body;

  if (!contactId) {
    throw new ApiError(400, 'Contact ID is required');
  }

  if (style && !NUDGE_STYLES.includes(style)) {
    throw new ApiError(400, `Style must be one of: ${NUDGE_STYLES.join(', ')}`);
  }

  const contact = await Contact.findOne({
    _id: contactId,
    owner: req.user._id,
    deletedAt: null,
  });

  if (!contact) {
    throw new ApiError(404, 'Contact not found');
  }

  const selectedStyle = style || 'polite';
  const message = generateNudgeMessage(contact.name, contact.netBalance, selectedStyle);
  const whatsappUrl = generateWhatsAppUrl(contact.phone, message);

  new ApiResponse(200, {
    message,
    whatsappUrl,
    contactName: contact.name,
    netBalance: contact.netBalance,
  }).send(res);
});

export { generateNudge };
