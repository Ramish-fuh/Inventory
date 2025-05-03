import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import { initLogging } from './utils/initLogging.js';
import logger from './utils/logger.js';
import assetRoutes from './routes/assetRoutes.js';
import userRoutes from './routes/userRoutes.js';
import authRoutes from './routes/authRoutes.js';
import qrRoutes from './routes/qrRoutes.js';
import logRoutes from './routes/logRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import { loggingMiddleware } from './middleware/loggingMiddleware.js';
import { performanceLogging } from './middleware/performanceLogging.js';
import authMiddleware from './middleware/authMiddleware.js';
import { startNotificationScheduler } from './services/notificationScheduler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Initialize logging
await initLogging();

// Middleware
app.use(cors());
app.use(express.json());
app.use(loggingMiddleware);
app.use(performanceLogging);

// Routes that don't require authentication
app.use('/api/auth', authRoutes);

// Protected routes
app.use(authMiddleware);
app.use('/api/assets', assetRoutes);
app.use('/api/users', userRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/notifications', notificationRoutes);

// Start server
const startServer = async () => {
  try {
    await connectDB(); // This will handle admin user creation internally

    const server = app.listen(PORT, () => {
      logger.info('Server started', { port: PORT });
    });

    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        logger.error('Port is already in use. Attempting to recover...', { port: PORT });
        
        // Create a new server to test the port
        const testServer = require('net').createServer()
          .once('error', (err) => {
            if (err.code === 'EADDRINUSE') {
              logger.error('Port is still in use. Please ensure no other process is using it.', { port: PORT });
              process.exit(1);
            }
          })
          .once('listening', () => {
            testServer.close();
            logger.info('Port is now available. Restarting server...');
            setTimeout(() => {
              server.listen(PORT);
            }, 1000);
          })
          .listen(PORT);
      } else {
        logger.error('Server error:', { error: error.message, stack: error.stack });
        process.exit(1);
      }
    });

    // Initialize notification scheduler after server starts
    await startNotificationScheduler();
    
  } catch (error) {
    logger.error('Failed to start server:', { 
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack
  });
  if (error.code !== 'EADDRINUSE') {
    process.exit(1);
  }
});

startServer();