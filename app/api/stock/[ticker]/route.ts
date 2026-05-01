import { NextRequest, NextResponse } from 'next/server'
import { getHistoricalData, getQuote, getQuoteSummary } from '@/lib/yahoo'
import { computeIndicators, computeIndicatorHistory } from '@/lib/indicators'
import { cacheGet, cacheSet } from '@/lib/cache'
import { isValidTicker, parseDays, parseInterval, parseDisplay } from '@/lib/validation'
import type { StockDetailData } from '@/lib/types'

export const runtime = 'nodejs'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  // ── Validate route param ────────────────────────────────────────────────
  const { ticker: rawTicker } = await params
  const ticker = (rawTicker ?? '').toUpperCase()
  if (!isValidTicker(ticker)) {
    return NextResponse.json({ error: 'Invalid ticker symbol' }, { status: 400 })
  }

  // ── Validate + clamp query params ───────────────────────────────────────
  const sp           = req.nextUrl.searchParams
  const fetchDays    = parseDays(sp.get('days'))          // 320–1830
  const interval     = parseInterval(sp.get('interval'))  // '1d' | '1wk' | '1mo'
  const displayPoints = parseDisplay(sp.get('display'))   // 10–1000

  // Cache key uses only validated/clamped values
  const cacheKey = `stock:${ticker}:${fetchDays}:${interval}:${displayPoints}`
  const cached = cacheGet<StockDetailData>(cacheKey)
  if (cached) {
    return NextResponse.json(cached)
  }

  try {
    const [data, quote, fundamentals] = await Promise.all([
      getHistoricalData(ticker, fetchDays, interval),
      getQuote(ticker),
      getQuoteSummary(ticker).catch(() => null),
    ])

    if (data.length < 35) {
      return NextResponse.json({ error: 'Not enough historical data' }, { status: 404 })
    }

    const ind = computeIndicators(data)
    if (!ind) {
      return NextResponse.json({ error: 'Could not compute indicators' }, { status: 500 })
    }

    const result: StockDetailData = {
      ticker,
      companyName:     quote.name,
      exchange:        quote.exchange,
      currentPrice:    quote.price,
      change:          quote.change,
      changePercent:   quote.changePercent,
      postMarketPrice: quote.postMarketPrice,
      postMarketChange: quote.postMarketChange,
      postMarketChangePercent: quote.postMarketChangePercent,
      chartData:       computeIndicatorHistory(data, displayPoints),
      latestIndicators: ind,
      fundamentals,
    }

    cacheSet(cacheKey, result)
    return NextResponse.json(result)
  } catch (err) {
    // Never forward raw error objects or stack traces to the client
    console.error(`[stock/${ticker}] Error:`, err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: `Failed to load data for ${ticker}` }, { status: 500 })
  }
}
