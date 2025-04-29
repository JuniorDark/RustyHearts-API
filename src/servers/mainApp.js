import express from 'express';
import config from '../config.js';
const { ports, ips, apiConfig, middleware, staticPaths, logger } = config;
import rateLimiter from '../lib/rateLimiter.js';
import { closeConnection } from '../lib/closeConnection.js';
import path from 'path';

// Routers
import gatewayRouter from '../routes/gateway.js';
import loginRouter from '../routes/launcher/login.js';
import registerRouter from '../routes/launcher/registerAccount.js';
import codeVerificationRouter from '../routes/launcher/codeVerification.js';
import passwordResetEmailRouter from '../routes/launcher/passwordResetEmail.js';
import passwordChangeRouter from '../routes/launcher/changePassword.js';
import verificationEmailRouter from '../routes/launcher/verificationEmail.js';
import launcherUpdaterRouter from '../routes/launcher/launcherUpdater.js';
import onlineCountRouter from '../routes/onlineCount.js';

const app = express();
if (apiConfig.trustProxyEnabled) {
  const trustProxyHosts = apiConfig.trustProxyHosts || [];

  if (trustProxyHosts.length > 0) {
    app.set("trust proxy", trustProxyHosts);
  } else {
    app.set("trust proxy", true);
  }
}
app.disable("x-powered-by");
app.disable("etag");

// Middleware
app.use(...middleware.getMiddleware());

// Routes
app.use('/launcher/GetGatewayAction', closeConnection, rateLimiter, gatewayRouter);
app.use('/launcher/SignupAction', closeConnection, rateLimiter, registerRouter);
app.use('/launcher/LoginAction', closeConnection, rateLimiter, loginRouter);
app.use('/launcher/VerifyCodeAction', closeConnection, rateLimiter, codeVerificationRouter);
app.use('/launcher/ResetPasswordAction', closeConnection, rateLimiter, passwordChangeRouter);
app.use('/launcher/SendPasswordResetEmailAction', closeConnection, rateLimiter, passwordResetEmailRouter);
app.use('/launcher/SendVerificationEmailAction', closeConnection, rateLimiter, verificationEmailRouter);
app.use('/launcherAction', closeConnection, rateLimiter, launcherUpdaterRouter);
app.use('/launcher/GetOnlineCountAction', closeConnection, rateLimiter, onlineCountRouter);

// Static files
app.use(express.static(staticPaths.public));
app.use('/launcher/news', express.static(staticPaths.launcherNews));
app.use('/site', express.static(staticPaths.site));
app.use('/launcher/patch', express.static(staticPaths.launcherPatch));
app.use('/launcher/client', express.static(staticPaths.launcherClient));

// HTML routes
app.get('/launcher/news', (req, res) => {
  res.sendFile(path.join(staticPaths.launcherNews, 'news-panel.html'));
});

app.get('/launcher/agreement', (req, res) => {
  res.sendFile(path.join(staticPaths.launcherNews, 'agreement.html'));
});

app.get('/favicon.ico', (req, res) => {
  res.sendFile(path.join(staticPaths.launcherNews, 'favicon.ico'));
});

app.get('/Register', (req, res) => {
  res.sendFile(path.join(staticPaths.site, 'Signup.html'));
});

// Error handler
app.use((err, req, res, next) => {
  logger.error(err.stack);
  return res.status(500).json({
    result: 'ServerError',
    message: 'A server error occurred. Please try again later.'
  });
});

const startServer = () => {
  return app.listen(ports.main, ips.public, () => {
    logger.info(`API listening on ${ips.public}:${ports.main}`);
  });
};

export { app, startServer };