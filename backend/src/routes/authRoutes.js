import express from 'express';
import { loginUser } from '../controllers/authController.js';

const router = express.Router();

router.post('/login', loginUser);

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Public
router.post('/logout', (req, res) => {
  // Clear the token or session (if applicable)
  res.status(200).json({ message: 'Logged out successfully' });
});

export default router;