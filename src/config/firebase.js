import admin from 'firebase-admin';
import logger from '../utils/logger.js';

const configureFirebase = () => {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      if (!serviceAccount.private_key) {
        logger.warn('Firebase: private_key missing in service account JSON, skipping FCM init');
        return;
      }
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      logger.info('Firebase initialized successfully');
    } catch (error) {
      logger.warn('Firebase initialization skipped:', error.message);
    }
  }
};

export { admin };
export default configureFirebase;
