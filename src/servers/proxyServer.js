import { createServer } from 'net';
import { request } from 'http';
import config from '../config.js';

const { ports, ips, logger, BACKENDS } = config;

const parseRequest = (data) => {
  const lines = data.split('\r\n');
  let realPath = '/';
  let isMalformed = false;

  if (lines.some(line => line.startsWith('POST /') && line.includes('HTTP/1.1Content-Type:'))) {
    isMalformed = true;
    for (const line of lines) {
      if (line.startsWith('POST /') && line.includes('HTTP/1.1Content-Type:')) {
        const match = line.match(/POST (\/[^ ]*) HTTP\/1\.1/);
        if (match) realPath = match[1];
        break;
      }
    }
  } else {
    const requestLine = lines[0];
    const match = requestLine.match(/^(POST|GET) (\/(?:[^ ]*)) HTTP\/1\.1$/i);
    if (match) realPath = match[2];
  }

  if (realPath.startsWith('/cgi-bin/')) {
    realPath = '/Auth' + realPath;
  } else if (realPath.startsWith('/S1/')) {
    realPath = '/Billing' + realPath;
  }

  return { realPath, isMalformed, lines };
};

const findBackend = (realPath) => {
  if (BACKENDS.AUTH.paths.includes(realPath)) {
    return { ...BACKENDS.AUTH, port: ports.jpnApp };
  } else if (BACKENDS.BILLING.paths.some(path => realPath.startsWith(path))) {
    return { ...BACKENDS.BILLING, port: ports.jpnApp };
  } else {
    return null;
  }
};

const buildHeaders = (lines, body, backend, isMalformed) => {
  const headers = {
    'Host': `${ips.local}:${backend.port}`,
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(body),
    'User-Agent': 'Mozilla/4.0 (ISAO/1.00;Auth)',
  };

  if (!isMalformed) {
    const headerLines = lines.slice(1, lines.indexOf(''));
    for (const line of headerLines) {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex).trim().toLowerCase();
        const value = line.substring(colonIndex + 1).trim();
        if (['content-type', 'user-agent', 'content-length'].includes(key)) {
          headers[key] = value;
        }
      }
    }
  }

  return headers;
};

const handleProxyRequest = (socket, data) => {
  try {
    const { realPath, isMalformed, lines } = parseRequest(data);

    const backend = findBackend(realPath);
    if (!backend) {
      logger.error('[Proxy] Unknown path:', realPath);
      socket.end('HTTP/1.1 404 Not Found\r\n\r\n');
      return;
    }

    const body = data.split('\r\n\r\n')[1] || '';
    const headers = buildHeaders(lines, body, backend, isMalformed);

    const options = {
      hostname: ips.local,
      port: backend.port,
      path: realPath,
      method: 'POST',
      headers,
    };

    const proxyReq = request(options, (proxyRes) => {
      socket.write(`HTTP/1.1 ${proxyRes.statusCode} ${proxyRes.statusMessage}\r\n`);
      Object.entries(proxyRes.headers).forEach(([key, value]) => {
        socket.write(`${key}: ${value}\r\n`);
      });
      socket.write('\r\n');
      proxyRes.pipe(socket);
    });

    proxyReq.on('error', (err) => {
      logger.error('[Proxy] Proxy error:', err);
      socket.end('HTTP/1.1 500 Internal Server Error\r\n\r\n');
    });

    proxyReq.write(body);
    proxyReq.end();
    
  } catch (err) {
    logger.error('[Proxy] Error parsing request:', err);
    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
  }
};

const createProxyServer = () => {
  const server = createServer((socket) => {
    let data = '';

    socket.on('data', (chunk) => {
      data += chunk.toString('binary');

      if (data.includes('\r\n\r\n')) {
        handleProxyRequest(socket, data);
      }
    });

    socket.on('error', (err) => {
      logger.error('[Proxy] Socket error:', err);
    });

    socket.on('timeout', () => {
      logger.warn('[Proxy] Socket timeout.');
      socket.end();
    });
  });

  return server;
};

const startServer = () => {
  const server = createProxyServer();
  return server.listen(ports.proxy, ips.local, () => {
    logger.info(`Proxy (JPN) listening on ${ips.local}:${ports.proxy}`);
    console.log('Configured backends:');
    console.log(`- AUTH (${ports.jpnApp}):`, BACKENDS.AUTH.paths);
    console.log(`- BILLING (${ports.jpnApp}):`, BACKENDS.BILLING.paths);
  });
};

export { createProxyServer, startServer };
