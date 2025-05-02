import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';


const router = express.Router();

// GET all users
router.get('/', authMiddleware, (req, res) => {
  res.send('Get all users');
});

// GET single user by ID
router.get('/:id', authMiddleware, (req, res) => {
  res.send(`Get user with ID ${req.params.id}`);
});

// POST create new user
router.post('/', authMiddleware, (req, res) => {
  res.send('Create a new user');
});

// PUT update user by ID
router.put('/:id', authMiddleware, (req, res) => {
  res.send(`Update user with ID ${req.params.id}`);
});

// DELETE user by ID
router.delete('/:id', authMiddleware, (req, res) => {
  res.send(`Delete user with ID ${req.params.id}`);
});

export default router;