import express from 'express';
import { getUsers, getUserById, createUser, updateUser, deleteUser } from '../controllers/userController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect all routes
router.use(authMiddleware);

// Get all users - Admin only
router.get('/', getUsers);

// Get single user by ID - Admin only
router.get('/:id', getUserById);

// Create new user - Admin only
router.post('/', createUser);

// Update user - Admin only
router.put('/:id', updateUser);

// Delete user - Admin only
router.delete('/:id', deleteUser);

export default router;