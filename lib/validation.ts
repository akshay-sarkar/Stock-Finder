/**
 * Shared input-validation utilities used by both API routes and client code.
 * Keep this file free of heavy dependencies — it's imported server-side in
 * every API route, so startup cost matters.
 */

// ─── Ticker ───────────────────────────────────────────────────────────────────
/**
 * Valid ticker symbols: 1–8 uppercase alphanumeric characters,
 * optionally containing a single dot or hyphen (e.g. BRK-B, BF.B, ASML.AS).
 * Rejects anything outside this set before it reaches Yahoo Finance or the cache.
 */
const TICKER_RE = /^[A-Z0-9]{1,8}([.\-][A-Z0-9]{1,4})?$/

export function isValidTicker(t: unknown): t is string {
  return typeof t === 'string' && TICKER_RE.test(t)
}

/**
 * Sanitise an array of raw ticker values:
 * - trim + uppercase each element
 * - keep only entries that pass isValidTicker
 * - deduplicate
 * - cap at maxLen (default 50 — one API batch)
 */
export function sanitizeTickers(raw: unknown, maxLen = 50): string[] {
  if (!Array.isArray(raw)) return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const item of raw) {
    if (out.length >= maxLen) break
    const t = (typeof item === 'string' ? item.trim().toUpperCase() : '')
    if (isValidTicker(t) && !seen.has(t)) {
      seen.add(t)
      out.push(t)
    }
  }
  return out
}

// ─── Filter criteria ──────────────────────────────────────────────────────────
const VALID_RSI        = ['any', 'oversold', 'overbought', 'neutral'] as const
const VALID_MACD       = ['any', 'bullish_crossover', 'bearish_crossover', 'above_signal', 'below_signal'] as const
const VALID_MA         = ['any', 'above_sma50', 'below_sma50', 'golden_cross', 'death_cross', 'price_above_sma200', 'price_below_sma200'] as const
const VALID_VOLUME     = ['any', 'spike', 'low', 'normal'] as const

type RSIFilter    = typeof VALID_RSI[number]
type MACDFilter   = typeof VALID_MACD[number]
type MAFilter     = typeof VALID_MA[number]
type VolumeFilter = typeof VALID_VOLUME[number]

import type { FilterCriteria } from './types'

/**
 * Validates and coerces a raw filter object from a POST body.
 * Unknown or missing fields fall back to 'any' so a partial request body
 * still works correctly rather than throwing.
 */
export function sanitizeFilters(raw: unknown): FilterCriteria {
  const obj = (raw !== null && typeof raw === 'object' ? raw : {}) as Record<string, unknown>

  const rsi    = VALID_RSI.includes(obj.rsi    as RSIFilter)    ? (obj.rsi    as RSIFilter)    : 'any'
  const macd   = VALID_MACD.includes(obj.macd  as MACDFilter)   ? (obj.macd   as MACDFilter)   : 'any'
  const movingAverage = VALID_MA.includes(obj.movingAverage as MAFilter) ? (obj.movingAverage as MAFilter) : 'any'
  const volume = VALID_VOLUME.includes(obj.volume as VolumeFilter) ? (obj.volume as VolumeFilter) : 'any'

  return { rsi, macd, movingAverage, volume }
}

// ─── Query params ─────────────────────────────────────────────────────────────
const VALID_INTERVALS = new Set(['1d', '1wk', '1mo'])

/**
 * Parse and clamp the `days` query parameter.
 * Default 380, min 320 (need enough history for SMA200), max 1 830 (5Y daily).
 */
export function parseDays(raw: string | null, defaultVal = 380): number {
  const n = parseInt(raw ?? '', 10)
  if (isNaN(n)) return defaultVal
  return Math.min(Math.max(n, 320), 1830)
}

/**
 * Validate the `interval` query parameter against an explicit allowlist.
 * Falls back to '1d' for anything unrecognised.
 */
export function parseInterval(raw: string | null): '1d' | '1wk' | '1mo' {
  return VALID_INTERVALS.has(raw ?? '') ? (raw as '1d' | '1wk' | '1mo') : '1d'
}

/**
 * Parse and clamp the `display` (displayPoints) query parameter.
 * Default 252, min 10, max 1 000.
 */
export function parseDisplay(raw: string | null, defaultVal = 252): number {
  const n = parseInt(raw ?? '', 10)
  if (isNaN(n)) return defaultVal
  return Math.min(Math.max(n, 10), 1000)
}
