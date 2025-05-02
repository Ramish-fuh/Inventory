import express from 'express';
import { getUserNotifications, markNotificationAsRead } from '../controllers/notificationController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Route to get all notifications for a user
router.get('/', authMiddleware, getUserNotifications);

// Route to mark a notification as read
router.put('/:notificationId', authMiddleware, markNotificationAsRead);

export default router;