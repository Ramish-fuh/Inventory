import Notification from '../models/Notification.js';
import SystemLog from '../models/SystemLog.js';
import logger from '../utils/logger.js';

// Get all notifications for the logged-in user
export const getUserNotifications = async (req, res) => {
  try {
    logger.info('Fetching user notifications', {
      userId: req.user._id
    });

    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 });

    await SystemLog.create({
      level: 'info',
      message: 'User notifications fetched',
      service: 'notification-service',
      metadata: {
        userId: req.user._id,
        count: notifications.length
      },
      user: req.user._id
    });

    logger.info('Notifications fetched successfully', {
      userId: req.user._id,
      count: notifications.length
    });

    res.json(notifications);
  } catch (error) {
    logger.error('Error fetching notifications', {
      error: error.message,
      stack: error.stack,
      userId: req.user._id
    });

    await SystemLog.create({
      level: 'error',
      message: `Error fetching notifications: ${error.message}`,
      service: 'notification-service',
      metadata: { userId: req.user._id },
      trace: error.stack,
      user: req.user._id
    });

    res.status(500).json({ message: 'Error fetching notifications' });
  }
};

// Mark a notification as read
export const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    logger.info('Marking notification as read', {
      userId: req.user._id,
      notificationId
    });

    const notification = await Notification.findById(notificationId);

    if (!notification) {
      logger.warn('Notification not found', {
        userId: req.user._id,
        notificationId
      });

      await SystemLog.create({
        level: 'warn',
        message: 'Attempt to mark non-existent notification as read',
        service: 'notification-service',
        metadata: {
          userId: req.user._id,
          notificationId
        },
        user: req.user._id
      });

      return res.status(404).json({ message: 'Notification not found' });
    }

    // Verify notification belongs to user
    if (notification.user.toString() !== req.user._id.toString()) {
      logger.warn('Unauthorized notification access attempt', {
        userId: req.user._id,
        notificationId,
        notificationUserId: notification.user
      });

      await SystemLog.create({
        level: 'warn',
        message: 'Unauthorized attempt to access notification',
        service: 'notification-service',
        metadata: {
          userId: req.user._id,
          notificationId,
          notificationUserId: notification.user
        },
        user: req.user._id
      });

      return res.status(403).json({ message: 'Not authorized' });
    }

    notification.read = true;
    await notification.save();

    await SystemLog.create({
      level: 'info',
      message: 'Notification marked as read',
      service: 'notification-service',
      metadata: {
        userId: req.user._id,
        notificationId,
        notificationType: notification.type
      },
      user: req.user._id
    });

    logger.info('Notification marked as read', {
      userId: req.user._id,
      notificationId,
      type: notification.type
    });

    res.json(notification);
  } catch (error) {
    logger.error('Error marking notification as read', {
      error: error.message,
      stack: error.stack,
      userId: req.user._id,
      notificationId: req.params.notificationId
    });

    await SystemLog.create({
      level: 'error',
      message: `Error marking notification as read: ${error.message}`,
      service: 'notification-service',
      metadata: {
        userId: req.user._id,
        notificationId: req.params.notificationId
      },
      trace: error.stack,
      user: req.user._id
    });

    res.status(500).json({ message: 'Error updating notification' });
  }
};