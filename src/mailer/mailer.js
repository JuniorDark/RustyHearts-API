const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');
const { mailerLogger } = require('../utils/logger');

// Load the email templates
const emailTemplates = {
  confirmation: fs.readFileSync(path.join(__dirname, 'templates', 'confirmationTemplate.hbs'), 'utf-8'),
  verification: fs.readFileSync(path.join(__dirname, 'templates', 'verificationTemplate.hbs'), 'utf-8'),
  passwordReset: fs.readFileSync(path.join(__dirname, 'templates', 'passwordResetTemplate.hbs'), 'utf-8'),
  passwordChanged: fs.readFileSync(path.join(__dirname, 'templates', 'passwordChangedTemplate.hbs'), 'utf-8')
};

// Compile the email templates
const compiledTemplates = {
  confirmation: handlebars.compile(emailTemplates.confirmation),
  verification: handlebars.compile(emailTemplates.verification),
  passwordReset: handlebars.compile(emailTemplates.passwordReset),
  passwordChanged: handlebars.compile(emailTemplates.passwordChanged)
};

// SMTP transport configuration
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_ENCRYPTION === 'ssl' || process.env.SMTP_ENCRYPTION === 'tls',
    auth: {
      user: process.env.SMTP_USERNAME,
      pass: process.env.SMTP_PASSWORD
    }
  });

function sendConfirmationEmail(email, windyCode) {
  const template = compiledTemplates.confirmation;
  const emailContent = template({ windyCode });

  const mailOptions = {
	from: `"${process.env.SMTP_FROMNAME}" <${process.env.SMTP_USERNAME}>`,
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
  const template = compiledTemplates.verification;
  const emailContent = template({ verificationCode });

  const mailOptions = {
    from: `"${process.env.SMTP_FROMNAME}" <${process.env.SMTP_USERNAME}>`,
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
  const template = compiledTemplates.passwordReset;
  const emailContent = template({ verificationCode });

  const mailOptions = {
    from: `"${process.env.SMTP_FROMNAME}" <${process.env.SMTP_USERNAME}>`,
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
  const template = compiledTemplates.passwordChanged;
  const emailContent = template({ windyCode });

  const mailOptions = {
    from: `"${process.env.SMTP_FROMNAME}" <${process.env.SMTP_USERNAME}>`,
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

module.exports = {sendConfirmationEmail, sendVerificationEmail, sendPasswordResetEmail, sendPasswordChangedEmail};