import express from 'express';
import { generateQRCode } from '../utils/genQr.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect all routes
router.use(authMiddleware);

// Generate QR code for an asset
router.get('/:assetId', generateQRCode);

export default router;