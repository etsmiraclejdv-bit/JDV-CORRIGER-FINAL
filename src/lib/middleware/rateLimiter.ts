/**
 * Simple in-memory rate limiter for Next.js API routes.
 * Uses a sliding window per IP address.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    store.forEach((entry, key) => {
      if (entry.resetAt < now) store.delete(key);
    });
  }, 5 * 60 * 1000);
}

export interface RateLimitOptions {
  /** Max requests per window */
  limit: number;
  /** Window duration in milliseconds */
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions
): RateLimitResult {
  const now = Date.now();
  const key = identifier;
  const existing = store.get(key);

  if (!existing || existing.resetAt < now) {
    const entry: RateLimitEntry = { count: 1, resetAt: now + options.windowMs };
    store.set(key, entry);
    return { allowed: true, remaining: options.limit - 1, resetAt: entry.resetAt };
  }

  existing.count += 1;
  const allowed = existing.count <= options.limit;
  return {
    allowed,
    remaining: Math.max(0, options.limit - existing.count),
    resetAt: existing.resetAt,
  };
}

/**
 * Extract the real client IP from a Next.js request.
 */
export function getClientIp(req: { headers: { get: (key: string) => string | null } }): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  );
}
