/**
 * Simple in-memory sliding-window rate limiter.
 * Tracks request timestamps per key (typically IP address).
 * Purges stale entries automatically to prevent unbounded growth.
 */

const windows = new Map<string, number[]>()

/** Returns true if the request is allowed, false if rate limit exceeded. */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): boolean {
  const now    = Date.now()
  const cutoff = now - windowMs

  const timestamps = (windows.get(key) ?? []).filter(t => t > cutoff)
  if (timestamps.length >= maxRequests) return false

  timestamps.push(now)
  windows.set(key, timestamps)
  return true
}
