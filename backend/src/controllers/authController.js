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
            logger.warn('Login failed - missing credentials', { username });
            return res.status(400).json({ message: 'Username and password are required' });
        }

        const user = await User.findOne({ username });
        
        if (!user) {
            logger.warn('Login failed - user not found', { username });
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        
        if (!isPasswordValid) {
            logger.warn('Login failed - invalid password', { username });
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Update last login timestamp
        user.lastLogin = new Date();
        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Log successful login
        await Log.create({
            user: user._id,
            action: 'Login',
            category: 'Authentication',
            details: 'User logged in successfully'
        });

        logger.info('Login successful', {
            userId: user._id,
            username: user.username,
            role: user.role
        });

        return res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                fullName: user.fullName
            }
        });
    } catch (error) {
        logger.error('Login error', {
            error: error.message,
            stack: error.stack,
            username
        });

        await SystemLog.create({
            level: 'error',
            message: 'Login error',
            service: 'auth-service',
            metadata: {
                error: error.message,
                username,
                ip: req.ip
            },
            trace: error.stack
        });

        return res.status(500).json({ message: 'Server error during login' });
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

export const setupInitialAdmin = async (req, res) => {
    logger.debug('Setup initial admin request received', {
        path: req.path,
        method: req.method,
        ip: req.ip
    });

    try {
        // Check if we're in production and if initialization is allowed
        if (process.env.NODE_ENV === 'production' && process.env.ALLOW_ADMIN_SETUP !== 'true') {
            logger.warn('Attempted admin setup in production without authorization', { ip: req.ip });
            return res.status(403).json({ message: 'Admin setup is disabled in production' });
        }

        // Verify initialization token
        const initToken = req.headers['x-init-token'];
        if (!initToken || initToken !== process.env.INIT_TOKEN) {
            logger.warn('Invalid initialization token', { ip: req.ip });
            return res.status(403).json({ message: 'Invalid initialization token' });
        }

        // Check if admin already exists
        const adminExists = await User.findOne({ role: 'Admin' });
        if (adminExists) {
            logger.debug('Admin user already exists', { adminId: adminExists._id });
            return res.status(400).json({ message: 'Admin user already exists' });
        }

        // Validate provided password or use secure generated password
        const { password = crypto.randomBytes(16).toString('hex') } = req.body;
        if (password.length < 12) {
            return res.status(400).json({ message: 'Password must be at least 12 characters long' });
        }

        const salt = await bcrypt.genSalt(12); // Increased from 10 to 12 rounds
        const passwordHash = await bcrypt.hash(password, salt);
        
        const admin = new User({
            username: 'admin',
            email: process.env.ADMIN_EMAIL || 'admin@example.com',
            fullName: 'System Admin',
            role: 'Admin',
            department: 'IT',
            passwordHash,
            isActive: true
        });

        await admin.save();

        // Create system log entry
        await SystemLog.create({
            level: 'info',
            message: 'Initial admin user created',
            service: 'auth-service',
            metadata: {
                ip: req.ip,
                userAgent: req.headers['user-agent']
            }
        });

        logger.info('Initial admin user created via setup endpoint', {
            userId: admin._id,
            username: admin.username,
            ip: req.ip
        });

        return res.status(201).json({ 
            message: 'Initial admin user created successfully',
            username: admin.username,
            password: password === req.body.password ? undefined : password // Only return if auto-generated
        });

    } catch (error) {
        logger.error('Setup initial admin error', {
            error: error.message,
            stack: error.stack,
            ip: req.ip
        });
        return res.status(500).json({ message: 'Error creating initial admin user' });
    }
};