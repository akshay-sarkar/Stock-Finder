/**
 * GET /api/watchlist-prices
 *
 * Returns cached price snapshots for all default tickers — zero new Yahoo
 * Finance calls. Only tickers that already exist in the 10-min screener cache
 * are included; the rest are simply omitted. Used by the stock-detail sidebar
 * to show today's change % without any extra network cost.
 */
import { NextResponse } from 'next/server'
import { DEFAULT_TICKERS } from '@/lib/stockList'
import { cacheGet } from '@/lib/cache'

export const runtime = 'nodejs'

interface TickerSnapshot {
  price: number
  change: number
  changePercent: number
}

export type WatchlistPrices = Record<string, { price: number; changePercent: number }>

export async function GET() {
  const out: WatchlistPrices = {}

  for (const ticker of DEFAULT_TICKERS) {
    const snap = cacheGet<TickerSnapshot>(`screener:${ticker}`)
    if (snap) {
      out[ticker] = {
        price: snap.price,
        changePercent: snap.changePercent,
      }
    }
  }

  return NextResponse.json(out)
}
