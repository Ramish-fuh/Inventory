import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import assetRoutes from './routes/assetRoutes.js';
import logRoutes from './routes/logRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import qrRoutes from './routes/qrRoutes.js';
import authMiddleware from './middleware/authMiddleware.js';
import { loggingMiddleware, errorLoggingMiddleware } from './middleware/loggingMiddleware.js';
import { performanceLogging } from './middleware/performanceLogging.js';
import logger from './utils/logger.js';
import { initLogging } from './utils/initLogging.js';
import { startNotificationScheduler } from './services/notificationScheduler.js';
import monitoringService from './services/monitoringService.js';
import SystemLog from './models/SystemLog.js';

// Initialize logging system
initLogging();

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(loggingMiddleware);
app.use(performanceLogging);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

// Auth routes - these should not have auth middleware
app.use('/api/auth', (req, res, next) => {
  logger.debug('Auth route accessed:', { path: req.path });
  next();
}, authRoutes);

// Protected routes with auth middleware
app.use(authMiddleware);
app.use('/api/users', userRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/qr', qrRoutes);

// Error handling
app.use(errorLoggingMiddleware);

const PORT = process.env.PORT || 5001;

// Start server
const startServer = async () => {
  try {
    await connectDB();
    
    app.listen(PORT, () => {
      logger.info('✨ Server is running', {
        port: PORT,
        nodeEnv: process.env.NODE_ENV
      });
    });

    // Start notification scheduler after successful DB connection
    startNotificationScheduler();
  } catch (error) {
    logger.error('Failed to start server', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
};

startServer();