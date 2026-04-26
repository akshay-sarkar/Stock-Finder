import { NextResponse } from 'next/server'
import { isValidTicker } from '@/lib/validation'
import { cacheGet, cacheSet } from '@/lib/cache'
import { getNews } from '@/lib/yahoo'

const TTL = 15 * 60 * 1000 // 15 minutes

export async function GET(
  _req: Request,
  { params }: { params: { ticker: string } }
) {
  const ticker = params.ticker.toUpperCase()
  if (!isValidTicker(ticker)) {
    return NextResponse.json({ error: 'Invalid ticker' }, { status: 400 })
  }

  const cacheKey = `news:${ticker}`
  const cached = cacheGet(cacheKey)
  if (cached) return NextResponse.json(cached)

  try {
    const items = await getNews(ticker)
    const payload = { items }
    cacheSet(cacheKey, payload, TTL)
    return NextResponse.json(payload)
  } catch (err) {
    console.error(`[news/${ticker}]`, err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'Failed to load news' }, { status: 500 })
  }
}
