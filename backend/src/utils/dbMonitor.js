import mongoose from 'mongoose';
import logger from './logger.js';

// Initialize connection state monitoring
let isConnected = false;
let lastReconnectAttempt = 0;
const RECONNECT_INTERVAL = 5000; // 5 seconds

// Track database operations with enhanced error handling
mongoose.set('debug', (collectionName, method, query, doc) => {
  logger.debug('MongoDB Operation', {
    collection: collectionName,
    method,
    query,
    timestamp: new Date()
  });
});

// Enhanced connection monitoring with retry logic
mongoose.connection.on('error', (err) => {
  isConnected = false;
  logger.error('MongoDB connection error', {
    error: err.message,
    stack: err.stack,
    timestamp: new Date()
  });

  // Attempt reconnection if not already trying
  const now = Date.now();
  if (now - lastReconnectAttempt > RECONNECT_INTERVAL) {
    lastReconnectAttempt = now;
    mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      heartbeatFrequencyMS: 2000
    }).catch(error => {
      logger.error('MongoDB reconnection failed', {
        error: error.message,
        timestamp: new Date()
      });
    });
  }
});

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  logger.warn('MongoDB disconnected', {
    timestamp: new Date()
  });
});

mongoose.connection.on('reconnected', () => {
  isConnected = true;
  logger.info('MongoDB reconnected', {
    timestamp: new Date()
  });
});

mongoose.connection.on('connected', () => {
  isConnected = true;
  logger.info('MongoDB connected', {
    timestamp: new Date()
  });
});

// Monitor database performance
const startTime = Symbol('startTime');

mongoose.plugin(schema => {
  schema.pre(['find', 'findOne', 'save', 'update', 'remove'], function() {
    this[startTime] = Date.now();
  });

  schema.post(['find', 'findOne', 'save', 'update', 'remove'], function() {
    const timeTaken = Date.now() - this[startTime];
    
    if (timeTaken > 1000) {
      logger.warn('Slow database operation detected', {
        operation: this.op,
        collection: this.model.collection.name,
        query: this.getQuery(),
        timeTaken,
        timestamp: new Date()
      });
    }
  });
});

export const getConnectionStatus = () => ({
  isConnected,
  lastReconnectAttempt
});

export const checkConnection = async () => {
  if (!isConnected) {
    throw new Error('Database connection is not available');
  }
  return true;
};