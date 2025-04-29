import rateLimitConfig from "../config/rateLimitConfig.js";
import { getClientIp } from "../utils/getClientIp.js";

async function rateLimiter(req, res, next) {
  try {
    const path = (req.baseUrl + req.path).replace(/\/+$/, "");
    const limiterKey = Array.from(rateLimitConfig.limiters.keys()).find((key) =>
      path.startsWith(key)
    );

    if (!limiterKey) {
      console.warn(`[RateLimiter] No limiter found for path: "${path}"`);
      return next();
    }

    const limiter = rateLimitConfig.getLimiter(limiterKey);

    const clientIP = getClientIp(req);
    const rateLimitRes = await limiter.consume(clientIP);

    res.set({
      "Retry-After": rateLimitRes.msBeforeNext / 1000,
      "X-RateLimit-Limit": limiter.points,
      "X-RateLimit-Remaining": rateLimitRes.remainingPoints,
      "X-RateLimit-Reset": new Date(Date.now() + rateLimitRes.msBeforeNext),
    });

    next();
  } catch (rateLimitRes) {
    res.set({
      "Retry-After": rateLimitRes.msBeforeNext / 1000,
    });

    return res.status(429).json({
      error: "Too many requests",
      message: `You've exceeded the rate limit. Please try again in ${Math.ceil(
        rateLimitRes.msBeforeNext / 1000
      )} seconds.`,
    });
  }
}

export default rateLimiter;
