/**
 * Lightweight endpoint that reads price/change data from the existing
 * screener cache. No new Yahoo Finance fetches — purely opportunistic.
 * Tickers not yet in the cache are silently omitted from the response.
 */
import { NextRequest, NextResponse } from 'next/server'
import { cacheGet } from '@/lib/cache'
import { sanitizeTickers } from '@/lib/validation'

export const runtime = 'nodejs'

interface ScreenerSnapshot {
  price: number
  change: number
  changePercent: number
}

export async function POST(req: NextRequest) {
  // ── Parse + validate body ───────────────────────────────────────────────
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const obj = (body !== null && typeof body === 'object' ? body : {}) as Record<string, unknown>

  // Validate + deduplicate; cap at 200 (full watchlist)
  const tickers = sanitizeTickers(obj.tickers, 200)

  // ── Read from screener cache (no Yahoo Finance calls) ───────────────────
  const prices: Record<string, { price: number; changePercent: number }> = {}

  for (const ticker of tickers) {
    const cached = cacheGet<ScreenerSnapshot>(`screener:${ticker}`)
    if (cached) {
      prices[ticker] = { price: cached.price, changePercent: cached.changePercent }
    }
  }

  return NextResponse.json({ prices })
}
