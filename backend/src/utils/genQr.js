import QRCode from 'qrcode';
import logger from './logger.js';

export const generateQRCode = async (req, res) => {
  try {
    const { assetId } = req.params;
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
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

    res.json({ qrCode: qrDataUrl });
  } catch (error) {
    logger.error('Error generating QR code:', error);
    res.status(500).json({ message: 'Error generating QR code' });
  }
};

export const generateQRCodeBuffer = async (assetId) => {
  try {
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