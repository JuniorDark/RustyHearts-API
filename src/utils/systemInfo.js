import tz from 'moment-timezone';
import fs from 'fs/promises';

const data = await fs.readFile(new URL('../../package.json', import.meta.url), 'utf-8');
const { version: APP_VERSION } = JSON.parse(data);

function formatBytes(bytes) {
  const units = ['B', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
}

function getSystemInfo() {
  const nodeVersion = process.version;
  const timezone = process.env.TZ || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const offsetInMinutes = tz.tz(timezone).utcOffset();
  const offsetSign = offsetInMinutes >= 0 ? '+' : '-';
  const offsetHours = Math.floor(Math.abs(offsetInMinutes) / 60).toString().padStart(2, '0');
  const offsetMinutes = (Math.abs(offsetInMinutes) % 60).toString().padStart(2, '0');
  const offsetString = `${offsetSign}${offsetHours}:${offsetMinutes}`;
  const memoryUsage = process.memoryUsage();
  const githubLink = 'https://github.com/JuniorDark/RustyHearts-API';

  return {
    version: `Rusty Hearts API Version: ${APP_VERSION}`,
    github: `Github: ${githubLink}`,
    nodeVersion: `Node.js Version: ${nodeVersion}`,
    timezone: `Timezone: ${timezone} (${offsetString})`,
    memory: {
      rss: formatBytes(memoryUsage.rss),
      heapTotal: formatBytes(memoryUsage.heapTotal),
      heapUsed: formatBytes(memoryUsage.heapUsed),
      external: formatBytes(memoryUsage.external),
      arrayBuffers: formatBytes(memoryUsage.arrayBuffers)
    }
  };
}

function logSystemInfo() {
  const info = getSystemInfo();
  
  console.log('--------------------------------------------------');
  console.log(info.version);
  console.log(info.github);
  console.log(info.nodeVersion);
  console.log(info.timezone);
  console.log('Memory Usage:');
  console.log(`  RSS          : ${info.memory.rss}`);
  console.log(`  Heap Total   : ${info.memory.heapTotal}`);
  console.log(`  Heap Used    : ${info.memory.heapUsed}`);
  console.log(`  External     : ${info.memory.external}`);
  console.log(`  Array Buffers: ${info.memory.arrayBuffers}`);
  console.log('--------------------------------------------------');
}

export {
  getSystemInfo,
  logSystemInfo,
  formatBytes
};