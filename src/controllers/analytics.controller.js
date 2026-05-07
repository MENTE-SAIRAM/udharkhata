import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import {
  getSummary,
  getMonthlyAggregation,
  getTopContacts,
  getCategoryBreakdown,
} from '../services/analytics.service.js';

const summary = asyncHandler(async (req, res) => {
  const data = await getSummary(req.user._id);
  new ApiResponse(200, data).send(res);
});

const monthly = asyncHandler(async (req, res) => {
  const data = await getMonthlyAggregation(req.user._id);
  new ApiResponse(200, { monthly: data }).send(res);
});

const topContacts = asyncHandler(async (req, res) => {
  const data = await getTopContacts(req.user._id, 5);
  new ApiResponse(200, { topContacts: data }).send(res);
});

const categories = asyncHandler(async (req, res) => {
  const data = await getCategoryBreakdown(req.user._id);
  new ApiResponse(200, { categories: data }).send(res);
});

export { summary, monthly, topContacts, categories };
