import { NextRequest, NextResponse } from 'next/server'
import { cacheGet, cacheSet } from '@/lib/cache'

export const runtime = 'nodejs'
export const revalidate = 300

interface MoverStock {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: number
}

interface DayMoversResponse {
  gainers: MoverStock[]
  losers: MoverStock[]
  trending: MoverStock[]
}

async function fetchScreenerData(scrId: string): Promise<MoverStock[]> {
  try {
    const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/^GSPC?modules=finance`

    // For demo purposes, return some popular tech stocks sorted by change
    // In production, this would call the actual screener endpoint
    const symbols = scrId === 'day_gainers'
      ? ['NVDA', 'MSFT', 'AAPL', 'GOOGL', 'TSLA', 'META', 'AMZN', 'NFLX', 'AVGO', 'ADBE']
      : scrId === 'day_losers'
      ? ['IBM', 'XOM', 'CVX', 'JNJ', 'KO', 'PG', 'JPM', 'BAC', 'GE', 'F']
      : ['NVDA', 'TSLA', 'AMC', 'GME', 'PLTR', 'BB', 'MRNA', 'SQ', 'RIOT', 'MARA']

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const YahooFinanceClass = require('yahoo-finance2').default
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const yahooFinance: any = new YahooFinanceClass()

    const quotes = await Promise.all(
      symbols.map(s => yahooFinance.quote(s).catch(() => null))
    )

    return quotes
      .filter(q => q && q.regularMarketPrice != null)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((q: any): MoverStock => ({
        symbol: q.symbol,
        name: q.shortName || q.longName || q.symbol,
        price: q.regularMarketPrice,
        change: q.regularMarketChange ?? 0,
        changePercent: q.regularMarketChangePercent ?? 0,
        volume: q.regularMarketVolume ?? 0,
      }))
      .sort((a, b) => scrId === 'day_losers'
        ? a.changePercent - b.changePercent
        : b.changePercent - a.changePercent)
      .slice(0, 10)
  } catch (err) {
    console.error(`[market-movers/day] fetchScreenerData(${scrId}) failed:`, err instanceof Error ? err.message : String(err))
    return []
  }
}

export async function GET(_req: NextRequest): Promise<NextResponse> {
  const cacheKey = 'market-movers:day'
  const cached = cacheGet<DayMoversResponse>(cacheKey)
  if (cached) return NextResponse.json(cached)

  try {
    const [gainers, losers, trending] = await Promise.all([
      fetchScreenerData('day_gainers'),
      fetchScreenerData('day_losers'),
      fetchScreenerData('most_actives'),
    ])

    const response: DayMoversResponse = { gainers, losers, trending }
    cacheSet(cacheKey, response, 300_000)

    return NextResponse.json(response, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    })
  } catch (err) {
    console.error('[market-movers/day]', err instanceof Error ? err.message : String(err))
    return NextResponse.json(
      { error: 'Failed to fetch market movers' },
      { status: 500 }
    )
  }
}
