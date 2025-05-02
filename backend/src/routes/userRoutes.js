import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { getUsers, getUserById, createUser, updateUser, deleteUser } from '../controllers/userController.js';

const router = express.Router();

// GET all users
router.get('/', authMiddleware, getUsers);

// GET single user by ID
router.get('/:id', authMiddleware, getUserById);

// POST create new user
router.post('/', authMiddleware, createUser);

// PUT update user by ID
router.put('/:id', authMiddleware, updateUser);

// DELETE user by ID
router.delete('/:id', authMiddleware, deleteUser);

export default router;