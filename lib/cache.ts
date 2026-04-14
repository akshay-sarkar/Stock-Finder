/**
 * Lightweight in-memory TTL cache for server-side route handlers.
 *
 * Lives at module scope, so it persists across requests on the same
 * warm Node.js instance (Vercel keeps functions warm for ~5–15 min).
 * This eliminates redundant Yahoo Finance calls during that window.
 *
 * TTL: 10 minutes (600 000 ms)
 */

const TTL_MS = 10 * 60 * 1000

interface Entry<T> {
  value: T
  expires: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const store = new Map<string, Entry<any>>()

/** Returns the cached value if present and not expired, otherwise null. */
export function cacheGet<T>(key: string): T | null {
  const entry = store.get(key)
  if (!entry) return null
  if (Date.now() > entry.expires) {
    store.delete(key)
    return null
  }
  return entry.value as T
}

/** Stores a value under the given key for TTL_MS milliseconds. */
export function cacheSet<T>(key: string, value: T): void {
  store.set(key, { value, expires: Date.now() + TTL_MS })
}

/** Removes a specific key (useful for forced refresh). */
export function cacheDel(key: string): void {
  store.delete(key)
}
