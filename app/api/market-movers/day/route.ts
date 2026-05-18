import { NextRequest, NextResponse } from 'next/server'
import { cacheGet, cacheSet } from '@/lib/cache'
import { yf } from '@/lib/yahoo'

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapQuote(q: any): MoverStock {
  return {
    symbol: q.symbol,
    name: q.shortName || q.longName || q.symbol,
    price: q.regularMarketPrice ?? 0,
    change: q.regularMarketChange ?? 0,
    changePercent: q.regularMarketChangePercent ?? 0,
    volume: q.regularMarketVolume ?? 0,
  }
}

async function fetchScreenerData(strategy: string): Promise<MoverStock[]> {
  try {
    const res = await yf.screener(strategy, { count: 25 }, { validateResult: false })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (res?.quotes ?? []).filter((q: any) => q.regularMarketPrice != null).map(mapQuote).slice(0, 10)
  } catch (err) {
    console.error(`[market-movers/day] screener(${strategy}) failed:`, err instanceof Error ? err.message : String(err))
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
    return NextResponse.json({ error: 'Failed to fetch market movers' }, { status: 500 })
  }
}
