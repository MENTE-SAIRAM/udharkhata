import { admin } from '../config/firebase.js';
import logger from '../utils/logger.js';

const sendPushNotification = async (fcmToken, title, body, data = {}) => {
  if (!admin.apps.length) {
    logger.warn('Firebase not configured. Skipping push notification.');
    return null;
  }

  if (!fcmToken) {
    logger.warn('No FCM token provided. Skipping push notification.');
    return null;
  }

  try {
    const message = {
      token: fcmToken,
      notification: { title, body },
      data: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v)])
      ),
    };

    const response = await admin.messaging().send(message);
    logger.info(`Push notification sent: ${response}`);
    return response;
  } catch (error) {
    logger.error('FCM send error:', error.message);
    if (error.code === 'messaging/registration-token-not-registered') {
      return { tokenExpired: true };
    }
    return null;
  }
};

const sendMulticastNotification = async (tokens, title, body, data = {}) => {
  if (!admin.apps.length || !tokens.length) {
    return null;
  }

  try {
    const message = {
      tokens: tokens.filter(Boolean),
      notification: { title, body },
      data: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v)])
      ),
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    logger.info(`Multicast push sent: ${response.successCount} succeeded`);
    return response;
  } catch (error) {
    logger.error('FCM multicast error:', error.message);
    return null;
  }
};

export { sendPushNotification, sendMulticastNotification };
