import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import {
  getAllLogs,
  getLogById,
  createLog,
  updateLog,
  deleteLog
} from '../controllers/logController.js';

const router = express.Router();

// GET /api/logs
router.get('/', authMiddleware, getAllLogs);

// GET /api/logs/:id
router.get('/:id', authMiddleware, getLogById);

// POST /api/logs
router.post('/', authMiddleware, createLog);

// PUT /api/logs/:id
router.put('/:id', authMiddleware, updateLog);

// DELETE /api/logs/:id
router.delete('/:id', authMiddleware, deleteLog);

export default router;