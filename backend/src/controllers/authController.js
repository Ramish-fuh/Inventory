import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Log from '../models/Log.js';
import logger from '../utils/logger.js';

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