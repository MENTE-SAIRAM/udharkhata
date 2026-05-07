import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

import authRoutes from './routes/auth.routes.js';
import contactRoutes from './routes/contact.routes.js';
import transactionRoutes from './routes/transaction.routes.js';
import groupRoutes from './routes/group.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import nudgeRoutes from './routes/nudge.routes.js';
import exportRoutes from './routes/export.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import { generalLimiter } from './middleware/rateLimiter.middleware.js';
import errorHandler from './middleware/error.middleware.js';
import ApiError from './utils/ApiError.js';
import { startOverdueReminderCron } from './jobs/overdueReminder.job.js';

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(cookieParser());
app.use(mongoSanitize());

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

app.use(generalLimiter);

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/contacts', contactRoutes);
app.use('/api/v1/transactions', transactionRoutes);
app.use('/api/v1/groups', groupRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/nudge', nudgeRoutes);
app.use('/api/v1/export', exportRoutes);
app.use('/api/v1/notifications', notificationRoutes);

app.get('/api/v1/health', (req, res) => {
  res.json({ success: true, message: 'Udhar Khata API is running', timestamp: new Date().toISOString() });
});

app.all('*', (req, res, next) => {
  next(new ApiError(404, `Route ${req.originalUrl} not found`));
});

app.use(errorHandler);

startOverdueReminderCron();

export default app;
