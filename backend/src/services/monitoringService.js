import os from 'os';
import SystemLog from '../models/SystemLog.js';
import logger from '../utils/logger.js';

class MonitoringService {
  constructor() {
    this.startTime = Date.now();
    this.metrics = {
      lastMemoryUsage: process.memoryUsage(),
      lastCpuUsage: process.cpuUsage(),
      requestCount: 0,
      errorCount: 0,
      slowRequestCount: 0
    };
  }

  // Get system metrics
  async collectSystemMetrics() {
    try {
      const currentMemory = process.memoryUsage();
      const currentCpu = process.cpuUsage();
      const uptime = process.uptime();
      const loadAvg = os.loadavg();
      const totalMem = os.totalmem();
      const freeMem = os.freemem();

      const metrics = {
        timestamp: new Date(),
        memory: {
          heapTotal: currentMemory.heapTotal,
          heapUsed: currentMemory.heapUsed,
          rss: currentMemory.rss,
          memoryUsagePercent: ((totalMem - freeMem) / totalMem) * 100
        },
        cpu: {
          user: currentCpu.user,
          system: currentCpu.system,
          loadAvg: loadAvg
        },
        process: {
          uptime,
          requestCount: this.metrics.requestCount,
          errorCount: this.metrics.errorCount,
          slowRequestCount: this.metrics.slowRequestCount
        }
      };

      // Log metrics to SystemLog
      await SystemLog.create({
        level: 'info',
        message: 'System metrics collected',
        service: 'monitoring-service',
        metadata: metrics
      });

      // Update stored metrics
      this.metrics.lastMemoryUsage = currentMemory;
      this.metrics.lastCpuUsage = currentCpu;

      logger.debug('System metrics collected', { metrics });

      return metrics;
    } catch (error) {
      logger.error('Error collecting system metrics', {
        error: error.message,
        stack: error.stack
      });

      await SystemLog.create({
        level: 'error',
        message: 'Error collecting system metrics',
        service: 'monitoring-service',
        metadata: { error: error.message },
        trace: error.stack
      });
    }
  }

  // Track request metrics
  trackRequest(duration) {
    this.metrics.requestCount++;
    if (duration > 1000) {
      this.metrics.slowRequestCount++;
    }
  }

  // Track errors
  trackError() {
    this.metrics.errorCount++;
  }

  // Reset metrics (called periodically)
  resetMetrics() {
    this.metrics.requestCount = 0;
    this.metrics.errorCount = 0;
    this.metrics.slowRequestCount = 0;
  }

  // Start monitoring
  startMonitoring(interval = 300000) { // Default 5 minutes
    // Collect initial metrics
    this.collectSystemMetrics();

    // Set up periodic collection
    setInterval(() => {
      this.collectSystemMetrics();
      this.resetMetrics();
    }, interval);

    logger.info('System monitoring started', {
      interval,
      startTime: new Date().toISOString()
    });
  }

  // Get current metrics
  async getCurrentMetrics() {
    return {
      ...await this.collectSystemMetrics(),
      startTime: this.startTime
    };
  }
}

// Create and export singleton instance
const monitoringService = new MonitoringService();
export default monitoringService;