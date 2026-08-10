const nodemailer = require('nodemailer');
const { env, isDevelopment } = require('../config/env');

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;
  if (!env.SMTP_HOST) return null;
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
  });
  return transporter;
};

const sendMail = async ({ to, subject, html, text }) => {
  const client = getTransporter();
  if (!client) {
    if (isDevelopment) console.log(`[mailer] SMTP not configured — skipping email to ${to}: ${subject}`);
    return;
  }

  try {
    await client.sendMail({
      from: `${env.MAIL_FROM_NAME || 'Emmify'} <${env.MAIL_FROM_ADDRESS || env.SMTP_USER}>`,
      to,
      subject,
      html,
      text,
    });
  } catch (error) {
    console.error('[mailer] Failed to send email:', error.message);
  }
};

module.exports = { sendMail };
