import { NextRequest, NextResponse } from 'next/server'
import { getAnalystData } from '@/lib/yahoo'
import { cacheGet, cacheSet } from '@/lib/cache'
import { isValidTicker } from '@/lib/validation'
import type { AnalystData } from '@/lib/types'

export const runtime = 'nodejs'
export const revalidate = 14400 // 4 hours

const TTL_4H = 4 * 60 * 60 * 1000

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker: rawTicker } = await params
  const ticker = (rawTicker ?? '').toUpperCase()
  if (!isValidTicker(ticker)) {
    return NextResponse.json({ error: 'Invalid ticker symbol' }, { status: 400 })
  }

  const cacheKey = `analyst:${ticker}`
  const cached = cacheGet<AnalystData>(cacheKey)
  if (cached) return NextResponse.json(cached)

  try {
    const data = await getAnalystData(ticker)
    cacheSet(cacheKey, data, TTL_4H)
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=14400, stale-while-revalidate=86400',
      },
    })
  } catch (err) {
    console.error(`[analyst/${ticker}]`, err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: `Failed to load analyst data for ${ticker}` }, { status: 500 })
  }
}
