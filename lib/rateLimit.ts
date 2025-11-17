// Simple in-memory rate limiter
// For production, consider using Redis-based solution like @upstash/ratelimit

type RateLimitStore = {
  count: number;
  resetTime: number;
};

const store = new Map<string, RateLimitStore>();

const cleanupInterval = 60 * 1000; // Clean up every minute

// Clean up expired entries
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of store.entries()) {
    if (value.resetTime < now) {
      store.delete(key);
    }
  }
}, cleanupInterval);

export type RateLimitOptions = {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
};

export function rateLimit(
  identifier: string,
  options: RateLimitOptions
): { success: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const key = identifier;
  const entry = store.get(key);

  if (!entry || entry.resetTime < now) {
    // Create new entry or reset expired one
    store.set(key, {
      count: 1,
      resetTime: now + options.windowMs,
    });
    return {
      success: true,
      remaining: options.maxRequests - 1,
      resetTime: now + options.windowMs,
    };
  }

  if (entry.count >= options.maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  entry.count++;
  return {
    success: true,
    remaining: options.maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

export function getClientIdentifier(
  ip: string | null,
  userAgent: string | null
): string {
  // Combine IP and User-Agent for better identification
  // In production, you might want to use a more sophisticated approach
  return `${ip || "unknown"}-${userAgent || "unknown"}`;
}
