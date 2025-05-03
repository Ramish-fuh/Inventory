import logger from '../utils/logger.js';
import SystemLog from '../models/SystemLog.js';

export const performanceLogging = async (req, res, next) => {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  // Log request start
  logger.info('Request started', {
    requestId,
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get('user-agent'),
    ip: req.ip,
    userId: req.user?._id
  });

  // Track memory usage at start
  const startMemory = process.memoryUsage();

  // Override end method to capture response
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    // Calculate timing
    const duration = Date.now() - startTime;
    const endMemory = process.memoryUsage();
    
    // Memory delta calculation
    const memoryDelta = {
      heapUsed: endMemory.heapUsed - startMemory.heapUsed,
      heapTotal: endMemory.heapTotal - startMemory.heapTotal,
      external: endMemory.external - startMemory.external,
      rss: endMemory.rss - startMemory.rss
    };

    // Log slow requests (>1s)
    if (duration > 1000) {
      logger.warn('Slow request detected', {
        requestId,
        method: req.method,
        url: req.originalUrl,
        duration,
        memoryDelta
      });

      SystemLog.create({
        level: 'warn',
        message: 'Slow request detected',
        service: 'performance-monitor',
        metadata: {
          requestId,
          method: req.method,
          url: req.originalUrl,
          duration,
          memoryDelta,
          userId: req.user?._id
        },
        user: req.user?._id
      }).catch(err => logger.error('Error logging slow request', { error: err }));
    }

    // Log request completion
    logger.info('Request completed', {
      requestId,
      method: req.method,
      url: req.originalUrl,
      duration,
      statusCode: res.statusCode,
      memoryDelta
    });

    // Store performance metrics in SystemLog
    SystemLog.create({
      level: 'info',
      message: 'Request performance metrics',
      service: 'performance-monitor',
      metadata: {
        requestId,
        method: req.method,
        url: req.originalUrl,
        duration,
        statusCode: res.statusCode,
        memoryDelta,
        userId: req.user?._id
      },
      user: req.user?._id
    }).catch(err => logger.error('Error logging performance metrics', { error: err }));

    originalEnd.apply(res, arguments);
  };

  next();
};