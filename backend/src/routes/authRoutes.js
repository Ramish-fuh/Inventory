import express from 'express';
import { loginUser, recoverPassword, resetPassword, setupInitialAdmin } from '../controllers/authController.js';

const router = express.Router();

router.post('/login', loginUser);

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Public
router.post('/logout', (req, res) => {
  // Clear the token or session (if applicable)
  res.status(200).json({ message: 'Logged out successfully' });
});

// @desc    Request password recovery
// @route   POST /api/auth/recover-password
// @access  Public
router.post('/recover-password', recoverPassword);

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
router.post('/reset-password', resetPassword);

// @desc    Setup initial admin
// @route   POST /api/auth/setup
// @access  Public
router.post('/setup', setupInitialAdmin);

export default router;