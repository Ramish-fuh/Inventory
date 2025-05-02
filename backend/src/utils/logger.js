import winston from 'winston';
import 'winston-daily-rotate-file';
import 'winston-mongodb';
import path from 'path';

const { combine, timestamp, printf, colorize, json } = winston.format;

// Custom format for console output
const consoleFormat = printf(({ timestamp, level, message, ...meta }) => {
  const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
  return `${timestamp} [${level}]: ${message} ${metaStr}`;
});

// Create the logger instance
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    timestamp(),
    json()
  ),
  transports: [
    // Console transport with custom formatting
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp(),
        consoleFormat
      )
    }),

    // Rotating file transport for general logs
    new winston.transports.DailyRotateFile({
      filename: 'logs/app-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      format: combine(
        timestamp(),
        json()
      )
    }),

    // Separate rotating file for errors
    new winston.transports.DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      level: 'error',
      format: combine(
        timestamp(),
        json()
      )
    }),

    // MongoDB transport for log aggregation
    new winston.transports.MongoDB({
      level: 'info',
      db: process.env.MONGO_URI || 'mongodb://localhost:27017/asset-manager',
      options: {
        useUnifiedTopology: true
      },
      collection: 'logs',
      format: combine(
        timestamp(),
        json()
      )
    })
  ]
});

// Handle logging of unhandled rejections
process.on('unhandledRejection', (error) => {
  logger.error('Unhandled Rejection', {
    error: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });
});

// Handle logging of uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });
  process.exit(1);
});

export default logger;