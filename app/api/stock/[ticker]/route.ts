import { NextRequest, NextResponse } from 'next/server'
import { getHistoricalData, getQuote, getQuoteSummary } from '@/lib/yahoo'
import { computeIndicators, computeIndicatorHistory } from '@/lib/indicators'
import { cacheGet, cacheSet } from '@/lib/cache'
import type { StockDetailData } from '@/lib/types'

export const runtime = 'nodejs'

export async function GET(
  req: NextRequest,
  { params }: { params: { ticker: string } }
) {
  const ticker = params.ticker.toUpperCase()

  // Range params — always fetch ≥320 days so SMA(200) is accurate
  const rawDays       = parseInt(req.nextUrl.searchParams.get('days')     ?? '380')
  const fetchDays     = Math.max(rawDays, 320)
  const interval      = (req.nextUrl.searchParams.get('interval') ?? '1d') as '1d' | '1wk'
  const displayPoints = parseInt(req.nextUrl.searchParams.get('display') ?? '252')

  // Cache key encodes all params so different ranges are cached separately
  const cacheKey = `stock:${ticker}:${fetchDays}:${interval}:${displayPoints}`
  const cached = cacheGet<StockDetailData>(cacheKey)
  if (cached) {
    return NextResponse.json(cached)
  }

  try {
    // All three fetches run in parallel — fundamentals failure never breaks the page
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

    const chartData = computeIndicatorHistory(data, displayPoints)

    const result: StockDetailData = {
      ticker,
      companyName:    quote.name,
      currentPrice:   quote.price,
      change:         quote.change,
      changePercent:  quote.changePercent,
      chartData,
      latestIndicators: ind,
      fundamentals,     // null for ETFs / tickers with missing data
    }

    cacheSet(cacheKey, result)
    return NextResponse.json(result)
  } catch (err) {
    console.error(`[stock/${ticker}]`, err)
    return NextResponse.json({ error: `Failed to load data for ${ticker}` }, { status: 500 })
  }
}
