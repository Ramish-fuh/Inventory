import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Log from '../models/Log.js';
import logger from '../utils/logger.js';
import crypto from 'crypto';
import { sendEmail } from '../helpers/mailer.js';

export const loginUser = async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });
        if (!user) {
            logger.warn('❌ No user found');
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            logger.warn('❌ Password mismatch');
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
        logger.info('✅ Token generated');

        // Log the login action
        await Log.create({
            user: user._id,
            action: 'User Login',
            details: `User ${username} logged in.`
        });

        res.json({ token });
    } catch (error) {
        logger.error('🔥 Login error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

export const recoverPassword = async (req, res) => {
    const { email } = req.body;
    logger.info('RecoverPassword request received for email:', email); // Debugging log

    try {
        const user = await User.findOne({ email });
        if (!user) {
            logger.warn('User not found for email:', email); // Debugging log
            return res.status(404).json({ message: 'User not found' });
        }

        const token = crypto.randomBytes(20).toString('hex');
        logger.info('Generated token for password recovery:', token); // Debugging log

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await user.save();

        const resetUrl = `http://localhost:5173/reset-password/${token}`;
        logger.info('Password recovery email reset URL:', resetUrl); // Debugging log

        await sendEmail(email, 'Password Recovery', `Reset your password here: ${resetUrl}`);
        logger.info('Password recovery email sent successfully to:', email); // Debugging log

        res.status(200).json({ message: 'Password recovery email sent check your email' });
    } catch (error) {
        logger.error('Error in recoverPassword controller:', error); // Debugging log
        res.status(500).json({ message: 'Server error' });
    }
};

export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  logger.info('ResetPassword request received with token:', token); // Debugging log

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      logger.warn('Invalid or expired token:', token); // Debugging log
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10); // Hash the new password
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    logger.info('Password reset successfully for user:', user.email); // Debugging log
    res.status(200).json({ message: 'Password has been reset' });
  } catch (error) {
    logger.error('Error in resetPassword controller:', error); // Debugging log
    res.status(500).json({ message: 'Server error' });
  }
};