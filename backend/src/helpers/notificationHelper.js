import Notification from '../models/Notification.js';
import logger from '../utils/logger.js';
import SystemLog from '../models/SystemLog.js';

const createSystemLogWithRetry = async (logData, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await SystemLog.create(logData);
    } catch (error) {
      if (attempt === maxRetries) {
        logger.error('Failed to create system log after retries', {
          error: error.message,
          attempts: attempt,
          logData
        });
        return null;
      }
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
    }
  }
};

export const createNotification = async (userId, type, message, metadata = {}) => {
  try {
    logger.info('Creating new notification', {
      userId,
      type,
      metadata
    });

    const startTime = Date.now();

    const notification = await Notification.create({
      user: userId,
      type,
      message,
      metadata,
      isRead: false,
      createdAt: new Date()
    });

    const duration = Date.now() - startTime;
    logger.info('Notification created successfully', {
      notificationId: notification._id,
      userId,
      type,
      duration
    });

    await createSystemLogWithRetry({
      level: 'info',
      message: 'New notification created',
      service: 'notification-helper',
      metadata: {
        notificationId: notification._id,
        userId,
        type,
        duration
      }
    });

    return notification;
  } catch (error) {
    logger.error('Error creating notification', {
      error: error.message,
      stack: error.stack,
      userId,
      type
    });

    await createSystemLogWithRetry({
      level: 'error',
      message: 'Failed to create notification',
      service: 'notification-helper',
      metadata: {
        userId,
        type,
        error: error.message
      },
      trace: error.stack
    });

    throw error;
  }
};

export const markNotificationRead = async (notificationId, userId) => {
  try {
    logger.info('Marking notification as read', {
      notificationId,
      userId
    });

    const startTime = Date.now();

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, user: userId },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      const error = new Error('Notification not found or unauthorized');
      logger.warn('Failed to mark notification as read', {
        error: error.message,
        notificationId,
        userId
      });

      await createSystemLogWithRetry({
        level: 'warn',
        message: 'Failed to mark notification as read',
        service: 'notification-helper',
        metadata: {
          notificationId,
          userId,
          error: error.message
        }
      });

      throw error;
    }

    const duration = Date.now() - startTime;
    logger.info('Notification marked as read', {
      notificationId,
      userId,
      duration
    });

    await createSystemLogWithRetry({
      level: 'info',
      message: 'Notification marked as read',
      service: 'notification-helper',
      metadata: {
        notificationId,
        userId,
        duration
      }
    });

    return notification;
  } catch (error) {
    logger.error('Error marking notification as read', {
      error: error.message,
      stack: error.stack,
      notificationId,
      userId
    });

    await createSystemLogWithRetry({
      level: 'error',
      message: 'Error marking notification as read',
      service: 'notification-helper',
      metadata: {
        notificationId,
        userId,
        error: error.message
      },
      trace: error.stack
    });

    throw error;
  }
};

export const deleteNotification = async (notificationId, userId) => {
  try {
    logger.info('Deleting notification', {
      notificationId,
      userId
    });

    const startTime = Date.now();

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      user: userId
    });

    if (!notification) {
      const error = new Error('Notification not found or unauthorized');
      logger.warn('Failed to delete notification', {
        error: error.message,
        notificationId,
        userId
      });

      await createSystemLogWithRetry({
        level: 'warn',
        message: 'Failed to delete notification',
        service: 'notification-helper',
        metadata: {
          notificationId,
          userId,
          error: error.message
        }
      });

      throw error;
    }

    const duration = Date.now() - startTime;
    logger.info('Notification deleted successfully', {
      notificationId,
      userId,
      duration
    });

    await createSystemLogWithRetry({
      level: 'info',
      message: 'Notification deleted',
      service: 'notification-helper',
      metadata: {
        notificationId,
        userId,
        duration
      }
    });

    return notification;
  } catch (error) {
    logger.error('Error deleting notification', {
      error: error.message,
      stack: error.stack,
      notificationId,
      userId
    });

    await createSystemLogWithRetry({
      level: 'error',
      message: 'Error deleting notification',
      service: 'notification-helper',
      metadata: {
        notificationId,
        userId,
        error: error.message
      },
      trace: error.stack
    });

    throw error;
  }
};

export const getUnreadNotificationsCount = async (userId) => {
  try {
    logger.info('Fetching unread notifications count', {
      userId
    });

    const startTime = Date.now();

    const count = await Notification.countDocuments({
      user: userId,
      isRead: false
    });

    const duration = Date.now() - startTime;
    logger.info('Unread notifications count retrieved', {
      userId,
      count,
      duration
    });

    return count;
  } catch (error) {
    logger.error('Error getting unread notifications count', {
      error: error.message,
      stack: error.stack,
      userId
    });

    await createSystemLogWithRetry({
      level: 'error',
      message: 'Error getting unread notifications count',
      service: 'notification-helper',
      metadata: {
        userId,
        error: error.message
      },
      trace: error.stack
    });

    throw error;
  }
};

export const markAllNotificationsRead = async (userId) => {
  try {
    logger.info('Marking all notifications as read', {
      userId
    });

    const startTime = Date.now();

    const result = await Notification.updateMany(
      { user: userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    const duration = Date.now() - startTime;
    logger.info('All notifications marked as read', {
      userId,
      modifiedCount: result.modifiedCount,
      duration
    });

    await createSystemLogWithRetry({
      level: 'info',
      message: 'All notifications marked as read',
      service: 'notification-helper',
      metadata: {
        userId,
        modifiedCount: result.modifiedCount,
        duration
      }
    });

    return result;
  } catch (error) {
    logger.error('Error marking all notifications as read', {
      error: error.message,
      stack: error.stack,
      userId
    });

    await createSystemLogWithRetry({
      level: 'error',
      message: 'Error marking all notifications as read',
      service: 'notification-helper',
      metadata: {
        userId,
        error: error.message
      },
      trace: error.stack
    });

    throw error;
  }
};

export const createBulkNotifications = async (users, type, message, metadata = {}) => {
  try {
    logger.info('Creating bulk notifications', {
      userCount: users.length,
      type,
      message,
      metadata
    });

    const notifications = users.map(user => ({
      user: user._id,
      type,
      message
    }));

    const createdNotifications = await Notification.insertMany(notifications);

    await createSystemLogWithRetry({
      level: 'info',
      message: `Bulk notifications created: ${type}`,
      service: 'notification-helper',
      metadata: {
        userCount: users.length,
        notificationCount: createdNotifications.length,
        type,
        notificationMessage: message,
        ...metadata
      }
    });

    logger.info('Bulk notifications created successfully', {
      userCount: users.length,
      notificationCount: createdNotifications.length,
      type
    });

    return createdNotifications;
  } catch (error) {
    logger.error('Error creating bulk notifications', {
      error: error.message,
      stack: error.stack,
      userCount: users.length,
      type,
      message
    });

    await createSystemLogWithRetry({
      level: 'error',
      message: `Error creating bulk notifications: ${error.message}`,
      service: 'notification-helper',
      metadata: {
        userCount: users.length,
        type,
        notificationMessage: message,
        ...metadata
      },
      trace: error.stack
    }).catch(err => {
      logger.error('Error creating error log', { error: err });
    });

    throw error;
  }
};

export const deleteOldNotifications = async (daysOld = 30) => {
  try {
    logger.info('Deleting old notifications', {
      daysOld
    });

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const deleteResult = await Notification.deleteMany({
      createdAt: { $lt: cutoffDate },
      read: true
    });

    await createSystemLogWithRetry({
      level: 'info',
      message: 'Old notifications deleted',
      service: 'notification-helper',
      metadata: {
        daysOld,
        deletedCount: deleteResult.deletedCount,
        cutoffDate
      }
    });

    logger.info('Old notifications deleted successfully', {
      deletedCount: deleteResult.deletedCount,
      daysOld,
      cutoffDate
    });

    return deleteResult;
  } catch (error) {
    logger.error('Error deleting old notifications', {
      error: error.message,
      stack: error.stack,
      daysOld
    });

    await createSystemLogWithRetry({
      level: 'error',
      message: `Error deleting old notifications: ${error.message}`,
      service: 'notification-helper',
      metadata: {
        daysOld
      },
      trace: error.stack
    }).catch(err => {
      logger.error('Error creating error log', { error: err });
    });

    throw error;
  }
};

export const sendNotification = createNotification;