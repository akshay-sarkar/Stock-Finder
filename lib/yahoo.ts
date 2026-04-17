/* eslint-disable @typescript-eslint/no-explicit-any */
import type { OHLCVBar, StockFundamentals } from './types'

// yahoo-finance2 v3 uses class instantiation
// eslint-disable-next-line @typescript-eslint/no-require-imports
const YahooFinanceClass = require('yahoo-finance2').default
const yahooFinance: any = new YahooFinanceClass()

/**
 * Fetches historical OHLCV data for a ticker.
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

  const result: any[] = await yahooFinance.historical(ticker, {
    period1: startDate,
    period2: endDate,
    interval,
  })

  return result
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
  name: string
  exchange: string
}> {
  const result: any = await yahooFinance.quote(ticker)
  return {
    price: result.regularMarketPrice ?? 0,
    change: result.regularMarketChange ?? 0,
    changePercent: result.regularMarketChangePercent ?? 0,
    name: result.longName ?? result.shortName ?? ticker,
    exchange: toGoogleExchange(result.fullExchangeName ?? result.exchange),
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
  // Fetch primary modules + attempt quarterly income statements (may fail)
  const [primary, quarterly] = await Promise.all([
    yahooFinance.quoteSummary(ticker, {
      modules: ['summaryDetail', 'defaultKeyStatistics', 'financialData'],
    }),
    yahooFinance.quoteSummary(ticker, {
      modules: ['incomeStatementHistoryQuarterly'],
    }, { validateResult: false }).catch(() => null),
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

  // ── QoQ metrics from quarterly income statements ────────────────────────────
  // Quarters are ordered most-recent first: [Q_n, Q_n-1, Q_n-2, Q_n-3]
  let revenueGrowthQoQ: number | null = null
  let earningsGrowthQoQ: number | null = null
  let grossMarginsQoQ: number | null = null

  const qHistory: any[] =
    quarterly?.incomeStatementHistoryQuarterly?.incomeStatementHistory ?? []

  if (qHistory.length >= 2) {
    const q0 = qHistory[0] // most recent quarter
    const q1 = qHistory[1] // prior quarter

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
  }
}
