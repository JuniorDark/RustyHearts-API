import config from './config.js';
const { logger } = config;
import { logSystemInfo } from './utils/systemInfo.js';
import memoryLogger from './utils/memoryLogger.js';
const { setupMemoryLogging } = memoryLogger;

// Import servers
import { startServer as startMainApp } from './servers/mainApp.js';
import { startServer as startUsaApp } from './servers/usaApp.js';
import { startServer as startJpnApp } from './servers/jpnApp.js';
import { startServer as startProxyServer } from './servers/proxyServer.js';

// Parse command line arguments
const args = process.argv.slice(2);
const serversToStart = args.length > 0 ? args : ['mainApp'];

// Start selected servers
const activeServers = [];

if (serversToStart.includes('mainApp')) {
  activeServers.push(startMainApp());
}

if (serversToStart.includes('usaApp')) {
  activeServers.push(startUsaApp());
}

if (serversToStart.includes('jpnApp')) {
  activeServers.push(startJpnApp());
}

if (serversToStart.includes('proxyServer')) {
  activeServers.push(startProxyServer());
}

// System Info
logSystemInfo();

// Memory Logging
const stopMemoryLogging = setupMemoryLogging();

// Handle shutdown
process.on('SIGINT', () => {
  logger.info('Shutting down servers...');
  activeServers.forEach(server => server.close());
  stopMemoryLogging();
  process.exit();
});