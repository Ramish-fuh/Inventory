
import express from 'express';
import {
  getLogs,
  getLogById,
  createLog,
  updateLog,
  deleteLog
} from '../controllers/logController.js';

const router = express.Router();

// GET /api/logs
router.get('/', getLogs);

// GET /api/logs/:id
router.get('/:id', getLogById);

// POST /api/logs
router.post('/', createLog);

// PUT /api/logs/:id
router.put('/:id', updateLog);

// DELETE /api/logs/:id
router.delete('/:id', deleteLog);

export default router;