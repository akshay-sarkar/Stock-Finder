export interface OHLCVBar {
  date: Date
  open: number
  high: number
  low: number
  close: number
  adjClose?: number
  volume: number
}

export interface IndicatorValues {
  rsi: number
  macd: number
  macdSignal: number
  macdHistogram: number
  macdCrossover: 'bullish' | 'bearish' | 'none'
  sma20: number
  sma50: number
  sma200: number | null
  ema9: number
  ema20: number
  latestVolume: number
  avgVolume20: number
  volumeRatio: number
}

export interface ChartPoint {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  volSma20: number | null   // rolling 20-period average volume — dotted avg line
  sma20: number | null
  sma50: number | null
  sma200: number | null
  ema9: number | null
  ema20: number | null
  rsi: number | null
  macd: number | null
  macdSignal: number | null
  macdHistogram: number | null
  // Bollinger Bands (period=20, stdDev=2)
  bbUpper: number | null
  bbMiddle: number | null   // same as sma20 but included for clarity
  bbLower: number | null
}

export interface ScreenerRow {
  ticker: string
  companyName?: string
  price: number
  change: number
  changePercent: number
  rsi: number
  macdCrossover: 'bullish' | 'bearish' | 'none'
  macdHistogram: number
  sma50: number
  sma200: number | null
  maStatus: string
  volumeRatio: number
  signals: string[]
  trailingPE?: number | null
  marketCap?: number | null
  dividendYield?: number | null
  revenueGrowth?: number | null
  error?: string
}

export interface FilterCriteria {
  rsi: 'any' | 'oversold' | 'overbought' | 'neutral'
  macd: 'any' | 'bullish_crossover' | 'bearish_crossover' | 'above_signal' | 'below_signal'
  movingAverage: 'any' | 'above_sma50' | 'below_sma50' | 'golden_cross' | 'death_cross' | 'price_above_sma200' | 'price_below_sma200'
  volume: 'any' | 'spike' | 'low' | 'normal'
  pe: 'any' | 'under_15' | 'under_25' | 'under_40' | 'over_40' | 'negative'
  marketCap: 'any' | 'mega' | 'large' | 'mid' | 'small'
  dividendYield: 'any' | 'none' | 'over_1' | 'over_2' | 'over_4'
  revenueGrowth: 'any' | 'positive' | 'over_10' | 'over_20' | 'negative'
}

// ─── Company fundamentals from Yahoo Finance quoteSummary ──────────────────
export interface StockFundamentals {
  // Valuation
  marketCap: number | null
  trailingPE: number | null
  forwardPE: number | null
  priceToBook: number | null
  priceToSales: number | null
  // Earnings
  trailingEps: number | null
  forwardEps: number | null
  // Dividends
  dividendYield: number | null   // decimal, e.g. 0.0044 = 0.44%
  dividendRate: number | null    // annual $ per share
  exDividendDate: string | null  // formatted date string
  payoutRatio: number | null     // decimal
  // Risk & Range
  beta: number | null
  fiftyTwoWeekHigh: number | null
  fiftyTwoWeekLow: number | null
  // Financials — YoY (annual/trailing)
  revenueGrowth: number | null   // YoY, decimal
  earningsGrowth: number | null  // YoY, decimal
  profitMargins: number | null   // TTM, decimal
  grossMargins: number | null    // TTM, decimal
  // Financials — QoQ (most-recent quarter vs prior quarter)
  revenueGrowthQoQ: number | null
  earningsGrowthQoQ: number | null
  grossMarginsQoQ: number | null
  // Balance Sheet
  currentRatio: number | null
  debtToEquity: number | null    // as reported (may be >100)
  // Short Interest
  shortPercentOfFloat: number | null  // decimal, e.g. 0.032 = 3.2%
  shortRatio: number | null           // days to cover
  sharesShort: number | null          // absolute shares short
}

export interface CongressionalTrade {
  id: string
  politician: string
  politicianId?: string
  party: string          // 'D' | 'R' | 'I'
  chamber: string        // 'House' | 'Senate'
  ticker: string
  companyName: string
  tradeType: string      // 'buy' | 'sell' | 'sell_partial'
  amountRange: string    // e.g. "$15K–$50K"
  transactionDate: string
  filedDate: string
  currentPrice?: number
  changePercent?: number
}

export interface EarningsHistoryEntry {
  date: string
  epsActual: number | null
  epsEstimate: number | null
  surprisePercent: number | null
}

export interface EarningsData {
  nextEarningsDate: string | null
  epsEstimateNext: number | null
  epsEstimateLow: number | null
  epsEstimateHigh: number | null
  history: EarningsHistoryEntry[]
}

export interface AnalystData {
  targetMeanPrice: number | null
  targetLowPrice: number | null
  targetHighPrice: number | null
  recommendationMean: number | null
  recommendationKey: string | null
  numberOfAnalystOpinions: number | null
}

export interface NewsItem {
  title: string
  link: string
  publisher: string
  publishedAt: number  // unix timestamp (seconds)
}

export interface FinancialsRow {
  period: string           // "FY2024" or "Q3 2024"
  revenue: number | null
  grossProfit: number | null
  operatingIncome: number | null
  netIncome: number | null
  revenueGrowth: number | null       // fractional: 0.12 = +12%
  grossProfitGrowth: number | null
  operatingIncomeGrowth: number | null
  netIncomeGrowth: number | null
}

export interface FinancialsData {
  annual: FinancialsRow[]    // up to 4 fiscal years, newest first
  quarterly: FinancialsRow[] // up to 8 quarters, newest first
}

export interface StockDetailData {
  ticker: string
  companyName: string
  exchange: string
  currentPrice: number
  change: number
  changePercent: number
  chartData: ChartPoint[]
  latestIndicators: IndicatorValues
  fundamentals: StockFundamentals | null
  error?: string
}
