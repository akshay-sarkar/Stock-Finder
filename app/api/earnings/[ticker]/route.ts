import { NextRequest, NextResponse } from 'next/server'
import { getEarnings } from '@/lib/yahoo'
import { cacheGet, cacheSet } from '@/lib/cache'
import { isValidTicker } from '@/lib/validation'
import type { EarningsData } from '@/lib/types'

export const runtime = 'nodejs'
export const revalidate = 21600 // 6 hours

const TTL_6H = 6 * 60 * 60 * 1000

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker: rawTicker } = await params
  const ticker = (rawTicker ?? '').toUpperCase()
  if (!isValidTicker(ticker)) {
    return NextResponse.json({ error: 'Invalid ticker symbol' }, { status: 400 })
  }

  const cacheKey = `earnings:${ticker}`
  const cached = cacheGet<EarningsData>(cacheKey)
  if (cached) return NextResponse.json(cached)

  try {
    const data = await getEarnings(ticker)
    cacheSet(cacheKey, data, TTL_6H)
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=86400',
      },
    })
  } catch (err) {
    console.error(`[earnings/${ticker}]`, err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: `Failed to load earnings for ${ticker}` }, { status: 500 })
  }
}
