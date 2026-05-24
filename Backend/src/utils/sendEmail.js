const nodemailer = require('nodemailer');
const mailConfig = require('../config/mail');

/**
 * Singleton Transporter for better performance and connection pooling
 */
const transporter = nodemailer.createTransport({
  host: mailConfig.host,
  port: mailConfig.port,
  secure: mailConfig.secure,
  auth: mailConfig.auth,
  tls: mailConfig.tls,
  pool: true, // Reuse connections
  maxConnections: 5,
  maxMessages: 100,
});

// Verify connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('SMTP Connection Error:', error);
  } else {
    console.log('SMTP Server is ready to take our messages');
  }
});

/**
 * Send an email using Nodemailer
 * @param {Object} options - { email, subject, message, html }
 */
const sendEmail = async (options) => {
  try {
    // Define mail options
    const mailOptions = {
      from: mailConfig.from,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html,
      attachments: options.attachments || []
    };

    // Send the actual email
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    // Log more details if possible
    if (error.response) {
      console.error('SMTP Response:', error.response);
    }
    throw new Error(`Email could not be sent: ${error.message}`);
  }
};

module.exports = sendEmail;
