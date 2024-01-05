// Load environment variables
const env = require('./utils/env');

// Import modules
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const expressWinston = require('express-winston');
const moment = require('moment-timezone');
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
const onlineCountRouter = require('./routes/onlineCount');

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
app.use('/serverApi/onlineCount', limiter , onlineCountRouter);

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
app.use('/launcher/client', express.static(path.join(__dirname, '../public/launcher/client')));


// Set up error handling middleware
app.use((err, req, res, next) => {
  if (env.LOG_LEVEL && env.LOG_LEVEL === 'error') {
    logger.error(err.stack);
  } else {
    logger.info(err.stack);
  }
  res.status(500).send('A error ocurred. Try again later.');
});

// Node.js version
const nodeVersion = process.version;

// timezone
const timezone = process.env.TZ || new Date().toLocaleString('en-US', { timeZoneName: 'short' });
const offsetInMinutes = moment.tz(timezone).utcOffset();
const offsetHours = Math.floor(Math.abs(offsetInMinutes) / 60);
const offsetMinutes = Math.abs(offsetInMinutes) % 60;
const offsetSign = offsetInMinutes >= 0 ? '+' : '-';
const offsetString = `${offsetSign}${offsetHours.toString().padStart(2, '0')}:${offsetMinutes.toString().padStart(2, '0')}`;

const memoryUsage = process.memoryUsage();

// Function to format bytes as human-readable string
function formatBytes(bytes) {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) {
    return '0 B';
  }
  const i = Math.floor(Math.log2(bytes) / 10);
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
}

// Start server
const port = process.env.PORT || 3000;
const publicIP = process.env.PUBLIC_IP || '0.0.0.0';

console.log('--------------------------------------------------');
console.log(`Rusty Hearts API Version: 1.2`)
console.log(`Node.js Version: ${nodeVersion}`);
console.log(`Timezone: ${timezone} (${offsetString})`);
console.log('Memory Usage:');
console.log(`  RSS: ${formatBytes(memoryUsage.rss)}`);
console.log(`  Heap Total: ${formatBytes(memoryUsage.heapTotal)}`);
console.log(`  Heap Used: ${formatBytes(memoryUsage.heapUsed)}`);
console.log(`  External: ${formatBytes(memoryUsage.external)}`);
console.log(`  Array Buffers: ${formatBytes(memoryUsage.arrayBuffers)}`);
console.log('--------------------------------------------------');

// Function to log memory usage
function logMemoryUsage() {
  const now = new Date();
  const formattedDateTime = moment(now).format('YYYY-MM-DD HH:mm:ss');

  const memoryUsage = process.memoryUsage();

  console.log(`Memory Usage at ${formattedDateTime}:`);
  console.log(`  RSS          : ${formatBytes(memoryUsage.rss)}`);
  console.log(`  Heap Total   : ${formatBytes(memoryUsage.heapTotal)}`);
  console.log(`  Heap Used    : ${formatBytes(memoryUsage.heapUsed)}`);
  console.log(`  External     : ${formatBytes(memoryUsage.external)}`);
  console.log(`  Array Buffers: ${formatBytes(memoryUsage.arrayBuffers)}`);
  console.log('--------------------------------------------------');
}

// Log memory usage every 30 minutes (1800000 milliseconds)
const memoryLogInterval = 1800000;

setInterval(logMemoryUsage, memoryLogInterval);

app.listen(port, publicIP, () => {
  logger.info(`API listening on ${publicIP}:${port}`);
  logger.info(`Auth API listening on 127.0.0.1:${authPort}`);
  logger.info(`Billing API listening on 127.0.0.1:${billingPort}`);
});
