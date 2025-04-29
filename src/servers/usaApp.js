import express from 'express';
import config from '../config.js';
const { ports, ips, logger } = config;
import authUsaRouter from '../routes/authUsa.js';
import billingRouter from '../routes/billingUsa.js';

const app = express();
app.use('/Auth', authUsaRouter);
app.use('/Billing', billingRouter);

const startServer = () => {
  return app.listen(ports.usaApp, ips.local, () => {
    logger.info(`API (USA) listening on ${ips.local}:${ports.usaApp}`);
  });
};

export { app, startServer };