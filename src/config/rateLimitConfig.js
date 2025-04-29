import { RateLimiterMemory } from 'rate-limiter-flexible';
import { api } from '../../config/rateLimits.default.js';

class RateLimitConfig {
  constructor() {
    this.limiters = new Map();
    this.loadConfig();
  }

  loadConfig() {
    // API Limiters for /launcher
    for (const [endpoint, config] of Object.entries(api.launcher)) {
      this.limiters.set(
        `/launcher/${endpoint.charAt(0).toUpperCase()}${endpoint.slice(1)}`,
        new RateLimiterMemory({
          points: config.points,
          duration: config.duration,
          blockDuration: config.blockDuration
        })
      );
    }

    // API Limiters for /launcherAction
    for (const [endpoint, config] of Object.entries(api.launcherAction)) {
      this.limiters.set(
        `/launcherAction/${endpoint}`,
        new RateLimiterMemory({
          points: config.points,
          duration: config.duration,
          blockDuration: config.blockDuration
        })
      );
    }
  }

  getLimiter(path) {
    return this.limiters.get(path);
  }
}

export default new RateLimitConfig();
