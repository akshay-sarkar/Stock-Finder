import { NextRequest, NextResponse } from 'next/server'
import { getQuote } from '@/lib/yahoo'
import { isValidTicker } from '@/lib/validation'

export const runtime = 'nodejs'
export const maxDuration = 10

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker: rawTicker } = await params
  const ticker = rawTicker.toUpperCase()
  if (!isValidTicker(ticker)) return NextResponse.json({ error: 'Invalid ticker' }, { status: 400 })

  try {
    const quote = await getQuote(ticker)
    return NextResponse.json({
      price: quote.price,
      change: quote.change,
      changePercent: quote.changePercent,
      time: Math.floor(Date.now() / 1000),
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch quote'
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}
