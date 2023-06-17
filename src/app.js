// Load environment variables
const env = require('./utils/env');

// Import modules
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const expressWinston = require('express-winston');
const { logger } = require('./utils/logger');
const path = require('path');

// Import routes
const authRouter = require('./routes/auth');
const billingRouter = require('./routes/billing');
const gatewayRouter = require('./routes/gateway');
const loginRouter = require('./routes/launcher/login');
const registerRouter = require('./routes/launcher/register');
const codeVerificationRouter = require('./routes/launcher/codeVerification');
const passwordResetEmailRouter = require('./routes/launcher/passwordResetEmail');
const passwordChangeRouter = require('./routes/launcher/changePassword');
const verificationEmailRouter = require('./routes/launcher/verificationEmail');
const launcherUpdaterRouter = require('./routes/launcher/launcherUpdater');

// Set up rate limiter
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // limit each IP to 60 requests per minute
  message: 'Too many requests from this IP, please try again later'
});

const app = express();

// Set up middleware
const middleware = [
  cors(),
  compression(),
  express.json(),
  express.urlencoded({ extended: false }),
];

if (process.env.ENABLE_HELMET === 'true') {
  middleware.unshift(helmet());
}

app.use(...middleware);

const authPort = process.env.AUTH_PORT || 8070;
const billingPort = process.env.BILLING_PORT || 8080;

// Set up routes
app.use('/serverApi/auth', limiter, authRouter).listen(authPort, '127.0.0.1');
app.use('/serverApi/billing', limiter , billingRouter).listen(billingPort, '127.0.0.1');
app.use('/serverApi/gateway', limiter , gatewayRouter);
app.use('/accountApi/register', limiter , registerRouter);
app.use('/accountApi/login', limiter , loginRouter);
app.use('/accountApi/codeVerification', limiter , codeVerificationRouter);
app.use('/accountApi/sendPasswordResetEmail', limiter , passwordResetEmailRouter);
app.use('/accountApi/changePassword', limiter , passwordChangeRouter);
app.use('/accountApi/sendVerificationEmail', limiter , verificationEmailRouter);
app.use('/launcherApi/launcherUpdater', launcherUpdaterRouter);

// Serve static files from public folder
app.use(express.static('../public'));

// Serve static files for the launcher
app.get('/launcher/news', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/launcher/news/news-panel.html'));
});

app.get('/launcher/agreement', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/launcher/news/agreement.html'));
});

app.get('/favicon.ico', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/launcher/news/favicon.ico'));
});

app.use('/launcher/news/images', express.static(path.join(__dirname, '../public/launcher/news/images')));
app.use('/launcher/news', express.static(path.join(__dirname, '../public/launcher/news')));
app.use('/launcher/patch', express.static(path.join(__dirname, '../public/launcher/patch')));


// Set up error handling middleware
app.use((err, req, res, next) => {
  if (env.LOG_LEVEL && env.LOG_LEVEL === 'error') {
    logger.error(err.stack);
  } else {
    logger.info(err.stack);
  }
  res.status(500).send('Something went wrong' + err.stack);
});

// Start server
const port = process.env.PORT || 3000;
const publicIP = process.env.PUBLIC_IP || '0.0.0.0';
app.listen(port, publicIP, () => {
  logger.info(`API listening on ${publicIP}:${port}`);
  logger.info(`Auth API listening on 127.0.0.1:${authPort}`);
  logger.info(`Billing API listening on 127.0.0.1:${billingPort}`);
});