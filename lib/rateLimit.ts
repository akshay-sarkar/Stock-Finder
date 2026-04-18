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

// ─── Daily budget counter (resets at midnight UTC) ────────────────────────────
interface DailyBucket { count: number; resetAt: number }
const dailyBuckets = new Map<string, DailyBucket>()

function midnightUTC(): number {
  const d = new Date()
  d.setUTCHours(24, 0, 0, 0)
  return d.getTime()
}

/**
 * Increments the daily counter for `key` and returns whether the request
 * is within the allowed daily budget. Does NOT consume a count if over limit.
 */
export function checkDailyLimit(
  key: string,
  maxPerDay: number,
): { allowed: boolean; used: number; remaining: number; resetAt: number } {
  const now    = Date.now()
  const bucket = dailyBuckets.get(key)

  // Reset if bucket is missing or past midnight
  const active: DailyBucket =
    bucket && now < bucket.resetAt ? bucket : { count: 0, resetAt: midnightUTC() }

  if (active.count >= maxPerDay) {
    return { allowed: false, used: active.count, remaining: 0, resetAt: active.resetAt }
  }

  active.count++
  dailyBuckets.set(key, active)
  return {
    allowed:   true,
    used:      active.count,
    remaining: maxPerDay - active.count,
    resetAt:   active.resetAt,
  }
}
