import express, { urlencoded } from 'express';
import config from '../config.js';
const { ports, ips, logger } = config;
import authJpnRouter from '../routes/authJpn.js';
import billingJpnRouter from '../routes/billingJpn.js';

const app = express();
app.use(urlencoded({ extended: false, type: 'application/x-www-form-urlencoded' }));
app.use('/Auth', authJpnRouter);
app.use('/Billing', billingJpnRouter);

const startServer = () => {
  return app.listen(ports.jpnApp, ips.local, () => {
    logger.info(`API (JPN) listening on ${ips.local}:${ports.jpnApp}`);
  });
};

export { app, startServer };