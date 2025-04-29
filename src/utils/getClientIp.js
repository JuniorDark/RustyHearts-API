import config from "../config.js";
const { apiConfig } = config;

export function getClientIp(req) {
  let ip;

  if (apiConfig.trustProxyEnabled) {
    const forwarded = req.headers["x-forwarded-for"];
    if (forwarded) {
      // Grab the first IP from x-forwarded-for list
      ip = forwarded.split(",")[0].trim();
    }
  }

  // Fallback to connection-based IP
  if (!ip) {
    ip = req.socket?.remoteAddress || req.connection?.remoteAddress || null;
  }

  // Optional fallback (only if explicitly included in body)
  if (!ip && req.body?.ip) {
    ip = req.body.ip;
  }

  // Normalize IPv6 localhost
  if (ip === "::1" || ip === "0:0:0:0:0:0:0:1") {
    ip = "127.0.0.1";
  }

  // Remove IPv6 prefix if needed (e.g. "::ffff:192.168.0.1")
  if (ip && ip.startsWith("::ffff:")) {
    ip = ip.substring(7);
  }

  return ip;
}
