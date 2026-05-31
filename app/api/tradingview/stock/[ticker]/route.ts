/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { yf } from '@/lib/yahoo'
import { cacheGet, cacheSet } from '@/lib/cache'
import { isValidTicker } from '@/lib/validation'

export const runtime = 'nodejs'
export const maxDuration = 15

interface IntervalCfg { days: number; yahooInterval: string; ttl: number }

const INTERVALS: Record<string, IntervalCfg> = {
  '1m':  { days: 7,    yahooInterval: '1m',  ttl: 60_000 },
  '5m':  { days: 60,   yahooInterval: '5m',  ttl: 60_000 },
  '15m': { days: 60,   yahooInterval: '15m', ttl: 60_000 },
  '1h':  { days: 365,  yahooInterval: '60m', ttl: 60_000 },
  '1d':  { days: 730,  yahooInterval: '1d',  ttl: 600_000 },
  '1mo': { days: 1825, yahooInterval: '1mo', ttl: 600_000 },
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker: rawTicker } = await params
  const ticker = rawTicker.toUpperCase()
  if (!isValidTicker(ticker)) return NextResponse.json({ error: 'Invalid ticker' }, { status: 400 })

  const interval = req.nextUrl.searchParams.get('interval') ?? '1d'
  const cfg = INTERVALS[interval]
  if (!cfg) return NextResponse.json({ error: 'Invalid interval' }, { status: 400 })

  const cacheKey = `tv:stock:${ticker}:${interval}`
  const cached = cacheGet<{ bars: unknown[] }>(cacheKey)
  if (cached) return NextResponse.json(cached)

  try {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - cfg.days)

    const result: any = await yf.chart(ticker, {
      period1: startDate,
      period2: endDate,
      interval: cfg.yahooInterval,
    })

    const bars = (result.quotes ?? [])
      .filter((q: any) => q.close != null)
      .map((q: any) => ({
        time: Math.floor(new Date(q.date).getTime() / 1000),
        open: q.open ?? q.close,
        high: q.high ?? q.close,
        low: q.low ?? q.close,
        close: q.close,
        volume: q.volume ?? 0,
      }))
      .sort((a: any, b: any) => a.time - b.time)

    const name: string =
      result.meta?.longName ??
      result.meta?.shortName ??
      result.meta?.symbol ??
      ticker

    const payload = { bars, name }
    cacheSet(cacheKey, payload, cfg.ttl)
    return NextResponse.json(payload)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch'
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}
