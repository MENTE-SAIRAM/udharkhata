import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { generateOTP, storeOTP, verifyOTP, sendOTP } from '../services/otp.service.js';
import { deleteImage } from '../services/cloudinary.service.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';

const normalizePhone = (phone) => {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  return null;
};

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m',
  });

  const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRY || '30d',
  });

  return { accessToken, refreshToken };
};

const setRefreshTokenCookie = (res, refreshToken) => {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: '/api/v1/auth',
  });
};

const setAccessTokenCookie = (res, accessToken) => {
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000,
    path: '/',
  });
};

const sendOTPHandler = asyncHandler(async (req, res) => {
  const phone = normalizePhone(req.body?.phone);

  if (!phone) {
    throw new ApiError(400, 'Valid 10-digit phone number is required');
  }

  const otp = generateOTP();
  storeOTP(phone, otp);
  await sendOTP(phone, otp);

  new ApiResponse(200, null, 'OTP sent successfully').send(res);
});

const verifyOTPHandler = asyncHandler(async (req, res) => {
  const phone = normalizePhone(req.body?.phone);
  const { otp } = req.body;

  if (!phone || !otp) {
    throw new ApiError(400, 'Phone and OTP are required');
  }

  verifyOTP(phone, otp);

  let user = await User.findOne({
    $or: [{ phone }, { phone: `+91${phone}` }],
  });

  if (!user) {
    user = await User.create({ phone });
  } else if (user.phone !== phone) {
    user.phone = phone;
  }

  const { accessToken, refreshToken } = generateTokens(user._id.toString());

  const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
  user.refreshToken = hashedRefreshToken;
  await user.save();

  setAccessTokenCookie(res, accessToken);
  setRefreshTokenCookie(res, refreshToken);

  new ApiResponse(200, {
    user: {
      _id: user._id,
      phone: user.phone,
      name: user.name,
      avatarUrl: user.avatarUrl,
      isPremium: user.isPremium,
      premiumExpiresAt: user.premiumExpiresAt,
    },
    accessToken,
    refreshToken,
  }, 'OTP verified successfully').send(res);
});

const refreshTokenHandler = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, 'Refresh token required');
  }

  try {
    const decoded = jwt.verify(incomingRefreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || !user.refreshToken) {
      throw new ApiError(401, 'Invalid refresh token');
    }

    const isValidRefresh = await bcrypt.compare(incomingRefreshToken, user.refreshToken);
    if (!isValidRefresh) {
      throw new ApiError(401, 'Refresh token mismatch');
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id.toString());

    const hashedRefreshToken = await bcrypt.hash(newRefreshToken, 10);
    user.refreshToken = hashedRefreshToken;
    await user.save();

    setAccessTokenCookie(res, accessToken);
    setRefreshTokenCookie(res, newRefreshToken);

    new ApiResponse(200, { accessToken, refreshToken: newRefreshToken }, 'Tokens refreshed').send(res);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(401, 'Invalid or expired refresh token');
  }
});

const logoutHandler = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;

  if (incomingRefreshToken && req.user) {
    const user = await User.findById(req.user._id);
    if (user) {
      user.refreshToken = null;
      await user.save();
    }
  }

  res.clearCookie('accessToken', { path: '/' });
  res.clearCookie('refreshToken', { path: '/api/v1/auth' });

  new ApiResponse(200, null, 'Logged out successfully').send(res);
});

const updateProfileHandler = asyncHandler(async (req, res) => {
  const { name, avatarUrl } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (name !== undefined) user.name = name;
  if (avatarUrl !== undefined) {
    if (user.avatarUrl) {
      await deleteImage(user.avatarUrl);
    }
    user.avatarUrl = avatarUrl;
  }

  await user.save();

  new ApiResponse(200, {
    _id: user._id,
    phone: user.phone,
    name: user.name,
    avatarUrl: user.avatarUrl,
    isPremium: user.isPremium,
    premiumExpiresAt: user.premiumExpiresAt,
  }, 'Profile updated').send(res);
});

const updateFCMTokenHandler = asyncHandler(async (req, res) => {
  const { fcmToken } = req.body;

  if (!fcmToken) {
    throw new ApiError(400, 'FCM token is required');
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { fcmToken },
    { new: true }
  ).select('-refreshToken');

  new ApiResponse(200, { user }, 'FCM token updated').send(res);
});

export {
  sendOTPHandler,
  verifyOTPHandler,
  refreshTokenHandler,
  logoutHandler,
  updateProfileHandler,
  updateFCMTokenHandler,
};
