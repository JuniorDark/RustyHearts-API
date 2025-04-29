import { createTransport } from 'nodemailer';
import handlebars from 'handlebars';
import { readFileSync } from 'fs';
import { logger, mailerLogger } from '../utils/logger.js';
import path from 'path';
import config from '../config.js';
const { mailer } = config;
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load and compile email templates
const emailTemplates = {
  confirmation: readFileSync(path.join(__dirname, 'templates', 'confirmationTemplate.hbs'), 'utf-8'),
  verification: readFileSync(path.join(__dirname, 'templates', 'verificationTemplate.hbs'), 'utf-8'),
  passwordReset: readFileSync(path.join(__dirname, 'templates', 'passwordResetTemplate.hbs'), 'utf-8'),
  passwordChanged: readFileSync(path.join(__dirname, 'templates', 'passwordChangedTemplate.hbs'), 'utf-8')
};

const compiledTemplates = {
  confirmation: handlebars.compile(emailTemplates.confirmation),
  verification: handlebars.compile(emailTemplates.verification),
  passwordReset: handlebars.compile(emailTemplates.passwordReset),
  passwordChanged: handlebars.compile(emailTemplates.passwordChanged)
};

// Check for required environment variables
function isMailerConfigured() {
  const requiredEnvVars = [
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_ENCRYPTION',
    'SMTP_USERNAME',
    'SMTP_PASSWORD',
    'SMTP_FROM_NAME'
  ];

  const missing = requiredEnvVars.filter(key => !process.env[key]);
  if (missing.length) {
    logger.warn(`[Mailer] SMTP server is not configured. Missing environment variables: ${missing.join(', ')}`);
    return false;
  }
  return true;
}

// Create transporter
function getTransporter() {
  return createTransport({
    host: mailer.host,
    port: Number(mailer.port),
    secure: mailer.secure,
    auth: {
      user: mailer.auth.user,
      pass: mailer.auth.pass
    },
  });
}

// Email send functions
function sendConfirmationEmail(email, windyCode) {
  if (!isMailerConfigured()) return;

  const transporter = getTransporter();
  const emailContent = compiledTemplates.confirmation({ windyCode });

  const mailOptions = {
    from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_EMAIL_FROM_ADDRESS}>`,
    to: email,
    subject: '[Rusty Hearts] Account Creation Confirmation',
    html: emailContent
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      mailerLogger.error('[Mailer] Error sending confirmation email: ' + error.message);
    } else {
      mailerLogger.info('[Mailer] Confirmation email sent: ' + info.response);
    }
  });
}

function sendVerificationEmail(email, verificationCode) {
  if (!isMailerConfigured()) return;

  const transporter = getTransporter();
  const emailContent = compiledTemplates.verification({ verificationCode });

  const mailOptions = {
    from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_EMAIL_FROM_ADDRESS}>`,
    to: email,
    subject: '[Rusty Hearts] Account Creation',
    html: emailContent
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      mailerLogger.error('[Mailer] Error sending verification email: ' + error.message);
    } else {
      mailerLogger.info('[Mailer] Verification email sent: ' + info.response);
    }
  });
}

function sendPasswordResetEmail(email, verificationCode) {
  if (!isMailerConfigured()) return;

  const transporter = getTransporter();
  const emailContent = compiledTemplates.passwordReset({ verificationCode });

  const mailOptions = {
    from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_EMAIL_FROM_ADDRESS}>`,
    to: email,
    subject: '[Rusty Hearts] Password Reset Request',
    html: emailContent
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      mailerLogger.error('[Mailer] Error sending password reset email: ' + error.message);
    } else {
      mailerLogger.info('[Mailer] Password reset email sent: ' + info.response);
    }
  });
}

function sendPasswordChangedEmail(email, windyCode) {
  if (!isMailerConfigured()) return;

  const transporter = getTransporter();
  const emailContent = compiledTemplates.passwordChanged({ windyCode });

  const mailOptions = {
    from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_EMAIL_FROM_ADDRESS}>`,
    to: email,
    subject: '[Rusty Hearts] Account Password Changed',
    html: emailContent
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      mailerLogger.error('[Mailer] Error sending password changed email: ' + error.message);
    } else {
      mailerLogger.info('[Mailer] Password changed email sent: ' + info.response);
    }
  });
}

export {
  sendConfirmationEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail
};
