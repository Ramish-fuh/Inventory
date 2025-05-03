import logger from '../utils/logger.js';
import SystemLog from '../models/SystemLog.js';

export const loggingMiddleware = async (req, res, next) => {
  // Store original response methods
  const originalSend = res.send;
  const originalJson = res.json;
  const startTime = Date.now();

  try {
    // Create base log entry
    const logEntry = {
      level: 'info',
      service: 'api',
      request: {
        method: req.method,
        url: req.originalUrl,
        headers: req.headers,
        body: req.method !== 'GET' ? req.body : undefined
      },
      user: req.user?._id
    };

    // Override response methods to capture response data
    res.send = function (body) {
      logEntry.response = {
        statusCode: res.statusCode,
        body: body
      };
      logEntry.message = `${req.method} ${req.originalUrl} ${res.statusCode}`;
      logEntry.metadata = {
        responseTime: Date.now() - startTime
      };

      // Log to Winston
      logger.info(logEntry.message, {
        request: logEntry.request,
        response: logEntry.response,
        metadata: logEntry.metadata
      });

      // Log to Database
      SystemLog.create(logEntry).catch(err => {
        logger.error('Error saving system log to database', { error: err });
      });

      return originalSend.call(this, body);
    };

    res.json = function (body) {
      logEntry.response = {
        statusCode: res.statusCode,
        body: body
      };
      logEntry.message = `${req.method} ${req.originalUrl} ${res.statusCode}`;
      logEntry.metadata = {
        responseTime: Date.now() - startTime
      };

      // Log to Winston
      logger.info(logEntry.message, {
        request: logEntry.request,
        response: logEntry.response,
        metadata: logEntry.metadata
      });

      // Log to Database
      SystemLog.create(logEntry).catch(err => {
        logger.error('Error saving system log to database', { error: err });
      });

      return originalJson.call(this, body);
    };

    next();
  } catch (error) {
    logger.error('Error in logging middleware', { error });
    next(error);
  }
};

export const errorLoggingMiddleware = (err, req, res, next) => {
  const logEntry = {
    level: 'error',
    message: err.message,
    service: 'api',
    trace: err.stack,
    request: {
      method: req.method,
      url: req.originalUrl,
      headers: req.headers,
      body: req.method !== 'GET' ? req.body : undefined
    },
    user: req.user?._id
  };

  // Log to Winston
  logger.error(err.message, {
    error: err,
    request: logEntry.request
  });

  // Log to Database
  SystemLog.create(logEntry).catch(err => {
    logger.error('Error saving error log to database', { error: err });
  });

  next(err);
};