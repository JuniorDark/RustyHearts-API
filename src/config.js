import dotenv from 'dotenv';
dotenv.config();

import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import cors from 'cors';
import compression from 'compression';
import express from 'express';
import helmet from 'helmet';

import { logger } from './utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default {
  // Port configurations
  ports: {
    main: process.env.API_LISTEN_PORT || 80,
    usaApp: process.env.API_USA_PORT || 8070,
    jpnApp: process.env.API_JPN_PORT || 8080,
    proxy: process.env.API_PROXY_PORT || 8090,
    gate: process.env.GATESERVER_PORT || 50001,
  },
  
  // IP configurations
  ips: {
    public: process.env.API_LISTEN_HOST || '0.0.0.0',
    local: process.env.API_LOCAL_LISTEN_HOST || '127.0.0.1',
    gate: process.env.GATESERVER_IP,
  },
  
  // configurations
  config: {
    serverId: Number(process.env.SERVER_ID) || 10101,
    shopBalance: process.env.API_SHOP_INITIAL_BALANCE || 0,
    timeZone: process.env.TZ,
  },

  // API configurations
  apiConfig: {
    trustProxyEnabled: process.env.API_TRUSTPROXY_ENABLE || 'false',
    trustProxyHosts: process.env.API_TRUSTPROXY_HOSTS || [],
    logIPAddresses: process.env.LOG_IP_ADDRESSES || 'false',
  },
  
  // Mailer configurations
  mailer: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_ENCRYPTION === 'ssl' || process.env.SMTP_ENCRYPTION === 'tls',
    auth: {
      user: process.env.SMTP_USERNAME,
      pass: process.env.SMTP_PASSWORD
    }
  },

  // middleware
  middleware: {
    baseMiddleware: [
      cors(),
      compression(),
      express.json(),
      express.urlencoded({ extended: true }),
    ],
    
    getMiddleware: function () {
      const middleware = [...this.baseMiddleware];
      if (process.env.API_ENABLE_HELMET === 'true') {
        middleware.unshift(helmet());
      }
      return middleware;
    }
  },
  
  // Static file paths
  staticPaths: {
    public: path.join(__dirname, '../public'),
    launcherNews: path.join(__dirname, '../public/launcher/news'),
    launcherNewsImages: path.join(__dirname, '../public/launcher/news/images'),
    launcherPatch: path.join(__dirname, '../public/launcher/patch'),
    launcherClient: path.join(__dirname, '../public/launcher/client'),
    site: path.join(__dirname, '../public/site'),
  },
  
  // Logger
  logger,
  
  // Backend configuration for proxy
  BACKENDS: {
    AUTH: {
      paths: ['/Auth/cgi-bin/auth_rest_oem.cgi']
    },
    BILLING: {
      paths: ['/Billing/S1/ApiPointTotalGetS.php', '/Billing/S1/ApiPointMoveS.php']
    }
  }
};