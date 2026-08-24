/**
 * Rate Limiting Middleware (Phase 25)
 * In-memory sliding window rate limiter to protect sensitive agent, payment and auth endpoints.
 */

const buckets = new Map();

/**
 * Factory for creating rate limiters
 * @param {Object} options
 * @param {number} options.windowMs - Window size in milliseconds
 * @param {number} options.maxRequests - Max requests per window
 * @param {string} options.message - Error message
 */
function createRateLimiter({ windowMs = 60000, maxRequests = 30, message = 'Too many requests, please try again later.' }) {
  return (req, res, next) => {
    const key = req.ip || req.headers['x-forwarded-for'] || 'global';
    const now = Date.now();

    if (!buckets.has(key)) {
      buckets.set(key, []);
    }

    const timestamps = buckets.get(key).filter(ts => now - ts < windowMs);
    timestamps.push(now);
    buckets.set(key, timestamps);

    if (timestamps.length > maxRequests) {
      return res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message,
          retryAfterMs: windowMs - (now - timestamps[0])
        }
      });
    }

    next();
  };
}

const purchaseRateLimiter = createRateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 20,
  message: 'Purchase request rate limit exceeded. Please wait before issuing new buying instructions.'
});

const authRateLimiter = createRateLimiter({
  windowMs: 60000,
  maxRequests: 15,
  message: 'Too many authentication attempts. Please wait 1 minute.'
});

module.exports = {
  createRateLimiter,
  purchaseRateLimiter,
  authRateLimiter
};
