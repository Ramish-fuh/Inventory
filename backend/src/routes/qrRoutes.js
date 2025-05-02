import express from 'express';
import { generateQRCode } from '../utils/genQr.js';

const router = express.Router();

// Route to generate QR code for asset ID
router.get('/generate', async (req, res) => {
  const { assetId } = req.query; // Extract assetId from query parameter

  if (!assetId) {
    return res.status(400).json({ message: 'Asset ID is required' });
  }

  try {
    // Generate QR code for the given asset ID
    const qrCode = await generateQRCode(assetId);

    // Send back the QR code as a response (could be displayed as an image in frontend)
    res.json({ qrCodeUrl: qrCode });
  } catch (err) {
    res.status(500).json({ message: 'Error generating QR code', error: err.message });
  }
});

export default router;