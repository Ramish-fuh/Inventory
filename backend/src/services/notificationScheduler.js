import schedule from 'node-schedule';
import Asset from '../models/Asset.js';
import User from '../models/User.js';
import { createNotification } from '../helpers/notificationHelper.js';
import { sendMaintenanceNotificationEmail } from '../helpers/mailer.js';
import logger from '../utils/logger.js';
import SystemLog from '../models/SystemLog.js';
import cron from 'node-cron';
import Notification from '../models/Notification.js';
import { sendNotification } from '../helpers/notificationHelper.js';

// Schedule configurations
const MAINTENANCE_CHECK_SCHEDULE = '0 0 * * *'; // Daily at midnight
const WARRANTY_CHECK_SCHEDULE = '0 0 * * *'; // Daily at midnight
const LICENSE_CHECK_SCHEDULE = '0 0 * * *'; // Daily at midnight

const checkMaintenanceDue = async () => {
  try {
    logger.info('Starting scheduled maintenance check');
    const startTime = Date.now();

    // Get assets due for maintenance in next 30 days
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const assets = await Asset.find({
      nextMaintenance: {
        $gte: new Date(),
        $lte: thirtyDaysFromNow
      }
    }).populate('assignedTo');

    logger.info('Found assets due for maintenance', {
      count: assets.length,
      dateRange: {
        start: new Date(),
        end: thirtyDaysFromNow
      }
    });

    // Process each asset
    for (const asset of assets) {
      try {
        const daysUntilMaintenance = Math.ceil(
          (asset.nextMaintenance - new Date()) / (1000 * 60 * 60 * 24)
        );

        // Create notification for assigned user and admins
        const notificationText = `NOTICE: Maintenance due in ${daysUntilMaintenance} days for asset: ${asset.name} (${asset.assetTag})`;
        
        // Notify assigned user
        if (asset.assignedTo) {
          await createNotification(
            asset.assignedTo._id,
            'maintenance',
            notificationText,
            { assetId: asset._id }
          );

          // Send email to assigned user
          await sendMaintenanceNotificationEmail(
            asset.assignedTo.email,
            asset
          );
        }

        // Notify admins
        const admins = await User.find({ role: 'Admin' });
        for (const admin of admins) {
          await createNotification(
            admin._id,
            'maintenance',
            notificationText,
            { assetId: asset._id }
          );

          // Send email to admin
          await sendMaintenanceNotificationEmail(
            admin.email,
            asset
          );
        }

        logger.info('Maintenance notifications sent', {
          assetId: asset._id,
          assetTag: asset.assetTag,
          daysUntilMaintenance,
          notifiedUsers: [
            asset.assignedTo?._id,
            ...admins.map(admin => admin._id)
          ]
        });
      } catch (error) {
        logger.error('Error processing maintenance notification for asset', {
          error: error.message,
          stack: error.stack,
          assetId: asset._id,
          assetTag: asset.assetTag
        });

        await SystemLog.create({
          level: 'error',
          message: 'Error processing maintenance notification',
          service: 'notification-scheduler',
          metadata: {
            assetId: asset._id,
            assetTag: asset.assetTag,
            error: error.message
          },
          trace: error.stack
        });
      }
    }

    const duration = Date.now() - startTime;
    logger.info('Maintenance check completed', {
      duration,
      assetsProcessed: assets.length
    });

    await SystemLog.create({
      level: 'info',
      message: 'Scheduled maintenance check completed',
      service: 'notification-scheduler',
      metadata: {
        duration,
        assetsProcessed: assets.length
      }
    });
  } catch (error) {
    logger.error('Error in maintenance check job', {
      error: error.message,
      stack: error.stack
    });

    await SystemLog.create({
      level: 'error',
      message: 'Maintenance check job failed',
      service: 'notification-scheduler',
      metadata: {
        error: error.message
      },
      trace: error.stack
    });
  }
};

const checkWarrantyExpiry = async () => {
  try {
    logger.info('Starting scheduled warranty check');
    const startTime = Date.now();

    // Get assets with warranty expiring in next 90 days
    const ninetyDaysFromNow = new Date();
    ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);

    const assets = await Asset.find({
      warrantyExpiry: {
        $gte: new Date(),
        $lte: ninetyDaysFromNow
      }
    }).populate('assignedTo');

    logger.info('Found assets with expiring warranty', {
      count: assets.length,
      dateRange: {
        start: new Date(),
        end: ninetyDaysFromNow
      }
    });

    // Process each asset
    for (const asset of assets) {
      try {
        const daysUntilExpiry = Math.ceil(
          (asset.warrantyExpiry - new Date()) / (1000 * 60 * 60 * 24)
        );

        const notificationText = `WARNING: Warranty expiring in ${daysUntilExpiry} days for asset: ${asset.name} (${asset.assetTag})`;

        // Notify assigned user if exists
        if (asset.assignedTo) {
          await createNotification(
            asset.assignedTo._id,
            'warranty',
            notificationText,
            { assetId: asset._id }
          );
        }

        // Notify admins
        const admins = await User.find({ role: 'Admin' });
        for (const admin of admins) {
          await createNotification(
            admin._id,
            'warranty',
            notificationText,
            { assetId: asset._id }
          );
        }

        logger.info('Warranty notifications sent', {
          assetId: asset._id,
          assetTag: asset.assetTag,
          daysUntilExpiry,
          notifiedUsers: [
            asset.assignedTo?._id,
            ...admins.map(admin => admin._id)
          ]
        });
      } catch (error) {
        logger.error('Error processing warranty notification for asset', {
          error: error.message,
          stack: error.stack,
          assetId: asset._id,
          assetTag: asset.assetTag
        });

        await SystemLog.create({
          level: 'error',
          message: 'Error processing warranty notification',
          service: 'notification-scheduler',
          metadata: {
            assetId: asset._id,
            assetTag: asset.assetTag,
            error: error.message
          },
          trace: error.stack
        });
      }
    }

    const duration = Date.now() - startTime;
    logger.info('Warranty check completed', {
      duration,
      assetsProcessed: assets.length
    });

    await SystemLog.create({
      level: 'info',
      message: 'Scheduled warranty check completed',
      service: 'notification-scheduler',
      metadata: {
        duration,
        assetsProcessed: assets.length
      }
    });
  } catch (error) {
    logger.error('Error in warranty check job', {
      error: error.message,
      stack: error.stack
    });

    await SystemLog.create({
      level: 'error',
      message: 'Warranty check job failed',
      service: 'notification-scheduler',
      metadata: {
        error: error.message
      },
      trace: error.stack
    });
  }
};

const checkLicenseExpiry = async () => {
  try {
    logger.info('Starting scheduled license check');
    const startTime = Date.now();

    // Get assets with license expiring in next 90 days
    const ninetyDaysFromNow = new Date();
    ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);

    const assets = await Asset.find({
      licenseExpiry: {
        $gte: new Date(),
        $lte: ninetyDaysFromNow
      }
    }).populate('assignedTo');

    logger.info('Found assets with expiring licenses', {
      count: assets.length,
      dateRange: {
        start: new Date(),
        end: ninetyDaysFromNow
      }
    });

    // Process each asset
    for (const asset of assets) {
      try {
        const daysUntilExpiry = Math.ceil(
          (asset.licenseExpiry - new Date()) / (1000 * 60 * 60 * 24)
        );

        const notificationText = `WARNING: License expiring in ${daysUntilExpiry} days for asset: ${asset.name} (${asset.assetTag})`;

        // Notify assigned user if exists
        if (asset.assignedTo) {
          await createNotification(
            asset.assignedTo._id,
            'license',
            notificationText,
            { assetId: asset._id }
          );
        }

        // Notify admins
        const admins = await User.find({ role: 'Admin' });
        for (const admin of admins) {
          await createNotification(
            admin._id,
            'license',
            notificationText,
            { assetId: asset._id }
          );
        }

        logger.info('License notifications sent', {
          assetId: asset._id,
          assetTag: asset.assetTag,
          daysUntilExpiry,
          notifiedUsers: [
            asset.assignedTo?._id,
            ...admins.map(admin => admin._id)
          ]
        });
      } catch (error) {
        logger.error('Error processing license notification for asset', {
          error: error.message,
          stack: error.stack,
          assetId: asset._id,
          assetTag: asset.assetTag
        });

        await SystemLog.create({
          level: 'error',
          message: 'Error processing license notification',
          service: 'notification-scheduler',
          metadata: {
            assetId: asset._id,
            assetTag: asset.assetTag,
            error: error.message
          },
          trace: error.stack
        });
      }
    }

    const duration = Date.now() - startTime;
    logger.info('License check completed', {
      duration,
      assetsProcessed: assets.length
    });

    await SystemLog.create({
      level: 'info',
      message: 'Scheduled license check completed',
      service: 'notification-scheduler',
      metadata: {
        duration,
        assetsProcessed: assets.length
      }
    });
  } catch (error) {
    logger.error('Error in license check job', {
      error: error.message,
      stack: error.stack
    });

    await SystemLog.create({
      level: 'error',
      message: 'License check job failed',
      service: 'notification-scheduler',
      metadata: {
        error: error.message
      },
      trace: error.stack
    });
  }
};

export const startNotificationScheduler = () => {
  try {
    logger.info('Starting notification scheduler service');

    // Schedule maintenance checks
    schedule.scheduleJob(MAINTENANCE_CHECK_SCHEDULE, checkMaintenanceDue);
    
    // Schedule warranty checks
    schedule.scheduleJob(WARRANTY_CHECK_SCHEDULE, checkWarrantyExpiry);
    
    // Schedule license checks
    schedule.scheduleJob(LICENSE_CHECK_SCHEDULE, checkLicenseExpiry);

    logger.info('Notification scheduler initialized successfully', {
      schedules: {
        maintenance: MAINTENANCE_CHECK_SCHEDULE,
        warranty: WARRANTY_CHECK_SCHEDULE,
        license: LICENSE_CHECK_SCHEDULE
      }
    });

    SystemLog.create({
      level: 'info',
      message: 'Notification scheduler service started',
      service: 'notification-scheduler',
      metadata: {
        schedules: {
          maintenance: MAINTENANCE_CHECK_SCHEDULE,
          warranty: WARRANTY_CHECK_SCHEDULE,
          license: LICENSE_CHECK_SCHEDULE
        }
      }
    });
  } catch (error) {
    logger.error('Error starting notification scheduler', {
      error: error.message,
      stack: error.stack
    });

    SystemLog.create({
      level: 'error',
      message: 'Failed to start notification scheduler',
      service: 'notification-scheduler',
      metadata: {
        error: error.message
      },
      trace: error.stack
    });

    throw error;
  }
};

class NotificationScheduler {
  constructor() {
    this.jobs = new Map();
    logger.info('NotificationScheduler initialized');
  }

  async scheduleNotification(notification) {
    try {
      const startTime = Date.now();
      logger.info('Scheduling new notification', {
        notificationId: notification._id,
        type: notification.type,
        scheduledTime: notification.scheduledTime
      });

      const job = cron.schedule(this.convertToCronExpression(notification.scheduledTime), async () => {
        try {
          await this.processNotification(notification);
        } catch (error) {
          this.handleProcessingError(error, notification);
        }
      });

      this.jobs.set(notification._id.toString(), job);

      const duration = Date.now() - startTime;
      await SystemLog.create({
        level: 'info',
        message: 'Notification scheduled',
        service: 'notification-scheduler',
        metadata: {
          notificationId: notification._id,
          type: notification.type,
          scheduledTime: notification.scheduledTime,
          duration
        }
      });

      logger.info('Notification scheduled successfully', {
        notificationId: notification._id,
        duration
      });
    } catch (error) {
      this.handleSchedulingError(error, notification);
    }
  }

  async processNotification(notification) {
    const startTime = Date.now();
    logger.info('Processing scheduled notification', {
      notificationId: notification._id
    });

    try {
      await sendNotification(notification);
      
      const duration = Date.now() - startTime;
      await SystemLog.create({
        level: 'info',
        message: 'Notification processed and sent',
        service: 'notification-scheduler',
        metadata: {
          notificationId: notification._id,
          type: notification.type,
          duration
        }
      });

      logger.info('Notification processed successfully', {
        notificationId: notification._id,
        duration
      });

      // Clean up the job if it's not recurring
      if (!notification.isRecurring) {
        this.cancelNotification(notification._id);
      }
    } catch (error) {
      this.handleProcessingError(error, notification);
    }
  }

  async cancelNotification(notificationId) {
    try {
      const startTime = Date.now();
      logger.info('Cancelling notification', { notificationId });

      const job = this.jobs.get(notificationId.toString());
      if (job) {
        job.stop();
        this.jobs.delete(notificationId.toString());
      }

      const duration = Date.now() - startTime;
      await SystemLog.create({
        level: 'info',
        message: 'Notification cancelled',
        service: 'notification-scheduler',
        metadata: {
          notificationId,
          duration
        }
      });

      logger.info('Notification cancelled successfully', {
        notificationId,
        duration
      });
    } catch (error) {
      logger.error('Error cancelling notification', {
        error: error.message,
        stack: error.stack,
        notificationId
      });

      await SystemLog.create({
        level: 'error',
        message: 'Error cancelling notification',
        service: 'notification-scheduler',
        metadata: {
          notificationId,
          error: error.message
        },
        trace: error.stack
      });
    }
  }

  convertToCronExpression(scheduledTime) {
    try {
      const date = new Date(scheduledTime);
      return `${date.getMinutes()} ${date.getHours()} ${date.getDate()} ${date.getMonth() + 1} *`;
    } catch (error) {
      logger.error('Error converting to cron expression', {
        error: error.message,
        stack: error.stack,
        scheduledTime
      });
      throw error;
    }
  }

  handleSchedulingError(error, notification) {
    logger.error('Error scheduling notification', {
      error: error.message,
      stack: error.stack,
      notificationId: notification._id
    });

    SystemLog.create({
      level: 'error',
      message: 'Error scheduling notification',
      service: 'notification-scheduler',
      metadata: {
        notificationId: notification._id,
        type: notification.type,
        error: error.message
      },
      trace: error.stack
    }).catch(logError => {
      logger.error('Error creating system log', {
        error: logError.message,
        stack: logError.stack
      });
    });
  }

  handleProcessingError(error, notification) {
    logger.error('Error processing notification', {
      error: error.message,
      stack: error.stack,
      notificationId: notification._id
    });

    SystemLog.create({
      level: 'error',
      message: 'Error processing notification',
      service: 'notification-scheduler',
      metadata: {
        notificationId: notification._id,
        type: notification.type,
        error: error.message
      },
      trace: error.stack
    }).catch(logError => {
      logger.error('Error creating system log', {
        error: logError.message,
        stack: logError.stack
      });
    });
  }
}

export default new NotificationScheduler();