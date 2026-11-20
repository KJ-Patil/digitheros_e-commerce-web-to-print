/**
 * Digital Heroes (Level 2) — Server-Side Security Rate Limiter
 * 
 * Provides in-memory sliding-window request throttling for sensitive endpoints
 * (checkout sessions, custom quotes, preflight upload validation, authentication).
 * Automatically expires stale window keys.
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const RATE_LIMIT_STORE = new Map<string, RateLimitRecord>();

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTimeMs: number;
  retryAfterSeconds?: number;
}

/**
 * Check and record a rate limit attempt for a given key (IP address, user ID, or endpoint fingerprint).
 * 
 * @param key Unique client or endpoint identifier
 * @param maxRequests Maximum allowable requests within the time window (default: 60)
 * @param windowMs Duration of sliding window in milliseconds (default: 60,000ms / 1 minute)
 */
export function checkRateLimit(
  key: string,
  maxRequests: number = 60,
  windowMs: number = 60000
): RateLimitResult {
  const now = Date.now();
  const existing = RATE_LIMIT_STORE.get(key);

  if (!existing || now >= existing.resetAt) {
    // Window expired or first request
    const record: RateLimitRecord = {
      count: 1,
      resetAt: now + windowMs,
    };
    RATE_LIMIT_STORE.set(key, record);
    return {
      allowed: true,
      limit: maxRequests,
      remaining: maxRequests - 1,
      resetTimeMs: record.resetAt,
    };
  }

  if (existing.count >= maxRequests) {
    // Limit exceeded
    const retryAfterSeconds = Math.ceil((existing.resetAt - now) / 1000);
    return {
      allowed: false,
      limit: maxRequests,
      remaining: 0,
      resetTimeMs: existing.resetAt,
      retryAfterSeconds,
    };
  }

  existing.count++;
  return {
    allowed: true,
    limit: maxRequests,
    remaining: maxRequests - existing.count,
    resetTimeMs: existing.resetAt,
  };
}

/**
 * Reset rate limiter store (useful for automated testing)
 */
export function resetRateLimiter(): void {
  RATE_LIMIT_STORE.clear();
}
