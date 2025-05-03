import nodemailer from 'nodemailer';
import logger from '../utils/logger.js';
import SystemLog from '../models/SystemLog.js';

// Create reusable transporter
const createTransporter = () => {
  try {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  } catch (error) {
    logger.error('Error creating mail transporter', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
};

// Base email sending function with logging
const sendEmail = async (to, subject, html, metadata = {}) => {
  const startTime = Date.now();
  
  try {
    logger.info('Attempting to send email', {
      to,
      subject,
      ...metadata
    });

    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to,
      subject,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    const duration = Date.now() - startTime;

    logger.info('Email sent successfully', {
      to,
      subject,
      messageId: info.messageId,
      duration,
      ...metadata
    });

    await SystemLog.create({
      level: 'info',
      message: 'Email sent successfully',
      service: 'mailer',
      metadata: {
        to,
        subject,
        messageId: info.messageId,
        duration,
        ...metadata
      }
    });

    return info;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('Error sending email', {
      error: error.message,
      stack: error.stack,
      to,
      subject,
      duration,
      ...metadata
    });

    await SystemLog.create({
      level: 'error',
      message: 'Failed to send email',
      service: 'mailer',
      metadata: {
        to,
        subject,
        error: error.message,
        duration,
        ...metadata
      },
      trace: error.stack
    });

    throw error;
  }
};

export { sendEmail };

export const sendPasswordResetEmail = async (to, resetToken, username) => {
  try {
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    const html = `
      <h1>Password Reset Request</h1>
      <p>Hello ${username},</p>
      <p>You requested to reset your password. Click the link below to proceed:</p>
      <a href="${resetLink}">Reset Password</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `;

    return await sendEmail(to, 'Password Reset Request', html, {
      type: 'password-reset',
      username
    });
  } catch (error) {
    logger.error('Error sending password reset email', {
      error: error.message,
      stack: error.stack,
      to,
      username
    });
    throw error;
  }
};

export const sendWelcomeEmail = async (to, username) => {
  try {
    const html = `
      <h1>Welcome to Asset Management System</h1>
      <p>Hello ${username},</p>
      <p>Welcome to our asset management system. Your account has been created successfully.</p>
      <p>You can now log in and start managing your assets.</p>
    `;

    return await sendEmail(to, 'Welcome to Asset Management System', html, {
      type: 'welcome',
      username
    });
  } catch (error) {
    logger.error('Error sending welcome email', {
      error: error.message,
      stack: error.stack,
      to,
      username
    });
    throw error;
  }
};

export const sendMaintenanceNotificationEmail = async (to, asset) => {
  try {
    const daysUntilMaintenance = Math.ceil(
      (asset.nextMaintenance - new Date()) / (1000 * 60 * 60 * 24)
    );

    const html = `
      <h1>Asset Maintenance Due</h1>
      <p>This is a reminder that maintenance is due in ${daysUntilMaintenance} days for:</p>
      <ul>
        <li>Asset: ${asset.name}</li>
        <li>Tag: ${asset.assetTag}</li>
        <li>Maintenance Date: ${asset.nextMaintenance.toLocaleDateString()}</li>
      </ul>
      <p>Please ensure this maintenance is scheduled and completed on time.</p>
    `;

    return await sendEmail(to, 'Asset Maintenance Due', html, {
      type: 'maintenance-notification',
      assetId: asset._id,
      assetTag: asset.assetTag,
      daysUntilMaintenance
    });
  } catch (error) {
    logger.error('Error sending maintenance notification email', {
      error: error.message,
      stack: error.stack,
      to,
      assetId: asset._id,
      assetTag: asset.assetTag
    });
    throw error;
  }
};

export const sendAssetAssignmentEmail = async (to, asset, action) => {
  try {
    const subject = action === 'assigned' 
      ? 'Asset Assigned to You'
      : 'Asset Unassigned from You';

    const html = `
      <h1>${subject}</h1>
      <p>This email is to inform you that the following asset has been ${action} ${action === 'assigned' ? 'to' : 'from'} you:</p>
      <ul>
        <li>Asset: ${asset.name}</li>
        <li>Tag: ${asset.assetTag}</li>
        <li>Category: ${asset.category}</li>
        ${asset.location ? `<li>Location: ${asset.location}</li>` : ''}
      </ul>
      ${action === 'assigned' 
        ? '<p>Please ensure you follow all relevant policies regarding asset usage and care.</p>'
        : '<p>Please ensure all asset-related materials have been returned.</p>'
      }
    `;

    return await sendEmail(to, subject, html, {
      type: 'asset-assignment',
      action,
      assetId: asset._id,
      assetTag: asset.assetTag
    });
  } catch (error) {
    logger.error('Error sending asset assignment email', {
      error: error.message,
      stack: error.stack,
      to,
      assetId: asset._id,
      assetTag: asset.assetTag,
      action
    });
    throw error;
  }
};

// Test email configuration
export const testEmailConfiguration = async () => {
  try {
    logger.info('Testing email configuration');
    const startTime = Date.now();

    const transporter = createTransporter();
    await transporter.verify();

    const duration = Date.now() - startTime;
    logger.info('Email configuration test successful', { duration });

    await SystemLog.create({
      level: 'info',
      message: 'Email configuration test successful',
      service: 'mailer',
      metadata: { duration }
    });

    return true;
  } catch (error) {
    logger.error('Email configuration test failed', {
      error: error.message,
      stack: error.stack
    });

    await SystemLog.create({
      level: 'error',
      message: 'Email configuration test failed',
      service: 'mailer',
      metadata: {
        error: error.message
      },
      trace: error.stack
    });

    throw error;
  }
};