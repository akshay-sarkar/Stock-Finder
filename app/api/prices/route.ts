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

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const yf = new (require('yahoo-finance2').default)()

  const result: Record<string, PriceEntry> = {}

  // Fetch quotes in parallel (sidebar tickers are a small set, ~20-154)
  const settled = await Promise.allSettled(
    tickers.map(async (ticker) => {
      const q = await yf.quote(ticker, {}, { validateResult: false })
      const price         = q?.regularMarketPrice         ?? null
      const changePercent = q?.regularMarketChangePercent ?? null
      if (price == null || changePercent == null) return

      const entry: PriceEntry = { price, changePercent }
      result[ticker] = entry

      // Populate screener cache so subsequent reads are instant
      const existing = cacheGet<ScreenerSnapshot>(`screener:${ticker}`)
      if (!existing) {
        cacheSet<ScreenerSnapshot>(`screener:${ticker}`, {
          price,
          change: q?.regularMarketChange ?? 0,
          changePercent,
        })
      }
    })
  )

  // Log any individual failures without leaking details to the client
  settled.forEach((s, i) => {
    if (s.status === 'rejected') {
      console.error(`[prices] quote failed for ${tickers[i]}:`, s.reason?.message ?? s.reason)
    }
  })

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

  // Validate + deduplicate; cap at 200 (full watchlist)
  const tickers = sanitizeTickers(obj.tickers, 200)

  // ── Tier 1: read from screener cache ──────────────────────────────────────
  const prices: Record<string, PriceEntry> = {}
  const coldTickers: string[] = []

  for (const ticker of tickers) {
    const cached = cacheGet<ScreenerSnapshot>(`screener:${ticker}`)
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
