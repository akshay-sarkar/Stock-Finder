import type { FilterCriteria, ScreenerRow, IndicatorValues } from './types'
import { generateSignals, getMaStatus } from './indicators'

export function buildScreenerRow(
  ticker: string,
  price: number,
  change: number,
  changePercent: number,
  ind: IndicatorValues
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

  return true
}
