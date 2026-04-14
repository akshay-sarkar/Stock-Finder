/**
 * Lightweight endpoint that reads price/change data from the existing
 * screener cache. No new Yahoo Finance fetches — purely opportunistic.
 * If a ticker hasn't been scanned yet it is simply omitted from the response.
 */
import { NextRequest, NextResponse } from 'next/server'
import { cacheGet } from '@/lib/cache'

export const runtime = 'nodejs'

interface ScreenerSnapshot {
  price: number
  change: number
  changePercent: number
}

export async function POST(req: NextRequest) {
  const { tickers } = await req.json()

  const prices: Record<string, { price: number; changePercent: number }> = {}

  for (const ticker of (tickers as string[])) {
    const cached = cacheGet<ScreenerSnapshot>(`screener:${ticker}`)
    if (cached) {
      prices[ticker] = {
        price: cached.price,
        changePercent: cached.changePercent,
      }
    }
  }

  return NextResponse.json({ prices })
}
