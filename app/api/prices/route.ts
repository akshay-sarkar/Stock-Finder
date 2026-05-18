/**
 * Lightweight endpoint that returns price + change% for a list of tickers.
 *
 * Strategy (two-tier):
 *   1. Check the in-memory screener cache — instant, no network cost.
 *   2. For cache-cold tickers, fetch live quotes from Yahoo Finance (batch).
 *
 * Used by the stock detail page sidebar so it always has data even on a
 * fresh page load or after a server restart.
 */
import { NextRequest, NextResponse } from 'next/server'
import { cacheGet, cacheSet } from '@/lib/cache'
import { sanitizeTickers } from '@/lib/validation'
import { yf } from '@/lib/yahoo'

export const runtime = 'nodejs'
export const maxDuration = 30

interface PriceEntry { price: number; changePercent: number }

interface ScreenerSnapshot {
  price: number
  change: number
  changePercent: number
}

async function fetchLiveQuotes(tickers: string[]): Promise<Record<string, PriceEntry>> {
  if (tickers.length === 0) return {}

  const result: Record<string, PriceEntry> = {}

  // Concurrency-limited fetch — prevents rate-limiting Yahoo Finance
  // when many tickers are cold-cache (e.g. after a server restart).
  const CONCURRENCY = 20
  let idx = 0
  async function worker() {
    while (idx < tickers.length) {
      const ticker = tickers[idx++]
      try {
        const q = await yf.quote(ticker, {}, { validateResult: false })
        const price         = q?.regularMarketPrice         ?? null
        const changePercent = q?.regularMarketChangePercent ?? null
        if (price != null && changePercent != null) {
          result[ticker] = { price, changePercent }
          // Write to quote: key — keeps thin shape separate from screener: (rich shape)
          if (!cacheGet<ScreenerSnapshot>(`quote:${ticker}`)) {
            cacheSet<ScreenerSnapshot>(`quote:${ticker}`, {
              price,
              change: q?.regularMarketChange ?? 0,
              changePercent,
            })
          }
        }
      } catch (err) {
        console.error(`[prices] quote error for ${ticker}:`, err instanceof Error ? err.message : String(err))
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, tickers.length) }, worker))

  return result
}


export async function POST(req: NextRequest) {
  // ── Parse + validate body ─────────────────────────────────────────────────
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const obj = (body !== null && typeof body === 'object' ? body : {}) as Record<string, unknown>

  // Validate + deduplicate; cap at 400 (full watchlist is ~375 tickers)
  const tickers = sanitizeTickers(obj.tickers, 400)

  // ── Tier 1: read from screener cache ──────────────────────────────────────
  const prices: Record<string, PriceEntry> = {}
  const coldTickers: string[] = []

  for (const ticker of tickers) {
    // screener: has rich shape (price+ind+fundamentals); quote: has thin shape — both have price/changePercent
    const cached = cacheGet<ScreenerSnapshot>(`screener:${ticker}`) ?? cacheGet<ScreenerSnapshot>(`quote:${ticker}`)
    if (cached) {
      prices[ticker] = { price: cached.price, changePercent: cached.changePercent }
    } else {
      coldTickers.push(ticker)
    }
  }

  // ── Tier 2: live fetch for cold-cache tickers ─────────────────────────────
  if (coldTickers.length > 0) {
    const live = await fetchLiveQuotes(coldTickers)
    Object.assign(prices, live)
  }

  return NextResponse.json({ prices })
}
