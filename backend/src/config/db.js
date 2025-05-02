import mongoose from 'mongoose';
import logger from '../utils/logger.js';
import SystemLog from '../models/SystemLog.js';
import '../utils/dbMonitor.js';

// Monitor mongoose connection events
const monitorConnection = () => {
  mongoose.connection.on('connected', () => {
    logger.info('MongoDB connection established');
    logDbEvent('connected', 'Database connection established');
  });

  mongoose.connection.on('error', (err) => {
    logger.error('MongoDB connection error', {
      error: err.message,
      stack: err.stack
    });
    logDbEvent('error', 'Database connection error', err);
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB connection lost');
    logDbEvent('disconnected', 'Database connection lost');
  });

  mongoose.connection.on('reconnected', () => {
    logger.info('MongoDB connection reestablished');
    logDbEvent('reconnected', 'Database connection reestablished');
  });

  // Monitor for slow queries (>100ms)
  mongoose.set('debug', async (collectionName, method, query) => {
    const startTime = Date.now();
    try {
      const duration = Date.now() - startTime;
      if (duration > 100) {
        logger.warn('Slow MongoDB query detected', {
          collection: collectionName,
          method,
          duration,
          query
        });

        await SystemLog.create({
          level: 'warn',
          message: 'Slow database query detected',
          service: 'database',
          metadata: {
            collection: collectionName,
            method,
            duration,
            query: JSON.stringify(query)
          }
        });
      }
    } catch (error) {
      logger.error('Error logging slow query', { error: error.message });
    }
  });
};

// Log database events to SystemLog
const logDbEvent = async (event, message, error = null) => {
  try {
    const metadata = {
      event,
      host: mongoose.connection.host,
      database: mongoose.connection.name
    };

    if (error) {
      metadata.error = error.message;
    }

    await SystemLog.create({
      level: error ? 'error' : 'info',
      message,
      service: 'database',
      metadata,
      trace: error?.stack
    });
  } catch (err) {
    logger.error('Error logging database event', {
      error: err.message,
      stack: err.stack,
      originalError: error
    });
  }
};

// Connect to MongoDB with enhanced logging and retries
const connectDB = async () => {
  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      const startTime = Date.now();
      logger.info('Attempting to connect to MongoDB', { attempt: retryCount + 1 });

      const conn = await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 10000,
        heartbeatFrequencyMS: 2000,
        retryWrites: true,
        w: 'majority',
        maxPoolSize: 10,
        minPoolSize: 2,
        authSource: 'admin',
        auth: {
          username: process.env.MONGODB_USER || 'admin',
          password: process.env.MONGODB_PASSWORD || 'adminpassword'
        }
      });

      const duration = Date.now() - startTime;
      logger.info('MongoDB connected successfully', {
        host: conn.connection.host,
        database: conn.connection.name,
        duration
      });

      // Set up connection monitoring
      monitorConnection();

      // Log successful connection
      try {
        await SystemLog.create({
          level: 'info',
          message: 'Database connection established',
          service: 'database',
          metadata: {
            host: conn.connection.host,
            database: conn.connection.name,
            duration,
            mongoVersion: conn.version
          }
        });
      } catch (logError) {
        // Don't fail the connection if logging fails
        logger.warn('Could not create system log for successful connection', {
          error: logError.message
        });
      }

      return conn;
    } catch (error) {
      retryCount++;
      
      logger.error('Error connecting to MongoDB', {
        error: error.message,
        stack: error.stack,
        attempt: retryCount,
        uri: process.env.MONGODB_URI?.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')
      });

      if (retryCount === maxRetries) {
        // Final attempt failed
        throw error;
      }

      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
    }
  }
};

// Handle process termination
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed through app termination');
    await logDbEvent('terminated', 'Database connection closed through app termination');
    process.exit(0);
  } catch (error) {
    logger.error('Error closing MongoDB connection', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
});

export default connectDB;