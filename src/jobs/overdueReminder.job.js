import cron from 'node-cron';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { sendPushNotification } from '../services/fcm.service.js';
import logger from '../utils/logger.js';
import { OVERDUE_CRON_SCHEDULE } from '../utils/constants.js';

const processOverdueReminders = async () => {
  try {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const overdueTransactions = await Transaction.find({
      isSettled: false,
      dueDate: { $lt: now },
      $or: [
        { reminderSentAt: null },
        { reminderSentAt: { $lt: twentyFourHoursAgo } },
      ],
    }).populate('owner', 'fcmToken').lean();

    if (!overdueTransactions.length) {
      logger.info('No overdue reminders to send');
      return;
    }

    logger.info(`Found ${overdueTransactions.length} overdue transactions for reminders`);

    const userNotifications = {};

    for (const transaction of overdueTransactions) {
      const userId = transaction.owner._id.toString();
      const userFcmToken = transaction.owner.fcmToken;

      if (!userNotifications[userId]) {
        userNotifications[userId] = { tokens: new Set(), transactions: [] };
      }

      if (userFcmToken) {
        userNotifications[userId].tokens.add(userFcmToken);
      }
      userNotifications[userId].transactions.push(transaction);
    }

    for (const [userId, data] of Object.entries(userNotifications)) {
      const tokens = Array.from(data.tokens);

      for (const transaction of data.transactions) {
        const amountInINR = (transaction.amount / 100).toLocaleString('en-IN');

        await Notification.create({
          user: userId,
          type: 'overdue',
          title: 'Payment Overdue',
          body: `Reminder: ₹${amountInINR} is overdue. Please settle at the earliest.`,
          transactionId: transaction._id,
        });

        await Transaction.findByIdAndUpdate(transaction._id, {
          reminderSentAt: new Date(),
        });
      }

      for (const token of tokens) {
        await sendPushNotification(
          token,
          'Payment Overdue',
          `You have ${data.transactions.length} overdue transaction(s). Please check the app.`
        );
      }
    }

    logger.info(`Processed reminders for ${Object.keys(userNotifications).length} users`);
  } catch (error) {
    logger.error('Overdue reminder cron error:', error.message);
  }
};

const startOverdueReminderCron = () => {
  cron.schedule(OVERDUE_CRON_SCHEDULE, () => {
    logger.info('Running overdue reminder cron job...');
    processOverdueReminders();
  }, {
    timezone: 'Asia/Kolkata',
  });

  logger.info(`Overdue reminder cron scheduled: ${OVERDUE_CRON_SCHEDULE} IST`);
};

export { startOverdueReminderCron, processOverdueReminders };
