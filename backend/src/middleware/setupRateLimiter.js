import rateLimit from 'express-rate-limit';
import logger from '../utils/logger.js';

export const setupRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour window
    max: 3, // limit each IP to 3 requests per windowMs
    message: 'Too many setup attempts from this IP, please try again after an hour',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn('Rate limit exceeded for admin setup', {
            ip: req.ip,
            userAgent: req.headers['user-agent']
        });
        res.status(429).json({
            message: 'Too many setup attempts from this IP, please try again after an hour'
        });
    }
});