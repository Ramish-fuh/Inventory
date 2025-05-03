import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import logger from '../utils/logger.js';

const authMiddleware = async (req, res, next) => {
    logger.debug('Auth middleware request', {
        path: req.path,
        method: req.method
    });

    // Skip auth for public routes
    const publicRoutes = [
        '/api/auth/login',
        '/api/auth/setup',
        '/api/auth/recover-password',
        '/api/auth/reset-password'
    ];
    
    if (publicRoutes.includes(req.path)) {
        logger.debug('Skipping auth for public route', { path: req.path });
        return next();
    }

    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            logger.warn('Missing or invalid Authorization header', { 
                path: req.path,
                headers: req.headers 
            });
            return res.status(401).json({ message: 'Authentication required' });
        }

        const token = authHeader.split(' ')[1];
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET, {
                algorithms: ['HS256'], // Explicitly specify algorithm
                ignoreExpiration: false // Make sure expiration is checked
            });

            // Additional expiration check with some buffer time (5 minutes)
            const currentTimestamp = Math.floor(Date.now() / 1000);
            if (decoded.exp - currentTimestamp < 300) { // 5 minutes
                logger.warn('Token about to expire', {
                    userId: decoded.id,
                    path: req.path,
                    expiresIn: decoded.exp - currentTimestamp
                });
                return res.status(401).json({ message: 'Token is about to expire' });
            }

            const user = await User.findById(decoded.id).select('+isActive');
            if (!user) {
                logger.warn('User not found for valid token', { 
                    userId: decoded.id,
                    path: req.path 
                });
                return res.status(401).json({ message: 'User not found' });
            }

            if (!user.isActive) {
                logger.warn('Inactive user attempted access', { 
                    userId: user._id,
                    path: req.path 
                });
                return res.status(401).json({ message: 'Account is inactive' });
            }

            req.user = user;
            next();
        } catch (jwtError) {
            logger.warn('JWT verification failed', {
                error: jwtError.message,
                path: req.path,
                ip: req.ip
            });
            if (jwtError.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Token has expired' });
            }
            return res.status(401).json({ message: 'Invalid token' });
        }
    } catch (error) {
        logger.error('Auth middleware error', {
            error: error.message,
            path: req.path,
            ip: req.ip
        });
        return res.status(401).json({ message: 'Authentication failed' });
    }
};

export default authMiddleware;