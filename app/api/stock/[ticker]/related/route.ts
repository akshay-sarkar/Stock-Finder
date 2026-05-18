import { NextRequest, NextResponse } from 'next/server'
import { cacheGet, cacheSet } from '@/lib/cache'
import { isValidTicker } from '@/lib/validation'
import { yf } from '@/lib/yahoo'

export const runtime = 'nodejs'
export const revalidate = 3600

export interface RelatedStock {
  symbol: string
  name: string
  price: number | null
  changePercent: number | null
  fiftyTwoWeekLow: number | null
  fiftyTwoWeekHigh: number | null
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker: rawTicker } = await params
  const ticker = (rawTicker ?? '').toUpperCase()

  if (!isValidTicker(ticker)) {
    return NextResponse.json({ error: 'Invalid ticker symbol' }, { status: 400 })
  }

  const cacheKey = `related:${ticker}`
  const cached = cacheGet<RelatedStock[]>(cacheKey)
  if (cached) {
    return NextResponse.json(cached)
  }

  try {
    const result: any = await yf.recommendationsBySymbol(ticker, {}, { validateResult: false })
    const symbols: string[] = (result?.recommendedSymbols ?? [])
      .slice(0, 8)
      .map((r: any) => r.symbol as string)
      .filter((s: string) => s && isValidTicker(s))

    if (symbols.length === 0) {
      cacheSet(cacheKey, [])
      return NextResponse.json([])
    }

    const quotes = await Promise.allSettled(
      symbols.map(async (sym) => {
        const [quote, summary] = await Promise.all([
          yf.quote(sym),
          yf.quoteSummary(sym, { modules: ['summaryDetail'] }, { validateResult: false }).catch(() => null),
        ])
        return {
          symbol: sym,
          name: quote.longName ?? quote.shortName ?? sym,
          price: quote.regularMarketPrice ?? null,
          changePercent: quote.regularMarketChangePercent ?? null,
          fiftyTwoWeekLow: summary?.summaryDetail?.fiftyTwoWeekLow ?? null,
          fiftyTwoWeekHigh: summary?.summaryDetail?.fiftyTwoWeekHigh ?? null,
        }
      })
    )

    const related: RelatedStock[] = quotes
      .filter((r): r is PromiseFulfilledResult<RelatedStock> => r.status === 'fulfilled')
      .map(r => r.value)

    cacheSet(cacheKey, related, 3_600_000)
    return NextResponse.json(related, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
    })
  } catch (err) {
    console.error(`[related/${ticker}]`, err instanceof Error ? err.message : String(err))
    return NextResponse.json([], { status: 200 })
  }
}
