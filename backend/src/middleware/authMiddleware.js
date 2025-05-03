import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import logger from '../utils/logger.js';

const authMiddleware = async (req, res, next) => {
    logger.debug('Auth middleware request', {
        path: req.path,
        method: req.method,
        headers: req.headers,
        body: req.body
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
            return res.status(401).json({ message: 'Authentication required' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        req.user = user;
        next();
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