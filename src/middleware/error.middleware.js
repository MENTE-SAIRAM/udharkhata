import mongoose from 'mongoose';
import ApiError from '../utils/ApiError.js';
import logger from '../utils/logger.js';

const errorHandler = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    if (error instanceof mongoose.Error.ValidationError) {
      const errors = Object.values(error.errors).map((e) => ({
        field: e.path,
        message: e.message,
      }));
      error = new ApiError(400, 'Validation failed', errors);
    } else if (error.code === 11000 || error.code === 11001) {
      const field = Object.keys(error.keyValue)[0];
      const path = req.path || '';
      const isContactPath = path.includes('/contact');
      const message = isContactPath
        ? `Duplicate value for ${field}. This ${field} is already in use.`
        : `Unable to process request. Please try again.`;
      error = new ApiError(409, message);
    } else if (error.name === 'JsonWebTokenError') {
      error = new ApiError(401, 'Invalid token');
    } else if (error.name === 'TokenExpiredError') {
      error = new ApiError(401, 'Token expired');
    } else if (error.name === 'MulterError') {
      if (error.code === 'LIMIT_FILE_SIZE') {
        error = new ApiError(400, 'File too large. Maximum size is 5MB.');
      } else {
        error = new ApiError(400, error.message);
      }
    } else {
      error = new ApiError(500, 'Internal server error');
    }
  }

  if (process.env.NODE_ENV === 'development') {
    logger.error(error);
  } else {
    logger.error(error.message);
  }

  const statusCode = error.statusCode || 500;
  const response = {
    success: false,
    message: error.message || 'Internal server error',
  };

  if (error.errors && error.errors.length > 0) {
    response.errors = error.errors;
  }

  if (process.env.NODE_ENV === 'development' && error.stack) {
    response.stack = error.stack;
  }

  res.status(statusCode).json(response);
};

export default errorHandler;
