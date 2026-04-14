import { NextRequest, NextResponse } from 'next/server'
import { getHistoricalData } from '@/lib/yahoo'
import { computeIndicators } from '@/lib/indicators'
import { buildScreenerRow, applyFilters } from '@/lib/screener'
import { DEFAULT_TICKERS, COMPANY_NAMES } from '@/lib/stockList'
import { cacheGet, cacheSet } from '@/lib/cache'
import type { FilterCriteria, ScreenerRow, IndicatorValues } from '@/lib/types'

export const runtime = 'nodejs'
export const maxDuration = 60

// Raw per-ticker data we cache (price/change/ind) — filters are applied at query time
interface TickerSnapshot {
  price: number
  change: number
  changePercent: number
  ind: IndicatorValues
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const filters: FilterCriteria = body.filters ?? {
      rsi: 'any',
      macd: 'any',
      movingAverage: 'any',
      volume: 'any',
    }
    const tickers: string[] = (body.tickers ?? DEFAULT_TICKERS)
      .map((t: string) => t.trim().toUpperCase())
      .filter(Boolean)
      .slice(0, 50) // hard cap per batch (client sends multiple batches for large watchlists)

    // Fetch all tickers in parallel — use per-ticker 10-min cache for raw snapshots
    const settled = await Promise.allSettled(
      tickers.map(async (ticker): Promise<ScreenerRow | null> => {
        // Try cache first
        const cached = cacheGet<TickerSnapshot>(`screener:${ticker}`)
        let snapshot: TickerSnapshot

        if (cached) {
          snapshot = cached
        } else {
          const data = await getHistoricalData(ticker, 320)
          if (data.length < 50) return null

          const ind = computeIndicators(data)
          if (!ind) return null

          const latest = data[data.length - 1]
          const prev   = data[data.length - 2]
          const price  = latest.close
          const change = prev ? price - prev.close : 0
          const changePercent = prev ? (change / prev.close) * 100 : 0

          snapshot = { price, change, changePercent, ind }
          cacheSet(`screener:${ticker}`, snapshot)
        }

        const row = buildScreenerRow(
          ticker,
          snapshot.price,
          snapshot.change,
          snapshot.changePercent,
          snapshot.ind,
        )
        // Attach company name
        row.companyName = COMPANY_NAMES[ticker] ?? ticker

        return applyFilters(row, filters) ? row : null
      })
    )

    const results: ScreenerRow[] = settled
      .filter((r): r is PromiseFulfilledResult<ScreenerRow | null> => r.status === 'fulfilled')
      .map((r) => r.value)
      .filter((r): r is ScreenerRow => r !== null)

    return NextResponse.json({ results, scanned: tickers.length })
  } catch (err) {
    console.error('[screener]', err)
    return NextResponse.json({ error: 'Screener failed', results: [] }, { status: 500 })
  }
}
