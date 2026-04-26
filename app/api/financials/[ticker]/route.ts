import { NextResponse } from 'next/server'
import { isValidTicker } from '@/lib/validation'
import { cacheGet, cacheSet } from '@/lib/cache'
import { getFinancials } from '@/lib/yahoo'

const TTL = 12 * 60 * 60 * 1000 // 12 hours

export async function GET(
  _req: Request,
  { params }: { params: { ticker: string } }
) {
  const ticker = params.ticker.toUpperCase()
  if (!isValidTicker(ticker)) {
    return NextResponse.json({ error: 'Invalid ticker' }, { status: 400 })
  }

  const cacheKey = `financials:${ticker}`
  const cached = cacheGet(cacheKey)
  if (cached) return NextResponse.json(cached)

  try {
    const data = await getFinancials(ticker)
    cacheSet(cacheKey, data, TTL)
    return NextResponse.json(data)
  } catch (err) {
    console.error(`[financials/${ticker}]`, err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'Failed to load financials' }, { status: 500 })
  }
}
