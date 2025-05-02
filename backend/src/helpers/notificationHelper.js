import Notification from '../models/Notification.js';
import logger from '../utils/logger.js'; // Import a custom logger utility

// Function to create a new notification
export const createNotification = async (user, type, message) => {
  try {
    const newNotification = new Notification({
      user: user._id,  // The logged-in user
      type: type,  // The type of notification (e.g., 'login', 'asset')
      message: message  // The notification message
    });

    await newNotification.save();  // Save the notification to the database
    logger.info('Notification created:', newNotification); // Use logger instead of console.log
  } catch (error) {
    logger.error('Error creating notification:', error); // Use logger instead of console.error
  }
};