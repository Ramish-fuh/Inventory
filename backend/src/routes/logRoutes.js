import express from 'express';
import { getLogs, getSystemLogs, getMetrics, exportLogs } from '../controllers/logController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Require admin role for all log routes
router.use(authMiddleware);

// Get activity logs with filtering
router.get('/activity', getLogs);

// Get system logs with filtering
router.get('/system', getSystemLogs);

// Get performance metrics
router.get('/metrics', getMetrics);

// Export logs
router.get('/export', exportLogs);

export default router;