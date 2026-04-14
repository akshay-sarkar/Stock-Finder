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
export async function getQuote(ticker: string): Promise<{
  price: number
  change: number
  changePercent: number
  name: string
}> {
  const result: any = await yahooFinance.quote(ticker)
  return {
    price: result.regularMarketPrice ?? 0,
    change: result.regularMarketChange ?? 0,
    changePercent: result.regularMarketChangePercent ?? 0,
    name: result.longName ?? result.shortName ?? ticker,
  }
}

/**
 * Fetches fundamental/valuation data via quoteSummary.
 * Returns null gracefully for ETFs or tickers missing certain data.
 * Modules used:
 *   summaryDetail     — P/E, beta, 52-week range, dividends, market cap
 *   defaultKeyStatistics — EPS, P/B, forward EPS
 *   financialData     — margins, growth, current ratio, debt/equity
 */
export async function getQuoteSummary(ticker: string): Promise<StockFundamentals | null> {
  const result: any = await yahooFinance.quoteSummary(ticker, {
    modules: ['summaryDetail', 'defaultKeyStatistics', 'financialData'],
  })

  const sd = result?.summaryDetail ?? {}
  const ks = result?.defaultKeyStatistics ?? {}
  const fd = result?.financialData ?? {}

  // Format ex-dividend date if present
  let exDividendDate: string | null = null
  if (sd.exDividendDate) {
    try {
      exDividendDate = new Date(sd.exDividendDate).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      })
    } catch { exDividendDate = null }
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
    currentRatio:     fd.currentRatio     ?? null,
    debtToEquity:     fd.debtToEquity     ?? null,
  }
}
