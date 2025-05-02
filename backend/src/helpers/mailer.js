import nodemailer from 'nodemailer';
import logger from '../utils/logger.js';

const sendEmailNotification = (email, subject, message) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: subject,
    text: message
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      logger.error('Error sending email: ', error);
    } else {
      logger.info('Email sent: ' + info.response);
    }
  });
};

export { sendEmailNotification };