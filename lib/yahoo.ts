/* eslint-disable @typescript-eslint/no-explicit-any */
import type { OHLCVBar, StockFundamentals, EarningsData, EarningsHistoryEntry, AnalystData, NewsItem, FinancialsRow, FinancialsData } from './types'

// yahoo-finance2 v3 uses class instantiation
// eslint-disable-next-line @typescript-eslint/no-require-imports
const YahooFinanceClass = require('yahoo-finance2').default
const yahooFinance: any = new YahooFinanceClass({
  suppressNotices: ['yahooSurvey', 'ripHistorical'],
})
export { yahooFinance as yf }

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Yahoo Finance timeout after ${ms}ms`)), ms)
    ),
  ])
}

/**
 * Fetches historical OHLCV data for a ticker using chart() API.
 * @param ticker   - Stock symbol (e.g. "AAPL")
 * @param days     - Calendar days to look back
 * @param interval - '1d' daily | '1wk' weekly | '1mo' monthly
 *
 * Yahoo Finance has no hard rate limits:
 * - Data typically goes back 10+ years for major stocks
 * - Use '1wk' for 5-year views to keep payload manageable (~260 pts vs ~1260)
 */
export async function getHistoricalData(
  ticker: string,
  days = 320,
  interval: '1d' | '1wk' | '1mo' = '1d'
): Promise<OHLCVBar[]> {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const result: any = await withTimeout(
    yahooFinance.chart(ticker, { period1: startDate, period2: endDate, interval }),
    15_000
  )

  const quotes = result.quotes ?? []
  return quotes
    .filter((bar: any) => bar.close != null && bar.volume != null)
    .map((bar: any): OHLCVBar => ({
      date: bar.date,
      open: bar.open ?? bar.close,
      high: bar.high ?? bar.close,
      low: bar.low ?? bar.close,
      close: bar.close,
      adjClose: bar.adjClose,
      volume: bar.volume ?? 0,
    }))
    .sort((a: OHLCVBar, b: OHLCVBar) => a.date.getTime() - b.date.getTime())
}

/**
 * Fetches the current quote (price, change, name).
 */
/** Maps Yahoo Finance exchange name to Google Finance exchange code. */
function toGoogleExchange(fullName: string | undefined): string {
  if (!fullName) return 'NASDAQ'
  const n = fullName.toLowerCase()
  if (n.includes('nasdaq'))  return 'NASDAQ'
  if (n.includes('nysearca') || n.includes('arca')) return 'NYSEARCA'
  if (n.includes('nyse'))    return 'NYSE'
  return fullName.toUpperCase()
}

export async function getQuote(ticker: string): Promise<{
  price: number
  change: number
  changePercent: number
  postMarketPrice: number | null
  postMarketChange: number | null
  postMarketChangePercent: number | null
  name: string
  exchange: string
}> {
  const result: any = await withTimeout(yahooFinance.quote(ticker), 10_000)
  return {
    price: result.regularMarketPrice ?? 0,
    change: result.regularMarketChange ?? 0,
    changePercent: result.regularMarketChangePercent ?? 0,
    postMarketPrice: result.postMarketPrice ?? null,
    postMarketChange: result.postMarketChange ?? null,
    postMarketChangePercent: result.postMarketChangePercent ?? null,
    name: result.longName ?? result.shortName ?? ticker,
    exchange: toGoogleExchange(result.fullExchangeName ?? result.exchange),
  }
}

/**
 * Fetches upcoming earnings date + EPS estimates + last 4 quarters history.
 * Modules: calendarEvents (next date + estimate), earningsHistory (actuals)
 * Returns gracefully if modules unavailable (ETFs, indices).
 */
export async function getEarnings(ticker: string): Promise<EarningsData> {
  const result = await withTimeout<any>(yahooFinance.quoteSummary(ticker, {
    modules: ['calendarEvents', 'earningsHistory'],
  }, { validateResult: false }), 10_000).catch(() => null)

  const cal = result?.calendarEvents ?? {}
  const earningsDates: any[] = cal?.earnings?.earningsDate ?? []

  let nextEarningsDate: string | null = null
  if (earningsDates.length > 0) {
    const d = earningsDates[0]
    nextEarningsDate = d instanceof Date ? d.toISOString().slice(0, 10) : null
  }

  const history: EarningsHistoryEntry[] = (result?.earningsHistory?.history ?? [])
    .slice(0, 4)
    .map((h: any) => ({
      date: h.quarter instanceof Date ? h.quarter.toISOString().slice(0, 10) : null,
      epsActual: h.epsActual ?? null,
      epsEstimate: h.epsEstimate ?? null,
      surprisePercent: h.surprisePercent != null ? h.surprisePercent * 100 : null,
    }))
    .filter((h: EarningsHistoryEntry) => h.date !== null)

  return {
    nextEarningsDate,
    epsEstimateNext: cal?.earnings?.earningsAverage ?? null,
    epsEstimateLow:  cal?.earnings?.earningsLow    ?? null,
    epsEstimateHigh: cal?.earnings?.earningsHigh   ?? null,
    history,
  }
}

/**
 * Fetches analyst price targets and consensus recommendation.
 * Module: financialData — targetMeanPrice, targetLowPrice, targetHighPrice,
 *   recommendationMean (1=Strong Buy…5=Sell), recommendationKey, numberOfAnalystOpinions
 */
export async function getAnalystData(ticker: string): Promise<AnalystData> {
  const result = await withTimeout<any>(yahooFinance.quoteSummary(ticker, {
    modules: ['financialData'],
  }, { validateResult: false }), 10_000).catch(() => null)

  const fd = result?.financialData ?? {}

  return {
    targetMeanPrice:          fd.targetMeanPrice          ?? null,
    targetLowPrice:           fd.targetLowPrice           ?? null,
    targetHighPrice:          fd.targetHighPrice          ?? null,
    recommendationMean:       fd.recommendationMean       ?? null,
    recommendationKey:        fd.recommendationKey        ?? null,
    numberOfAnalystOpinions:  fd.numberOfAnalystOpinions  ?? null,
  }
}

/**
 * Fetches fundamental/valuation data via quoteSummary.
 * Returns null gracefully for ETFs or tickers missing certain data.
 * Modules used:
 *   summaryDetail              — P/E, beta, 52-week range, dividends, market cap
 *   defaultKeyStatistics       — EPS, P/B, forward EPS, quarterly earnings growth
 *   financialData              — margins, YoY growth, current ratio, debt/equity
 *   incomeStatementHistoryQuarterly — QoQ revenue + earnings + gross margin
 *     (silently omitted if unavailable — many tickers lack this since late 2024)
 */
export async function getQuoteSummary(ticker: string): Promise<StockFundamentals | null> {
  try {
  // Fetch primary modules + quarterly fundamentals via fundamentalsTimeSeries
  const twoYearsAgo = new Date()
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)

  const [primary, quarterlyTimeSeries] = await Promise.all([
    withTimeout<any>(yahooFinance.quoteSummary(ticker, {
      modules: ['summaryDetail', 'defaultKeyStatistics', 'financialData'],
    }, { validateResult: false }), 15_000),
    yahooFinance.fundamentalsTimeSeries(ticker, {
      period1: twoYearsAgo,
      type: 'quarterly',
      module: 'financials',
    }).catch(() => []),
  ])

  const sd = primary?.summaryDetail ?? {}
  const ks = primary?.defaultKeyStatistics ?? {}
  const fd = primary?.financialData ?? {}

  // Format ex-dividend date if present
  let exDividendDate: string | null = null
  if (sd.exDividendDate) {
    try {
      exDividendDate = new Date(sd.exDividendDate).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      })
    } catch { exDividendDate = null }
  }

  // ── QoQ metrics from fundamentalsTimeSeries quarterly data ──────────────────
  // Array is ordered by date; we need the two most recent quarters
  let revenueGrowthQoQ: number | null = null
  let earningsGrowthQoQ: number | null = null
  let grossMarginsQoQ: number | null = null

  const qData: any[] = quarterlyTimeSeries ?? []

  if (qData.length >= 2) {
    // Most recent quarter is typically at the end (or check date field)
    const sorted = [...qData].sort((a: any, b: any) => {
      const aDate = a.date instanceof Date ? a.date.getTime() : new Date(a.date).getTime()
      const bDate = b.date instanceof Date ? b.date.getTime() : new Date(b.date).getTime()
      return bDate - aDate // descending: newest first
    })

    const q0 = sorted[0] // most recent quarter
    const q1 = sorted[1] // prior quarter

    const rev0 = q0?.totalRevenue ?? null
    const rev1 = q1?.totalRevenue ?? null
    if (rev0 != null && rev1 != null && rev1 !== 0) {
      revenueGrowthQoQ = (rev0 - rev1) / Math.abs(rev1)
    }

    const net0 = q0?.netIncome ?? null
    const net1 = q1?.netIncome ?? null
    if (net0 != null && net1 != null && net1 !== 0) {
      earningsGrowthQoQ = (net0 - net1) / Math.abs(net1)
    }

    const gross0 = q0?.grossProfit ?? null
    if (gross0 != null && rev0 != null && rev0 !== 0) {
      grossMarginsQoQ = gross0 / rev0
    }
  }

  return {
    marketCap:        sd.marketCap        ?? null,
    trailingPE:       sd.trailingPE       ?? null,
    forwardPE:        sd.forwardPE        ?? null,
    priceToBook:      ks.priceToBook      ?? null,
    priceToSales:     ks.priceToSalesTrailing12Months ?? null,
    trailingEps:      ks.trailingEps      ?? null,
    forwardEps:       ks.forwardEps       ?? null,
    dividendYield:    sd.dividendYield    ?? null,
    dividendRate:     sd.dividendRate     ?? null,
    exDividendDate,
    payoutRatio:      sd.payoutRatio      ?? null,
    beta:             sd.beta             ?? null,
    fiftyTwoWeekHigh: sd.fiftyTwoWeekHigh ?? null,
    fiftyTwoWeekLow:  sd.fiftyTwoWeekLow  ?? null,
    revenueGrowth:    fd.revenueGrowth    ?? null,
    earningsGrowth:   fd.earningsGrowth   ?? null,
    profitMargins:    fd.profitMargins    ?? null,
    grossMargins:     fd.grossMargins     ?? null,
    revenueGrowthQoQ,
    earningsGrowthQoQ,
    grossMarginsQoQ,
    currentRatio:     fd.currentRatio     ?? null,
    debtToEquity:     fd.debtToEquity     ?? null,
    shortPercentOfFloat: ks.shortPercentOfFloat ?? null,
    shortRatio:         ks.shortRatio          ?? null,
    sharesShort:        ks.sharesShort         ?? null,
  }
  } catch {
    return null
  }
}

/**
 * Fetches recent news headlines for a ticker.
 *
 * Strategy (two-tier):
 *   1. yahoo-finance2 search() — fast when Yahoo's search API is healthy.
 *   2. Yahoo Finance RSS feed — reliable fallback; no SDK dependency.
 *
 * Returns up to 8 items. Gracefully returns [] if both sources fail.
 */
export async function getNews(ticker: string): Promise<NewsItem[]> {
  // ── Tier 1: yahoo-finance2 search ────────────────────────────────────────
  try {
    const result: any = await withTimeout(
      (yahooFinance as any).search(ticker, { newsCount: 8 }, { validateResult: false }),
      8_000
    )
    const items = (result?.news ?? [])
      .filter((n: any) => n.title && n.link)
      .map((n: any): NewsItem => ({
        title:       n.title,
        link:        n.link,
        publisher:   n.publisher ?? '',
        publishedAt: n.providerPublishTime instanceof Date
          ? Math.floor(n.providerPublishTime.getTime() / 1000)
          : (n.providerPublishTime ?? 0),
      }))
    if (items.length > 0) return items
  } catch {
    // fall through to RSS
  }

  // ── Tier 2: Yahoo Finance RSS feed ────────────────────────────────────────
  try {
    const rssUrl = `https://feeds.finance.yahoo.com/rss/2.0/headline?s=${encodeURIComponent(ticker)}&region=US&lang=en-US`
    const res = await withTimeout(
      fetch(rssUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; StockFinder/1.0; +https://github.com)',
          'Accept': 'application/rss+xml, application/xml, text/xml',
        },
        // @ts-ignore — Next.js fetch extension
        next: { revalidate: 900 },
      }),
      8_000
    )
    if (!res.ok) return []
    const xml = await res.text()

    // Parse <item> blocks from RSS XML without an external library
    const items: NewsItem[] = []
    const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/g
    let match: RegExpExecArray | null
    while ((match = itemRegex.exec(xml)) !== null && items.length < 8) {
      const block = match[1]
      const title     = stripCdata(extract(block, 'title'))
      const link      = stripCdata(extract(block, 'link')) || stripCdata(extract(block, 'guid'))
      const publisher = stripCdata(extract(block, 'source')) || 'Yahoo Finance'
      const pubDate   = stripCdata(extract(block, 'pubDate'))
      if (!title || !link) continue
      const publishedAt = pubDate ? Math.floor(new Date(pubDate).getTime() / 1000) : 0
      items.push({ title, link, publisher, publishedAt })
    }
    return items
  } catch {
    return []
  }
}

/** Extract the text content of the first matching XML tag */
function extract(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'))
  return m ? m[1].trim() : ''
}

/** Strip CDATA wrapper if present */
function stripCdata(s: string): string {
  return s.replace(/^<!\[CDATA\[([\s\S]*?)]]>$/, '$1').trim()
}

/**
 * Fetches annual (4 years) and quarterly (8 quarters) income statement data
 * via fundamentalsTimeSeries — free, no API key required.
 */
export async function getFinancials(ticker: string): Promise<FinancialsData> {
  function toLabel(date: Date, type: 'annual' | 'quarterly'): string {
    if (type === 'annual') return `FY${date.getFullYear()}`
    const q = Math.ceil((date.getMonth() + 1) / 3)
    return `Q${q} ${date.getFullYear()}`
  }

  function growth(current: number | null, prior: number | null): number | null {
    if (current == null || prior == null || prior === 0) return null
    return (current - prior) / Math.abs(prior)
  }

  function mapRows(entries: any[], type: 'annual' | 'quarterly'): FinancialsRow[] {
    // newest first → growth compares [i] vs [i+1]
    const sorted = [...entries].sort((a: any, b: any) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )
    return sorted.map((e: any, i: number): FinancialsRow => {
      const prev = sorted[i + 1] ?? null
      const rev = e.totalRevenue ?? null
      const gp  = e.grossProfit ?? null
      const oi  = e.operatingIncome ?? null
      const ni  = e.netIncome ?? null
      return {
        period: toLabel(new Date(e.date), type),
        revenue: rev,
        grossProfit: gp,
        operatingIncome: oi,
        netIncome: ni,
        revenueGrowth: growth(rev, prev?.totalRevenue ?? null),
        grossProfitGrowth: growth(gp, prev?.grossProfit ?? null),
        operatingIncomeGrowth: growth(oi, prev?.operatingIncome ?? null),
        netIncomeGrowth: growth(ni, prev?.netIncome ?? null),
      }
    })
  }

  const fourYearsAgo = new Date()
  fourYearsAgo.setFullYear(fourYearsAgo.getFullYear() - 4)

  try {
    const [annual, quarterly] = await Promise.all([
      yahooFinance.fundamentalsTimeSeries(ticker, {
        period1: fourYearsAgo,
        type: 'annual',
        module: 'financials',
      }).catch(() => []),
      yahooFinance.fundamentalsTimeSeries(ticker, {
        period1: fourYearsAgo,
        type: 'quarterly',
        module: 'financials',
      }).catch(() => []),
    ])

    return {
      annual: mapRows(annual as any[], 'annual').slice(0, 4),
      quarterly: mapRows(quarterly as any[], 'quarterly').slice(0, 8),
    }
  } catch {
    return { annual: [], quarterly: [] }
  }
}
