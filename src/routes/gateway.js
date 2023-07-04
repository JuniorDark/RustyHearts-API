const express = require('express');
const router = express.Router();
const net = require('net');
const { logger } = require('../utils/logger');

// Define the gateway route
router.get('/', (req, res) => {
  const ip = process.env.GATESERVER_IP;
  const port = process.env.GATESERVER_PORT || '50001';

  // Generate the XML content with the IP and port values
  const xml = `<?xml version="1.0" encoding="ISO-8859-1"?>
    <network>
      <gateserver ip="${ip}" port="${port}" />
    </network>`;

  res.set('Content-Type', 'application/xml');
  
  res.send(xml);
});

// Define the gateway info route
router.get('/info', (req, res) => {
  const gatewayRoute = `1|${req.protocol}://${req.headers.host}/serverApi/gateway|${req.protocol}://${req.headers.host}/serverApi/gateway|`;
  res.send(gatewayRoute);
});

// Define the gateway status route
router.get('/status', async (req, res) => {
  const ip = process.env.GATESERVER_IP;
  const port = process.env.GATESERVER_PORT || '50001';

  const timeout = 2000;

  // Create a new socket and connect to the gateserver
  const socket = new net.Socket();
  socket.setTimeout(timeout);
  socket.connect(port, ip);

  // Handle the socket events to check the connection status
  socket.on('connect', () => {
    logger.info(`[Gateway] Connection attempt success from IP: ${req.ip}`);
    res.status(200).json({ status: 'online' });
    socket.destroy();
  });
  socket.on('timeout', () => {
    logger.warn(`[Gateway] Connection attempt timeout from IP: ${req.ip}`);
    res.status(408).json({ status: 'offline' });
    socket.destroy();
  });
  socket.on('error', () => {
    logger.error(`[Gateway] Connection failed from IP: ${req.ip}`);
    res.status(503).json({ status: 'offline' });
    socket.destroy();
  });
});

module.exports = router;
