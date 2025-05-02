import QRCode from 'qrcode';

// Function to generate a QR code
export const generateQRCode = async (data) => {
  try {
    // Generates a QR code and returns the data URL
    const qrCodeUrl = await QRCode.toDataURL(data);
    return qrCodeUrl;
  } catch (err) {
    console.error('Error generating QR code:', err);
    throw new Error('QR Code generation failed');
  }
};