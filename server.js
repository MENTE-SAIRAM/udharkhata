import dotenv from 'dotenv';
dotenv.config();

import app from './src/app.js';
import connectDB from './src/config/db.js';
import configureCloudinary from './src/config/cloudinary.js';
import configureFirebase from './src/config/firebase.js';
import logger from './src/utils/logger.js';

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectDB();
    configureCloudinary();
    configureFirebase();

    const server = app.listen(PORT, () => {
      logger.info(`Udhar Khata API server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${PORT} is already in use. Stop the other process or use a different PORT.`);
      } else {
        logger.error('Server failed to start:', error.message);
      }
      process.exit(1);
    });
  } catch (error) {
    logger.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
