import type { FilterCriteria, ScreenerRow, IndicatorValues } from './types'
import { generateSignals, getMaStatus } from './indicators'

export function buildScreenerRow(
  ticker: string,
  price: number,
  change: number,
  changePercent: number,
  ind: IndicatorValues,
  fundamentals?: { trailingPE?: number | null; marketCap?: number | null; dividendYield?: number | null; revenueGrowth?: number | null }
): ScreenerRow {
  return {
    ticker,
    price,
    change,
    changePercent,
    rsi: ind.rsi,
    macdCrossover: ind.macdCrossover,
    macdHistogram: ind.macdHistogram,
    sma50: ind.sma50,
    sma200: ind.sma200,
    maStatus: getMaStatus(price, ind.sma50, ind.sma200),
    volumeRatio: ind.volumeRatio,
    signals: generateSignals(ind, price),
    trailingPE: fundamentals?.trailingPE,
    marketCap: fundamentals?.marketCap,
    dividendYield: fundamentals?.dividendYield,
    revenueGrowth: fundamentals?.revenueGrowth,
  }
}

export function applyFilters(row: ScreenerRow, filters: FilterCriteria): boolean {
  // RSI filter
  if (filters.rsi !== 'any') {
    if (filters.rsi === 'oversold' && row.rsi >= 30) return false
    if (filters.rsi === 'overbought' && row.rsi <= 70) return false
    if (filters.rsi === 'neutral' && (row.rsi < 30 || row.rsi > 70)) return false
  }

  // MACD filter
  if (filters.macd !== 'any') {
    if (filters.macd === 'bullish_crossover' && row.macdCrossover !== 'bullish') return false
    if (filters.macd === 'bearish_crossover' && row.macdCrossover !== 'bearish') return false
    if (filters.macd === 'above_signal' && row.macdHistogram <= 0) return false
    if (filters.macd === 'below_signal' && row.macdHistogram >= 0) return false
  }

  // Moving Average filter
  if (filters.movingAverage !== 'any') {
    if (filters.movingAverage === 'above_sma50' && row.price <= row.sma50) return false
    if (filters.movingAverage === 'below_sma50' && row.price >= row.sma50) return false
    if (filters.movingAverage === 'golden_cross') {
      if (!row.sma200 || row.sma50 <= row.sma200) return false
    }
    if (filters.movingAverage === 'death_cross') {
      if (!row.sma200 || row.sma50 >= row.sma200) return false
    }
    if (filters.movingAverage === 'price_above_sma200') {
      if (!row.sma200 || row.price <= row.sma200) return false
    }
    if (filters.movingAverage === 'price_below_sma200') {
      if (!row.sma200 || row.price >= row.sma200) return false
    }
  }

  // Volume filter
  if (filters.volume !== 'any') {
    if (filters.volume === 'spike' && row.volumeRatio < 2) return false
    if (filters.volume === 'low' && row.volumeRatio >= 0.5) return false
    if (filters.volume === 'normal' && (row.volumeRatio < 0.5 || row.volumeRatio >= 2)) return false
  }

  // P/E Ratio filter
  if (filters.pe !== 'any') {
    if (row.trailingPE === null || row.trailingPE === undefined) return false
    if (filters.pe === 'under_15' && row.trailingPE >= 15) return false
    if (filters.pe === 'under_25' && row.trailingPE >= 25) return false
    if (filters.pe === 'under_40' && row.trailingPE >= 40) return false
    if (filters.pe === 'over_40' && row.trailingPE < 40) return false
    if (filters.pe === 'negative' && row.trailingPE >= 0) return false
  }

  // Market Cap filter
  if (filters.marketCap !== 'any') {
    if (row.marketCap === null || row.marketCap === undefined) return false
    const cap = row.marketCap
    if (filters.marketCap === 'mega' && cap < 200_000_000_000) return false
    if (filters.marketCap === 'large' && (cap < 10_000_000_000 || cap >= 200_000_000_000)) return false
    if (filters.marketCap === 'mid' && (cap < 2_000_000_000 || cap >= 10_000_000_000)) return false
    if (filters.marketCap === 'small' && cap >= 2_000_000_000) return false
  }

  // Dividend Yield filter
  if (filters.dividendYield !== 'any') {
    if (row.dividendYield === null || row.dividendYield === undefined) return false
    const yield_pct = row.dividendYield * 100 // convert decimal to percentage
    if (filters.dividendYield === 'none' && yield_pct > 0) return false
    if (filters.dividendYield === 'over_1' && yield_pct <= 1) return false
    if (filters.dividendYield === 'over_2' && yield_pct <= 2) return false
    if (filters.dividendYield === 'over_4' && yield_pct <= 4) return false
  }

  // Revenue Growth filter (YoY)
  if (filters.revenueGrowth !== 'any') {
    if (row.revenueGrowth === null || row.revenueGrowth === undefined) return false
    const growth_pct = row.revenueGrowth * 100 // convert decimal to percentage
    if (filters.revenueGrowth === 'positive' && growth_pct <= 0) return false
    if (filters.revenueGrowth === 'over_10' && growth_pct <= 10) return false
    if (filters.revenueGrowth === 'over_20' && growth_pct <= 20) return false
    if (filters.revenueGrowth === 'negative' && growth_pct >= 0) return false
  }

  return true
}
