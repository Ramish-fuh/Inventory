import QRCode from 'qrcode';
import logger from './logger.js';

export const generateQRCode = async (req, res) => {
  try {
    const { assetId } = req.params;
    if (!assetId || !assetId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Valid Asset ID is required' });
    }

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    // Create a complete URL including /assets path
    const assetUrl = `${baseUrl}/assets/${assetId}`;

    // Generate QR code as data URL
    const qrDataUrl = await QRCode.toDataURL(assetUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });

    res.json({ qrCode: qrDataUrl, url: assetUrl });
  } catch (error) {
    logger.error('Error generating QR code:', error);
    res.status(500).json({ message: 'Error generating QR code' });
  }
};

export const generateQRCodeBuffer = async (assetId) => {
  try {
    if (!assetId || !assetId.match(/^[0-9a-fA-F]{24}$/)) {
      throw new Error('Valid Asset ID is required');
    }

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const assetUrl = `${baseUrl}/assets/${assetId}`;

    // Generate QR code as buffer
    return await QRCode.toBuffer(assetUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
  } catch (error) {
    logger.error('Error generating QR code buffer:', error);
    throw error;
  }
};