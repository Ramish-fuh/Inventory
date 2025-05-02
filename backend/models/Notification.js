import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },  // Who is the notification for
  type: { type: String, required: true },  // Type of notification (e.g., 'asset', 'login')
  message: { type: String, required: true },  // The notification message
  read: { type: Boolean, default: false },  // Whether the user has read the notification
  createdAt: { type: Date, default: Date.now }  // When the notification was created
});

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;