import { Router } from 'express';
const router = Router();
import { Socket } from 'net';
import config from '../config.js';
const { ports, ips, logger } = config;
import { create } from 'xmlbuilder2';

// Constants
const SOCKET_TIMEOUT = 2000;
const GATEWAY_STATUS = {
  ONLINE: 'online',
  OFFLINE: 'offline'
};

/**
 * Build XML response for gateway info
 */
function buildGatewayXml() {
  return create({ version: '1.0', encoding: 'ISO-8859-1' })
    .ele('network')
      .ele('gateserver')
        .att('ip', ips.gate)
        .att('port', ports.gate)
      .up()
    .end({ prettyPrint: true });
}

/**
 * Build gateway info route response
 */
function buildGatewayInfo(req) {
  const baseUrl = `${req.protocol}://${req.headers.host}`;
  return `1|${baseUrl}/launcher/GetGatewayAction|${baseUrl}/launcher/GetGatewayAction|`;
}

/**
 * Check gateway server status via socket connection
 */
async function checkGatewayStatus() {
  return new Promise((resolve) => {
    const socket = new Socket();
    socket.setTimeout(SOCKET_TIMEOUT);

    socket.on('connect', () => {
      socket.destroy();
      resolve({ status: GATEWAY_STATUS.ONLINE });
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve({ status: GATEWAY_STATUS.OFFLINE, code: 408 });
    });

    socket.on('error', () => {
      socket.destroy();
      resolve({ status: GATEWAY_STATUS.OFFLINE, code: 503 });
    });

    socket.connect(ports.gate, ips.gate);
  });
}

// Main gateway route
router.get('/', (req, res) => {
  try {
    res.set('Content-Type', 'application/xml');
    res.send(buildGatewayXml());
    logger.debug(`[Gateway] XML served to ${req.ip}`);
  } catch (error) {
    logger.error(`[Gateway] XML generation failed: ${error.message}`);
    res.status(500).send('Internal Server Error');
  }
});

// Gateway info route
router.get('/info', (req, res) => {
  try {
    res.send(buildGatewayInfo(req));
    logger.debug(`[Gateway] Info served to ${req.ip}`);
  } catch (error) {
    logger.error(`[Gateway] Info generation failed: ${error.message}`);
    res.status(500).send('Internal Server Error');
  }
});

// Gateway status route
router.get('/status', async (req, res) => {
  try {
    const { status, code } = await checkGatewayStatus();
    
    logger[status === GATEWAY_STATUS.ONLINE ? 'info' : 'warn'](
      `[Gateway] Status check from ${req.ip}: ${status}`
    );

    res.status(status === GATEWAY_STATUS.ONLINE ? 200 : code || 503)
       .json({ status });
  } catch (error) {
    logger.error(`[Gateway] Status check failed: ${error.message}`);
    res.status(500).json({ status: GATEWAY_STATUS.OFFLINE });
  }
});

export default router;