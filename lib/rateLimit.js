// Reusable in-memory sliding window rate limiter.
// In production with multiple serverless instances, this can be swapped with Redis/Upstash
// without changing the caller interface.
import { recordApiMetric } from "./apiObservability";

const RATE_LIMITS = {
  login: { limit: 10, windowMs: 60 * 1000 },          // 10 attempts per minute
  register: { limit: 5, windowMs: 60 * 60 * 1000 },    // 5 registrations per hour
  contact: { limit: 10, windowMs: 60 * 60 * 1000 },    // 10 contact forms per hour
  demo: { limit: 10, windowMs: 60 * 60 * 1000 },       // 10 demo bookings per hour
  "market-analysis": { limit: 60, windowMs: 60 * 1000 }, // 60 market analyses per minute
  general: { limit: 120, windowMs: 60 * 1000 },        // 120 requests per minute
};

const globalForRateLimit = globalThis;
if (!globalForRateLimit.__rateLimitStore) {
  globalForRateLimit.__rateLimitStore = new Map();
}

const store = globalForRateLimit.__rateLimitStore;

// Periodically clean up stale records every 5 minutes
if (!globalForRateLimit.__rateLimitCleanupInterval) {
  globalForRateLimit.__rateLimitCleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, timestamps] of store.entries()) {
      const validTimestamps = timestamps.filter((t) => now - t < 60 * 60 * 1000);
      if (validTimestamps.length === 0) {
        store.delete(key);
      } else {
        store.set(key, validTimestamps);
      }
    }
  }, 5 * 60 * 1000);
  if (globalForRateLimit.__rateLimitCleanupInterval.unref) {
    globalForRateLimit.__rateLimitCleanupInterval.unref();
  }
}

/**
 * Extract client IP from Next.js request headers
 * @param {Request} request
 * @returns {string}
 */
export function getClientIp(request) {
  // Forwarded headers are only trustworthy when the deployment proxy is
  // explicitly configured as trusted; otherwise clients can spoof them.
  if (process.env.TRUST_PROXY !== "true") return "untrusted-client";
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") || "unknown-client";
}

/**
 * Check if an action is allowed for a given client identifier
 * @param {string} identifier - e.g. IP address or user ID
 * @param {string} action - e.g. 'login', 'market-analysis'
 * @returns {{ allowed: boolean, limit: number, remaining: number, retryAfter: number }}
 */
export function checkRateLimit(identifier, action = "general") {
  const config = RATE_LIMITS[action] || RATE_LIMITS.general;
  const key = `${action}:${identifier}`;
  const now = Date.now();
  const windowStart = now - config.windowMs;

  const currentHits = store.get(key) || [];
  const recentHits = currentHits.filter((t) => t > windowStart);

  if (recentHits.length >= config.limit) {
    const oldestInWindow = recentHits[0];
    const retryAfter = Math.ceil((oldestInWindow + config.windowMs - now) / 1000);
    return {
      allowed: false,
      limit: config.limit,
      remaining: 0,
      retryAfter: Math.max(1, retryAfter),
    };
  }

  recentHits.push(now);
  store.set(key, recentHits);

  return {
    allowed: true,
    limit: config.limit,
    remaining: config.limit - recentHits.length,
    retryAfter: 0,
  };
}

/**
 * Helper to apply rate limiting directly in Next.js Route Handlers.
 * Returns a 429 Response if rate limit is exceeded, or null if allowed.
 * @param {Request} request
 * @param {string} action
 * @param {string|null} customIdentifier
 * @returns {Response|null}
 */
export function rateLimitResponse(request, action = "general", customIdentifier = null) {
  if (process.env.DISABLE_RATE_LIMIT === "true" || process.env.NODE_ENV === "test") {
    return null;
  }
  const ip = customIdentifier || getClientIp(request);
  const result = checkRateLimit(ip, action);

  if (!result.allowed) {
    recordApiMetric({ status: 429, durationMs: 0, rateLimited: true });
    return Response.json(
      {
        error: `Too many requests for ${action}. Please try again in ${result.retryAfter} seconds.`,
        retryAfter: result.retryAfter,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(result.retryAfter),
          "X-RateLimit-Limit": String(result.limit),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  recordApiMetric({ status: 200, durationMs: 0 });

  return null;
}
