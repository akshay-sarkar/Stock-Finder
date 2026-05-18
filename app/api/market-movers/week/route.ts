import { NextRequest, NextResponse } from 'next/server'
import { cacheGet, cacheSet } from '@/lib/cache'
import { yf } from '@/lib/yahoo'
import { DEFAULT_TICKERS } from '@/lib/stockList'

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

// Representative cross-sector sample — large enough for meaningful movers, small enough to be fast
const SYMBOLS = DEFAULT_TICKERS.slice(0, 60)
const CONCURRENCY = 10

async function computeWeeklyMovers(): Promise<WeekMoversResponse> {
  try {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 7)

    // Pass 1: chart() for weekly price change — concurrency-capped to avoid Yahoo throttle
    const weeklyChange = new Map<string, number>()
    let chartIdx = 0
    async function chartWorker() {
      while (chartIdx < SYMBOLS.length) {
        const symbol = SYMBOLS[chartIdx++]
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const result: any = await yf.chart(symbol, { period1: startDate, period2: endDate, interval: '1d' })
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const bars = (result.quotes ?? []).filter((b: any) => b.close != null)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
          if (bars.length >= 2) {
            weeklyChange.set(symbol, ((bars.at(-1).close - bars[0].close) / bars[0].close) * 100)
          }
        } catch { /* skip failed tickers */ }
      }
    }
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, SYMBOLS.length) }, chartWorker))

    const symbolsWithData = [...weeklyChange.keys()]
    if (symbolsWithData.length === 0) return { weekGainers: [], weekLosers: [] }

    // Pass 2: one batched quote call for name + current price
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawQuotes: any[] = await yf.quote(symbolsWithData).catch(() => [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const quoteMap = new Map<string, any>(rawQuotes.map((q: any) => [q.symbol, q]))

    const movers: MoverStock[] = symbolsWithData
      .filter(s => quoteMap.get(s)?.regularMarketPrice != null)
      .map(s => {
        const q = quoteMap.get(s)
        return {
          symbol: s,
          name: q.shortName || q.longName || s,
          price: q.regularMarketPrice,
          change: q.regularMarketChange ?? 0,
          changePercent: weeklyChange.get(s)!,
          volume: q.regularMarketVolume ?? 0,
        }
      })
      .sort((a, b) => b.changePercent - a.changePercent)

    return {
      weekGainers: movers.slice(0, 10),
      weekLosers: [...movers].reverse().slice(0, 10),
    }
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
