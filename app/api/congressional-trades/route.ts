import { NextRequest, NextResponse } from 'next/server'
import { cacheGet, cacheSet, cacheDel } from '@/lib/cache'
import { checkRateLimit } from '@/lib/rateLimit'
import type { CongressionalTrade } from '@/lib/types'

export const runtime = 'nodejs'
export const maxDuration = 30

// Free community-maintained S3 dumps — no API key required
const HOUSE_URL  = 'https://house-stock-watcher-data.s3-us-west-2.amazonaws.com/data/all_transactions.json'
const SENATE_URL = 'https://senate-stock-watcher-data.s3-us-west-2.amazonaws.com/aggregate/all_transactions.json'

// Return at most this many recent trades (data sets are large — ~10K+ rows)
const MAX_TRADES = 300

// ─── Normalizers ──────────────────────────────────────────────────────────────
function normalizeParty(raw: string): string {
  const l = (raw ?? '').toLowerCase()
  if (l.includes('democrat'))    return 'D'
  if (l.includes('republican'))  return 'R'
  if (l.includes('independent')) return 'I'
  return '?'
}

function normalizeType(raw: string): string {
  const l = (raw ?? '').toLowerCase()
  if (l.includes('purchase') || l === 'buy') return 'buy'
  if (l.includes('partial'))                  return 'sell_partial'
  if (l.includes('sale') || l.includes('sell')) return 'sell'
  if (l.includes('exchange'))                 return 'exchange'
  return l
}

// ─── House mapper ─────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapHouse(t: any, i: number): CongressionalTrade | null {
  const ticker = (t.ticker ?? '').toString().toUpperCase().trim()
  if (!ticker || ticker === '--' || ticker === 'N/A') return null
  return {
    id:              `house-${t.disclosure_date ?? ''}-${ticker}-${i}`,
    politician:      t.representative ?? 'Unknown',
    politicianId:    '',
    party:           '?',   // House data doesn't include party
    chamber:         'House',
    ticker,
    companyName:     t.asset_description ?? '',
    tradeType:       normalizeType(t.type ?? ''),
    amountRange:     t.amount ?? '',
    transactionDate: t.transaction_date ?? '',
    filedDate:       t.disclosure_date ?? '',
  }
}

// ─── Senate mapper ────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSenate(t: any, i: number): CongressionalTrade | null {
  const ticker = (t.ticker ?? '').toString().toUpperCase().trim()
  if (!ticker || ticker === '--' || ticker === 'N/A') return null
  return {
    id:              `senate-${t.disclosure_date ?? ''}-${ticker}-${i}`,
    politician:      t.senator ?? 'Unknown',
    politicianId:    '',
    party:           normalizeParty(t.party ?? ''),
    chamber:         'Senate',
    ticker,
    companyName:     t.asset_description ?? '',
    tradeType:       normalizeType(t.type ?? ''),
    amountRange:     t.amount ?? '',
    transactionDate: t.transaction_date ?? '',
    filedDate:       t.disclosure_date ?? '',
  }
}

// ─── Fetch both sources in parallel ──────────────────────────────────────────
async function fetchAllTrades(): Promise<CongressionalTrade[]> {
  const [houseRes, senateRes] = await Promise.allSettled([
    fetch(HOUSE_URL,  { signal: AbortSignal.timeout(15000) }),
    fetch(SENATE_URL, { signal: AbortSignal.timeout(15000) }),
  ])

  const trades: CongressionalTrade[] = []

  if (houseRes.status === 'fulfilled' && houseRes.value.ok) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const json: any[] = await houseRes.value.json()
    json.forEach((t, i) => {
      const mapped = mapHouse(t, i)
      if (mapped) trades.push(mapped)
    })
  } else {
    console.error('[congress] House fetch failed:', houseRes.status === 'rejected' ? houseRes.reason : houseRes.value.status)
  }

  if (senateRes.status === 'fulfilled' && senateRes.value.ok) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const json: any[] = await senateRes.value.json()
    json.forEach((t, i) => {
      const mapped = mapSenate(t, i)
      if (mapped) trades.push(mapped)
    })
  } else {
    console.error('[congress] Senate fetch failed:', senateRes.status === 'rejected' ? senateRes.reason : senateRes.value.status)
  }

  if (trades.length === 0) throw new Error('No trades returned from House or Senate data sources')

  // Sort newest first by filed date, then take most recent MAX_TRADES
  trades.sort((a, b) => (b.filedDate > a.filedDate ? 1 : b.filedDate < a.filedDate ? -1 : 0))
  return trades.slice(0, MAX_TRADES)
}

// ─── Enrich with live Yahoo Finance prices ────────────────────────────────────
async function enrichWithPrices(trades: CongressionalTrade[]): Promise<CongressionalTrade[]> {
  const uniqueTickers = [...new Set(trades.map(t => t.ticker).filter(Boolean))]
  if (uniqueTickers.length === 0) return trades

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const yf = new (require('yahoo-finance2').default)()
  const priceMap: Record<string, { price: number; changePercent: number }> = {}

  const settled = await Promise.allSettled(
    uniqueTickers.map(async (ticker) => {
      const q = await yf.quote(ticker, {}, { validateResult: false })
      const price         = q?.regularMarketPrice         ?? null
      const changePercent = q?.regularMarketChangePercent ?? null
      if (price != null && changePercent != null) {
        priceMap[ticker] = { price, changePercent }
      }
    })
  )

  settled.forEach((s, i) => {
    if (s.status === 'rejected') {
      console.error(`[congress] quote failed for ${uniqueTickers[i]}:`, s.reason?.message ?? s.reason)
    }
  })

  return trades.map(t => ({
    ...t,
    currentPrice:  priceMap[t.ticker]?.price,
    changePercent: priceMap[t.ticker]?.changePercent,
  }))
}

// ─── Route handler ────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (!checkRateLimit(ip, 20, 60_000)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded — max 20 requests per minute' },
      { status: 429, headers: { 'Retry-After': '60' } },
    )
  }

  const cacheKey = 'congressional:trades'
  const refresh  = req.nextUrl.searchParams.get('refresh') === '1'
  if (refresh) cacheDel(cacheKey)

  const cached = cacheGet<{ trades: CongressionalTrade[]; fetchedAt: number }>(cacheKey)
  if (cached) {
    return NextResponse.json({ ...cached, cached: true })
  }

  try {
    const raw    = await fetchAllTrades()
    const trades = await enrichWithPrices(raw)
    const payload = { trades, fetchedAt: Date.now(), cached: false }
    cacheSet(cacheKey, payload, 5 * 60_000)
    return NextResponse.json(payload)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch congressional trades'
    console.error('[congress]', msg)
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}
