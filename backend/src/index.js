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
        logger.error('Port is already in use. Trying to close existing connection...', { port: PORT });
        
        // Try to recover by closing the port
        require('child_process').exec(`lsof -ti tcp:${PORT} | xargs kill`, (err) => {
          if (err) {
            logger.error('Could not release port. Please manually stop the process using it.', { error: err });
            process.exit(1);
          } else {
            logger.info('Successfully released port. Restarting server...');
            setTimeout(() => {
              server.listen(PORT);
            }, 1000);
          }
        });
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