import { NextRequest, NextResponse } from 'next/server'
import { getHistoricalData } from '@/lib/yahoo'
import { computeIndicators } from '@/lib/indicators'
import { buildScreenerRow, applyFilters } from '@/lib/screener'
import { DEFAULT_TICKERS, COMPANY_NAMES } from '@/lib/stockList'
import { cacheGet, cacheSet } from '@/lib/cache'
import { sanitizeTickers, sanitizeFilters } from '@/lib/validation'
import type { FilterCriteria, ScreenerRow, IndicatorValues } from '@/lib/types'

export const runtime = 'nodejs'
export const maxDuration = 60

// Raw per-ticker data we cache; filters are applied at query time
interface TickerSnapshot {
  price: number
  change: number
  changePercent: number
  ind: IndicatorValues
}

export async function POST(req: NextRequest) {
  try {
    // ── Parse + validate body ──────────────────────────────────────────────
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body', results: [] }, { status: 400 })
    }

    const obj = (body !== null && typeof body === 'object' ? body : {}) as Record<string, unknown>

    // Validate + sanitize filters (unknown values silently become 'any')
    const filters: FilterCriteria = sanitizeFilters(obj.filters)

    // Validate + deduplicate tickers; fall back to DEFAULT_TICKERS if none provided
    const rawTickers = Array.isArray(obj.tickers) ? obj.tickers : DEFAULT_TICKERS
    const tickers = sanitizeTickers(rawTickers, 50) // hard cap: 50 per batch

    if (tickers.length === 0) {
      return NextResponse.json({ results: [], scanned: 0 })
    }

    // ── Fetch all tickers in parallel; use per-ticker 10-min cache ─────────
    const settled = await Promise.allSettled(
      tickers.map(async (ticker): Promise<ScreenerRow | null> => {
        // Try screener cache first
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

        const row = buildScreenerRow(ticker, snapshot.price, snapshot.change, snapshot.changePercent, snapshot.ind)
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
    // Log full error server-side only; return a generic message to the client
    console.error('[screener] Unexpected error:', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'Screener failed', results: [] }, { status: 500 })
  }
}
