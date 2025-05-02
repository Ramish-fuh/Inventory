import QRCode from 'qrcode';
import logger from './logger.js';
import SystemLog from '../models/SystemLog.js';

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

export const generateQRCodeBuffer = async (data, options = {}) => {
  try {
    logger.info('Generating QR code', {
      dataType: typeof data,
      options
    });

    const startTime = Date.now();

    // Default options for optimal asset tracking QR codes
    const qrOptions = {
      errorCorrectionLevel: 'H', // Highest error correction level
      margin: 2,
      width: 300,
      color: {
        dark: '#000000',
        light: '#ffffff'
      },
      ...options
    };

    const buffer = await QRCode.toBuffer(
      typeof data === 'string' ? data : JSON.stringify(data),
      qrOptions
    );

    const duration = Date.now() - startTime;

    // Log successful generation
    logger.info('QR code generated successfully', {
      size: buffer.length,
      duration,
      options: qrOptions
    });

    // Log to system logs for tracking
    await SystemLog.create({
      level: 'info',
      message: 'QR code generated',
      service: 'qr-generator',
      metadata: {
        size: buffer.length,
        duration,
        options: qrOptions
      }
    });

    return buffer;
  } catch (error) {
    logger.error('Error generating QR code', {
      error: error.message,
      stack: error.stack,
      data: typeof data === 'string' ? data : JSON.stringify(data),
      options
    });

    await SystemLog.create({
      level: 'error',
      message: 'Error generating QR code',
      service: 'qr-generator',
      metadata: {
        error: error.message,
        dataType: typeof data,
        options
      },
      trace: error.stack
    });

    throw error;
  }
};

export const generateQRCodeDataURL = async (data, options = {}) => {
  try {
    logger.info('Generating QR code data URL', {
      dataType: typeof data,
      options
    });

    const startTime = Date.now();

    const qrOptions = {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 300,
      color: {
        dark: '#000000',
        light: '#ffffff'
      },
      ...options
    };

    const dataUrl = await QRCode.toDataURL(
      typeof data === 'string' ? data : JSON.stringify(data),
      qrOptions
    );

    const duration = Date.now() - startTime;

    logger.info('QR code data URL generated successfully', {
      length: dataUrl.length,
      duration,
      options: qrOptions
    });

    await SystemLog.create({
      level: 'info',
      message: 'QR code data URL generated',
      service: 'qr-generator',
      metadata: {
        length: dataUrl.length,
        duration,
        options: qrOptions
      }
    });

    return dataUrl;
  } catch (error) {
    logger.error('Error generating QR code data URL', {
      error: error.message,
      stack: error.stack,
      data: typeof data === 'string' ? data : JSON.stringify(data),
      options
    });

    await SystemLog.create({
      level: 'error',
      message: 'Error generating QR code data URL',
      service: 'qr-generator',
      metadata: {
        error: error.message,
        dataType: typeof data,
        options
      },
      trace: error.stack
    });

    throw error;
  }
};