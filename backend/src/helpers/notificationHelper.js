import Notification from '../models/Notification.js';

// Function to create a new notification
export const createNotification = async (user, type, message) => {
  try {
    const newNotification = new Notification({
      user: user._id,  // The logged-in user
      type: type,  // The type of notification (e.g., 'login', 'asset')
      message: message  // The notification message
    });

    await newNotification.save();  // Save the notification to the database
    console.log('Notification created:', newNotification);
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};