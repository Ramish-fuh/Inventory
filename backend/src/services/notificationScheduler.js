import Asset from '../models/Asset.js';
import User from '../models/User.js';
import { sendEmailNotification } from '../helpers/mailer.js';
import { createNotification } from '../helpers/notificationHelper.js';
import logger from '../utils/logger.js';

const CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
const NOTIFICATION_THRESHOLDS = {
  CRITICAL: 7,  // 7 days
  WARNING: 15,  // 15 days
  NOTICE: 30    // 30 days
};

export const startNotificationScheduler = () => {
  checkAssets(); // Run immediately on startup
  setInterval(checkAssets, CHECK_INTERVAL);
  logger.info('Notification scheduler started');
};

const getExpiryStatus = (expiryDate) => {
  if (!expiryDate) return null;
  
  const daysUntilExpiry = Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
  
  if (daysUntilExpiry <= NOTIFICATION_THRESHOLDS.CRITICAL) {
    return 'CRITICAL';
  } else if (daysUntilExpiry <= NOTIFICATION_THRESHOLDS.WARNING) {
    return 'WARNING';
  } else if (daysUntilExpiry <= NOTIFICATION_THRESHOLDS.NOTICE) {
    return 'NOTICE';
  }
  return null;
};

const checkAssets = async () => {
  try {
    const adminUsers = await User.find({ role: 'Admin' });
    if (!adminUsers.length) {
      logger.warn('No admin users found for notifications');
      return;
    }

    // Get all assets that need attention
    const assets = await Asset.find({
      $or: [
        { licenseExpiry: { $exists: true, $ne: null } },
        { warrantyExpiry: { $exists: true, $ne: null } },
        { nextMaintenance: { $exists: true, $ne: null } }
      ]
    });

    for (const asset of assets) {
      // Check license expiry
      const licenseStatus = getExpiryStatus(asset.licenseExpiry);
      if (licenseStatus) {
        const daysUntilExpiry = Math.ceil((new Date(asset.licenseExpiry) - new Date()) / (1000 * 60 * 60 * 24));
        const message = `${licenseStatus}: License for ${asset.name} will expire in ${daysUntilExpiry} days`;
        
        for (const admin of adminUsers) {
          await createNotification(admin, 'license', message);
          await sendEmailNotification(
            admin.email,
            `${licenseStatus} - License Expiry Alert`,
            `Dear ${admin.fullName},\n\n${message}\n\nPlease take necessary action to renew the license.`
          );
        }
      }

      // Check warranty expiry
      const warrantyStatus = getExpiryStatus(asset.warrantyExpiry);
      if (warrantyStatus) {
        const daysUntilExpiry = Math.ceil((new Date(asset.warrantyExpiry) - new Date()) / (1000 * 60 * 60 * 24));
        const message = `${warrantyStatus}: Warranty for ${asset.name} will expire in ${daysUntilExpiry} days`;
        
        for (const admin of adminUsers) {
          await createNotification(admin, 'warranty', message);
          await sendEmailNotification(
            admin.email,
            `${warrantyStatus} - Warranty Expiry Alert`,
            `Dear ${admin.fullName},\n\n${message}\n\nPlease review warranty renewal options.`
          );
        }
      }

      // Check maintenance due
      const maintenanceStatus = getExpiryStatus(asset.nextMaintenance);
      if (maintenanceStatus) {
        const daysUntilMaintenance = Math.ceil((new Date(asset.nextMaintenance) - new Date()) / (1000 * 60 * 60 * 24));
        const message = `${maintenanceStatus}: Maintenance due for ${asset.name} in ${daysUntilMaintenance} days`;
        
        for (const admin of adminUsers) {
          await createNotification(admin, 'maintenance', message);
          await sendEmailNotification(
            admin.email,
            `${maintenanceStatus} - Maintenance Due Alert`,
            `Dear ${admin.fullName},\n\n${message}\n\nPlease schedule maintenance for this asset.`
          );
        }
      }

      // Update next maintenance date if maintenance was performed
      if (asset.lastMaintenance && asset.maintenanceInterval) {
        const nextMaintenanceDate = new Date(asset.lastMaintenance);
        nextMaintenanceDate.setDate(nextMaintenanceDate.getDate() + asset.maintenanceInterval);
        
        if (nextMaintenanceDate > new Date()) {
          asset.nextMaintenance = nextMaintenanceDate;
          await asset.save();
        }
      }
    }
    
    logger.info(`Completed notification check for ${assets.length} assets`);
  } catch (error) {
    logger.error('Error in notification scheduler:', error);
  }
};