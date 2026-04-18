import { NextRequest, NextResponse } from 'next/server'
import { cacheGet, cacheSet, cacheDel } from '@/lib/cache'
import { checkRateLimit } from '@/lib/rateLimit'
import type { CongressionalTrade } from '@/lib/types'

export const runtime = 'nodejs'
export const maxDuration = 30

const CT_TRADES_URL = 'https://www.capitoltrades.com/trades?pageSize=96&page=1'

function normalizeParty(raw: string): string {
  const l = (raw ?? '').toLowerCase()
  if (l.includes('democrat')) return 'D'
  if (l.includes('republican')) return 'R'
  if (l.includes('independent')) return 'I'
  return (raw ?? '').toUpperCase().slice(0, 1) || '?'
}

function normalizeChamber(raw: string): string {
  const l = (raw ?? '').toLowerCase()
  if (l.includes('senate')) return 'Senate'
  if (l.includes('house') || l.includes('representative')) return 'House'
  return raw ?? ''
}

function normalizeType(raw: string): string {
  const l = (raw ?? '').toLowerCase()
  if (l.includes('purchase') || l === 'buy') return 'buy'
  if (l.includes('partial_sale') || l.includes('sale_partial') || l.includes('partial')) return 'sell_partial'
  if (l.includes('sale') || l.includes('sell')) return 'sell'
  if (l.includes('exchange')) return 'exchange'
  return l
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapTrade(t: any, i: number): CongressionalTrade | null {
  const ticker = (t.ticker ?? t.symbol ?? t.asset?.ticker ?? '').toString().toUpperCase().trim()
  if (!ticker) return null
  return {
    id:               t._id ?? t.id ?? `trade-${i}`,
    politician:       t.politician ?? t.politicianName ?? t.name ?? 'Unknown',
    politicianId:     t.politicianId ?? t.politician_id ?? '',
    party:            normalizeParty(t.party ?? t.politicianParty ?? ''),
    chamber:          normalizeChamber(t.chamber ?? t.politicianChamber ?? ''),
    ticker,
    companyName:      t.description ?? t.issuerName ?? t.issuer?.name ?? t.company ?? '',
    tradeType:        normalizeType(t.tradeType ?? t.type ?? t.transaction ?? ''),
    amountRange:      t.size ?? t.amount ?? t.range ?? '',
    transactionDate:  t.txDate ?? t.transactionDate ?? t.tx_date ?? '',
    filedDate:        t.reportDate ?? t.publishedDate ?? t.filedDate ?? t.filed_date ?? '',
  }
}

async function fetchTrades(): Promise<CongressionalTrade[]> {
  const res = await fetch(CT_TRADES_URL, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml',
    },
    signal: AbortSignal.timeout(12000),
  })

  if (!res.ok) throw new Error(`Capitol Trades HTTP ${res.status}`)

  const html = await res.text()

  // Extract Next.js SSR data embedded in every page
  const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)
  if (!match) throw new Error('__NEXT_DATA__ not found — Capitol Trades may have changed structure')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nextData: any = JSON.parse(match[1])
  const pp = nextData?.props?.pageProps ?? {}

  // Try common data keys Capitol Trades may use
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawTrades: any[] =
    pp.trades ??
    pp.data?.trades ??
    pp.data ??
    pp.tradeData ??
    pp.items ??
    []

  if (!Array.isArray(rawTrades) || rawTrades.length === 0) {
    // Dump available keys to help debug structure changes
    console.warn('[congress] pageProps keys:', Object.keys(pp))
    throw new Error('No trades found in Capitol Trades page data — structure may have changed')
  }

  const mapped = rawTrades.map(mapTrade)
  return mapped.filter((t): t is CongressionalTrade => t !== null)
}

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

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (!checkRateLimit(ip, 20, 60_000)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded — max 20 requests per minute' },
      { status: 429, headers: { 'Retry-After': '60' } },
    )
  }

  const cacheKey = 'congressional:trades'
  const refresh = req.nextUrl.searchParams.get('refresh') === '1'

  if (refresh) cacheDel(cacheKey)

  const cached = cacheGet<{ trades: CongressionalTrade[]; fetchedAt: number }>(cacheKey)
  if (cached) {
    return NextResponse.json({ ...cached, cached: true })
  }

  try {
    const raw     = await fetchTrades()
    const trades  = await enrichWithPrices(raw)
    const payload = { trades, fetchedAt: Date.now(), cached: false }
    cacheSet(cacheKey, payload, 5 * 60_000)
    return NextResponse.json(payload)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch congressional trades'
    console.error('[congress]', msg)
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}
