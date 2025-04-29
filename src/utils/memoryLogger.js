import moment from 'moment-timezone';
import { formatBytes } from './systemInfo.js';

function setupMemoryLogging(interval = 1800000) { // 30 minutes
// Set up periodic logging
  const intervalId = setInterval(logMemoryUsage, interval);

  // Return function to stop logging
  return () => {
    clearInterval(intervalId);
    console.log('Stopped memory logging');
  };
}

function logMemoryUsage() {
  const now = moment().format('YYYY-MM-DD HH:mm:ss');
  const mem = process.memoryUsage();
  
  console.log(`Memory Usage at ${now}:`);
  console.log(`  RSS          : ${formatBytes(mem.rss)}`);
  console.log(`  Heap Total   : ${formatBytes(mem.heapTotal)}`);
  console.log(`  Heap Used    : ${formatBytes(mem.heapUsed)}`);
  console.log(`  External     : ${formatBytes(mem.external)}`);
  console.log(`  Array Buffers: ${formatBytes(mem.arrayBuffers)}`);
  console.log('--------------------------------------------------');
}

export default {
  setupMemoryLogging,
  logMemoryUsage
};