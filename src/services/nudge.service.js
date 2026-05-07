import { WHATSAPP_BASE_URL, PAISE_PER_INR } from '../utils/constants.js';

const nudgeTemplates = {
  polite: {
    generate: (name, amountInINR) =>
      `Hi ${name}, this is a gentle reminder about the ₹${amountInINR} pending. Please let me know when you can settle it. Thanks!`,
  },
  casual: {
    generate: (name, amountInINR) =>
      `Hey ${name}! 👋 Just a quick ping about the ₹${amountInINR} — no rush, just keeping track. 😊`,
  },
  formal: {
    generate: (name, amountInINR) =>
      `Dear ${name}, I am writing to remind you about the outstanding amount of ₹${amountInINR}. Kindly arrange the payment at your earliest convenience. Regards.`,
  },
  funny: {
    generate: (name, amountInINR) =>
      `Hey ${name}! 🏦 My wallet is filing a missing person report for ₹${amountInINR}. Any leads? 😂🕵️`,
  },
};

const generateNudgeMessage = (contactName, netBalancePaise, style) => {
  const amountInINR = Math.abs(netBalancePaise) / PAISE_PER_INR;
  const template = nudgeTemplates[style] || nudgeTemplates.polite;
  return template.generate(contactName, amountInINR.toLocaleString('en-IN'));
};

const generateWhatsAppUrl = (phone, message) => {
  const cleanPhone = phone.replace(/\D/g, '');
  const phoneWithCountry = cleanPhone.startsWith('91')
    ? cleanPhone
    : '91' + cleanPhone;
  const encodedMessage = encodeURIComponent(message);
  return `${WHATSAPP_BASE_URL}/${phoneWithCountry}?text=${encodedMessage}`;
};

export { generateNudgeMessage, generateWhatsAppUrl };
