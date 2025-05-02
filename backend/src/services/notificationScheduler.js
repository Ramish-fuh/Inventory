import Asset from '../models/Asset.js';
import User from '../models/User.js';
import { sendEmailNotification } from '../helpers/mailer.js';
import { createNotification } from '../helpers/notificationHelper.js';
import logger from '../utils/logger.js';

const CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
const NOTIFICATION_THRESHOLD = 15; // days before expiry/maintenance to notify

export const startNotificationScheduler = () => {
  setInterval(checkAssets, CHECK_INTERVAL);
  logger.info('Notification scheduler started');
};

const checkAssets = async () => {
  try {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + NOTIFICATION_THRESHOLD);

    // Get admin users for notifications
    const adminUsers = await User.find({ role: 'Admin' });
    if (!adminUsers.length) {
      logger.warn('No admin users found for notifications');
      return;
    }

    // Check license expiry
    const assetsWithExpiringLicense = await Asset.find({
      licenseExpiry: {
        $gte: new Date(),
        $lte: thresholdDate
      }
    });

    // Check maintenance due
    const assetsNeedingMaintenance = await Asset.find({
      nextMaintenance: {
        $gte: new Date(),
        $lte: thresholdDate
      }
    });

    // Send notifications for license expiry
    for (const asset of assetsWithExpiringLicense) {
      const daysUntilExpiry = Math.ceil((asset.licenseExpiry - new Date()) / (1000 * 60 * 60 * 24));
      const message = `License for ${asset.name} will expire in ${daysUntilExpiry} days`;
      
      // Create in-app notification for each admin
      for (const admin of adminUsers) {
        await createNotification(admin, 'license', message);
        
        // Send email notification
        await sendEmailNotification(
          admin.email,
          'License Expiry Alert',
          `Dear ${admin.fullName},\n\n${message}\n\nPlease take necessary action to renew the license.`
        );
      }
      
      logger.info(`License expiry notification sent for asset: ${asset.name}`);
    }

    // Send notifications for maintenance due
    for (const asset of assetsNeedingMaintenance) {
      const daysUntilMaintenance = Math.ceil((asset.nextMaintenance - new Date()) / (1000 * 60 * 60 * 24));
      const message = `Maintenance due for ${asset.name} in ${daysUntilMaintenance} days`;
      
      // Create in-app notification for each admin
      for (const admin of adminUsers) {
        await createNotification(admin, 'maintenance', message);
        
        // Send email notification
        await sendEmailNotification(
          admin.email,
          'Maintenance Due Alert',
          `Dear ${admin.fullName},\n\n${message}\n\nPlease schedule maintenance for this asset.`
        );
      }
      
      logger.info(`Maintenance notification sent for asset: ${asset.name}`);
    }
  } catch (error) {
    logger.error('Error in notification scheduler:', error);
  }
};