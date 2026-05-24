/**
 * Email Configuration for Brevo SMTP
 */
const mailConfig = {
  host: process.env.EMAIL_HOST || 'smtp-relay.brevo.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    // Accept self-signed / untrusted certs from the relay (common in dev/corp networks)
    rejectUnauthorized: false,
  },
  from: `EthioCampGround <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
};

module.exports = mailConfig;
