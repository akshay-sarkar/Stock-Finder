import { NextRequest, NextResponse } from 'next/server'
import { cacheGet, cacheSet } from '@/lib/cache'

export const runtime = 'nodejs'
export const revalidate = 900

interface MoverStock {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: number
}

interface WeekMoversResponse {
  weekGainers: MoverStock[]
  weekLosers: MoverStock[]
}

async function computeWeeklyMovers(): Promise<WeekMoversResponse> {
  try {
    // Popular tech stocks to compute weekly movers for
    const symbols = [
      'NVDA', 'MSFT', 'AAPL', 'GOOGL', 'TSLA', 'META', 'AMZN', 'NFLX', 'AVGO', 'ADBE',
      'IBM', 'XOM', 'CVX', 'JNJ', 'KO', 'PG', 'JPM', 'BAC', 'GE', 'F',
    ]

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const YahooFinanceClass = require('yahoo-finance2').default
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const yahooFinance: any = new YahooFinanceClass()

    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 5)

    const historicalResults = await Promise.allSettled(
      symbols.map(symbol =>
        yahooFinance.historical(symbol, {
          period1: startDate,
          period2: endDate,
          interval: '1d',
        }).catch(() => [])
      )
    )

    // Get current quotes for all symbols
    const quotes = await Promise.all(
      symbols.map(s => yahooFinance.quote(s).catch(() => null))
    )

    // Compute weekly changes
    const moversWithWeeklyChange = historicalResults
      .map((result, idx) => {
        if (result.status !== 'fulfilled' || !result.value?.length) return null

        const symbol = symbols[idx]
        const history = (result.value as any[])
          .filter(bar => bar.close != null)
          .sort((a, b) => a.date.getTime() - b.date.getTime())

        if (history.length < 2) return null

        const firstClose = history[0].close
        const lastClose = history[history.length - 1].close
        const weeklyChange = ((lastClose - firstClose) / firstClose) * 100

        // Get current quote for name + price
        const quote = quotes[idx]
        if (!quote || !quote.regularMarketPrice) return null

        return {
          symbol,
          name: quote.shortName || quote.longName || symbol,
          price: quote.regularMarketPrice,
          change: quote.regularMarketChange ?? 0,
          changePercent: weeklyChange,
          volume: quote.regularMarketVolume ?? 0,
        }
      })
      .filter((item): item is MoverStock => item != null)
      .sort((a, b) => b.changePercent - a.changePercent)

    const weekGainers = moversWithWeeklyChange.slice(0, 10)
    const weekLosers = moversWithWeeklyChange.slice(-10).reverse()

    return { weekGainers, weekLosers }
  } catch (err) {
    console.error('[market-movers/week]', err instanceof Error ? err.message : String(err))
    return { weekGainers: [], weekLosers: [] }
  }
}

export async function GET(_req: NextRequest): Promise<NextResponse> {
  const cacheKey = 'market-movers:week'
  const cached = cacheGet<WeekMoversResponse>(cacheKey)
  if (cached) return NextResponse.json(cached)

  const response = await computeWeeklyMovers()
  cacheSet(cacheKey, response, 900_000)

  return NextResponse.json(response, {
    headers: { 'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800' },
  })
}
