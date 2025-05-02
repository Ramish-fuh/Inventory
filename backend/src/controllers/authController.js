import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Log from '../models/Log.js';
import SystemLog from '../models/SystemLog.js';
import logger from '../utils/logger.js';
import crypto from 'crypto';
import { sendEmail } from '../helpers/mailer.js';

export const loginUser = async (req, res) => {
    const { username, password } = req.body;

    try {
        logger.info('Login attempt', { 
            username,
            ip: req.ip,
            userAgent: req.headers['user-agent']
        });

        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }

        const user = await User.findOne({ username });
        if (!user) {
            logger.warn('Failed login attempt - user not found', {
                username,
                ip: req.ip
            });

            await SystemLog.create({
                level: 'warn',
                message: 'Failed login attempt - user not found',
                service: 'auth-service',
                metadata: {
                    username,
                    ip: req.ip,
                    userAgent: req.headers['user-agent']
                }
            });

            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            logger.warn('Failed login attempt - invalid password', {
                username,
                userId: user._id,
                ip: req.ip
            });

            await SystemLog.create({
                level: 'warn',
                message: 'Failed login attempt - invalid password',
                service: 'auth-service',
                metadata: {
                    username,
                    userId: user._id,
                    ip: req.ip,
                    userAgent: req.headers['user-agent']
                }
            });

            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1h' }
        );

        // Update last login timestamp
        await user.updateLastLogin();

        // Log successful login
        await Log.create({
            user: user._id,
            action: 'User Login',
            category: 'Authentication',
            details: `User ${username} logged in successfully`
        });

        await SystemLog.create({
            level: 'info',
            message: 'Successful login',
            service: 'auth-service',
            metadata: {
                username,
                userId: user._id,
                ip: req.ip,
                userAgent: req.headers['user-agent']
            },
            user: user._id
        });

        logger.info('User logged in successfully', {
            userId: user._id,
            username: user.username,
            role: user.role,
            ip: req.ip
        });

        // Return the token with user role
        res.json({ 
            token,
            role: user.role 
        });
    } catch (error) {
        logger.error('Login error', {
            error: error.message,
            stack: error.stack,
            username,
            ip: req.ip
        });

        await SystemLog.create({
            level: 'error',
            message: `Login error: ${error.message}`,
            service: 'auth-service',
            metadata: {
                username,
                ip: req.ip,
                userAgent: req.headers['user-agent']
            },
            trace: error.stack
        });

        res.status(500).json({ message: 'Server error' });
    }
};

export const recoverPassword = async (req, res) => {
    const { email } = req.body;

    try {
        logger.info('Password recovery request', {
            email,
            ip: req.ip
        });

        const user = await User.findOne({ email });
        if (!user) {
            logger.warn('Password recovery attempt for non-existent user', {
                email,
                ip: req.ip
            });

            await SystemLog.create({
                level: 'warn',
                message: 'Password recovery attempt for non-existent user',
                service: 'auth-service',
                metadata: {
                    email,
                    ip: req.ip,
                    userAgent: req.headers['user-agent']
                }
            });

            return res.status(404).json({ message: 'User not found' });
        }

        const token = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await user.save();

        const resetUrl = `http://localhost:5173/reset-password/${token}`;
        await sendEmail(email, 'Password Recovery', `Reset your password here: ${resetUrl}`);

        await Log.create({
            user: user._id,
            action: 'Password Recovery Requested',
            category: 'Authentication',
            details: `Password recovery email sent to ${email}`
        });

        await SystemLog.create({
            level: 'info',
            message: 'Password recovery email sent',
            service: 'auth-service',
            metadata: {
                userId: user._id,
                email,
                ip: req.ip,
                userAgent: req.headers['user-agent']
            },
            user: user._id
        });

        logger.info('Password recovery email sent', {
            userId: user._id,
            email,
            ip: req.ip
        });

        res.status(200).json({ message: 'Password recovery email sent' });
    } catch (error) {
        logger.error('Password recovery error', {
            error: error.message,
            stack: error.stack,
            email,
            ip: req.ip
        });

        await SystemLog.create({
            level: 'error',
            message: `Password recovery error: ${error.message}`,
            service: 'auth-service',
            metadata: {
                email,
                ip: req.ip,
                userAgent: req.headers['user-agent']
            },
            trace: error.stack
        });

        res.status(500).json({ message: 'Server error' });
    }
};

export const resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;

    try {
        logger.info('Password reset attempt', {
            ip: req.ip
        });

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            logger.warn('Invalid or expired password reset token', {
                token,
                ip: req.ip
            });

            await SystemLog.create({
                level: 'warn',
                message: 'Invalid or expired password reset token',
                service: 'auth-service',
                metadata: {
                    token,
                    ip: req.ip,
                    userAgent: req.headers['user-agent']
                }
            });

            return res.status(400).json({ message: 'Password reset token is invalid or has expired' });
        }

        const salt = await bcrypt.genSalt(10);
        user.passwordHash = await bcrypt.hash(newPassword, salt);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        await Log.create({
            user: user._id,
            action: 'Password Reset',
            category: 'Authentication',
            details: 'Password reset successful'
        });

        await SystemLog.create({
            level: 'info',
            message: 'Password reset successful',
            service: 'auth-service',
            metadata: {
                userId: user._id,
                ip: req.ip,
                userAgent: req.headers['user-agent']
            },
            user: user._id
        });

        logger.info('Password reset successful', {
            userId: user._id,
            email: user.email,
            ip: req.ip
        });

        res.json({ message: 'Password reset successful' });
    } catch (error) {
        logger.error('Password reset error', {
            error: error.message,
            stack: error.stack,
            ip: req.ip
        });

        await SystemLog.create({
            level: 'error',
            message: `Password reset error: ${error.message}`,
            service: 'auth-service',
            metadata: {
                ip: req.ip,
                userAgent: req.headers['user-agent']
            },
            trace: error.stack
        });

        res.status(500).json({ message: 'Server error' });
    }
};