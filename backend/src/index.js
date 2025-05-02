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

// Log application startup
logger.info('Starting application', {
  nodeEnv: process.env.NODE_ENV,
  timestamp: new Date().toISOString()
});

// Connect to database with enhanced logging
connectDB().then(() => {
  logger.info('Database connected successfully');
  
  SystemLog.create({
    level: 'info',
    message: 'Application started successfully',
    service: 'main',
    metadata: {
      nodeEnv: process.env.NODE_ENV,
      startupTime: new Date().toISOString()
    }
  });

  // Start monitoring service after database connection
  monitoringService.startMonitoring();
}).catch((error) => {
  logger.error('Database connection failed', { 
    error: error.message,
    stack: error.stack 
  });
  
  SystemLog.create({
    level: 'error',
    message: 'Database connection failed',
    service: 'main',
    metadata: {
      error: error.message
    },
    trace: error.stack
  }).catch(() => {
    // If we can't log to DB, log to console as last resort
    console.error('Critical: Database connection failed and could not log to SystemLog');
  });
  
  process.exit(1);
});

const app = express();
const PORT = process.env.PORT || 5001;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      url: req.originalUrl
    });
    
    SystemLog.create({
      level: 'warn',
      message: 'Rate limit exceeded',
      service: 'rate-limiter',
      metadata: {
        ip: req.ip,
        url: req.originalUrl
      }
    });
    
    res.status(429).json({
      message: 'Too many requests from this IP, please try again later'
    });
  }
});

app.use(limiter);

// CORS configuration
const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Logging middleware
app.use(loggingMiddleware);
app.use(performanceLogging);

// Health check endpoint with metrics
app.get('/health', async (req, res) => {
  const metrics = await monitoringService.getCurrentMetrics();
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    metrics
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use(authMiddleware);
app.use('/api/users', userRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/notifications', notificationRoutes);

// Start notification scheduler
startNotificationScheduler();

// Error handling with enhanced logging
app.use(errorLoggingMiddleware);
app.use((err, req, res, next) => {
  const errorId = Math.random().toString(36).substring(7);
  
  logger.error('Unhandled error', {
    errorId,
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    userId: req.user?._id
  });

  // Track error in monitoring service
  monitoringService.trackError();

  SystemLog.create({
    level: 'error',
    message: `Unhandled error: ${err.message}`,
    service: 'error-handler',
    metadata: {
      errorId,
      url: req.originalUrl,
      method: req.method,
      userId: req.user?._id
    },
    trace: err.stack,
    user: req.user?._id
  }).catch(logErr => {
    logger.error('Failed to log error to database', { error: logErr });
  });

  res.status(500).json({ 
    message: 'Something broke!', 
    errorId,
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Graceful shutdown handling
const gracefulShutdown = async () => {
  logger.info('Received shutdown signal');
  
  try {
    await SystemLog.create({
      level: 'info',
      message: 'Application shutting down',
      service: 'main',
      metadata: {
        shutdownTime: new Date().toISOString()
      }
    });
    
    // Collect final metrics before shutdown
    await monitoringService.collectSystemMetrics();
    
    logger.info('Shutdown complete');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', { error });
    process.exit(1);
  }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server with enhanced logging
app.listen(PORT, () => {
  logger.info(`✨ Server is running`, {
    port: PORT,
    nodeEnv: process.env.NODE_ENV
  });
  
  SystemLog.create({
    level: 'info',
    message: 'Server started successfully',
    service: 'main',
    metadata: {
      port: PORT,
      nodeEnv: process.env.NODE_ENV
    }
  });
});