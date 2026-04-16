import { RSI, MACD, SMA, EMA, BollingerBands } from 'technicalindicators'
import type { OHLCVBar, IndicatorValues, ChartPoint } from './types'

type MACDResult = { MACD: number; signal: number; histogram: number }
type BBResult   = { upper: number; middle: number; lower: number; pb: number }

// ─── Latest indicator snapshot (for screener) ──────────────────────────────

export function computeIndicators(data: OHLCVBar[]): IndicatorValues | null {
  if (data.length < 35) return null // not enough data

  const closes = data.map((d) => d.close)
  const volumes = data.map((d) => d.volume)

  // RSI(14)
  const rsiArr = RSI.calculate({ values: closes, period: 14 })
  if (!rsiArr.length) return null
  const rsi = rsiArr[rsiArr.length - 1]

  // MACD(12, 26, 9)
  const macdArr = (MACD.calculate({
    values: closes,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  }) as unknown) as MACDResult[]
  if (macdArr.length < 2) return null
  const cur = macdArr[macdArr.length - 1]
  const prev = macdArr[macdArr.length - 2]

  let macdCrossover: 'bullish' | 'bearish' | 'none' = 'none'
  if (prev.histogram < 0 && cur.histogram >= 0) macdCrossover = 'bullish'
  if (prev.histogram > 0 && cur.histogram <= 0) macdCrossover = 'bearish'

  // Moving Averages
  const sma20Arr = SMA.calculate({ values: closes, period: 20 })
  const sma50Arr = SMA.calculate({ values: closes, period: 50 })
  const sma200Arr = SMA.calculate({ values: closes, period: 200 })
  const ema20Arr = EMA.calculate({ values: closes, period: 20 })

  // Volume
  const recent20 = volumes.slice(-20)
  const avgVolume20 = recent20.reduce((a, b) => a + b, 0) / recent20.length
  const latestVolume = volumes[volumes.length - 1]

  return {
    rsi: round(rsi),
    macd: round(cur.MACD, 4),
    macdSignal: round(cur.signal, 4),
    macdHistogram: round(cur.histogram, 4),
    macdCrossover,
    sma20: round(sma20Arr[sma20Arr.length - 1]),
    sma50: round(sma50Arr[sma50Arr.length - 1]),
    sma200: sma200Arr.length > 0 ? round(sma200Arr[sma200Arr.length - 1]) : null,
    ema20: round(ema20Arr[ema20Arr.length - 1]),
    latestVolume,
    avgVolume20,
    volumeRatio: round(latestVolume / avgVolume20, 2),
  }
}

// ─── Full indicator history for charting ───────────────────────────────────

export function computeIndicatorHistory(data: OHLCVBar[], displayDays = 120): ChartPoint[] {
  const closes  = data.map((d) => d.close)
  const volumes = data.map((d) => d.volume)
  const n = data.length

  const rsiArr     = RSI.calculate({ values: closes, period: 14 })
  const macdArr    = (MACD.calculate({
    values: closes,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  }) as unknown) as MACDResult[]
  const sma20Arr   = SMA.calculate({ values: closes,  period: 20 })
  const sma50Arr   = SMA.calculate({ values: closes,  period: 50 })
  const sma200Arr  = SMA.calculate({ values: closes,  period: 200 })
  const ema20Arr   = EMA.calculate({ values: closes,  period: 20 })
  // Rolling 20-period average of volume — plotted as a dotted reference line on the volume chart
  const volSma20Arr = SMA.calculate({ values: volumes, period: 20 })
  // Bollinger Bands (20, ±2σ)
  const bbArr = (BollingerBands.calculate({ values: closes, period: 20, stdDev: 2 }) as unknown) as BBResult[]

  const points: ChartPoint[] = data.map((bar, i) => {
    return {
      date: bar.date.toISOString().split('T')[0],
      open:  r2(bar.open),
      high:  r2(bar.high),
      low:   r2(bar.low),
      close: r2(bar.close),
      volume:   bar.volume,
      volSma20: getVal(volSma20Arr, i, n),
      sma20:    getVal(sma20Arr,  i, n),
      sma50:    getVal(sma50Arr,  i, n),
      sma200:   getVal(sma200Arr, i, n),
      ema20:    getVal(ema20Arr,  i, n),
      rsi:          getVal(rsiArr, i, n),
      macd:         getMacdVal(macdArr, i, n, 'MACD'),
      macdSignal:   getMacdVal(macdArr, i, n, 'signal'),
      macdHistogram: getMacdVal(macdArr, i, n, 'histogram'),
      bbUpper:  getBBVal(bbArr, i, n, 'upper'),
      bbMiddle: getBBVal(bbArr, i, n, 'middle'),
      bbLower:  getBBVal(bbArr, i, n, 'lower'),
    }
  })

  // Return only the most recent N data points for chart display
  return points.slice(-displayDays)
}

// ─── Signal Generation ─────────────────────────────────────────────────────

export function generateSignals(ind: IndicatorValues, price: number): string[] {
  const signals: string[] = []

  if (ind.rsi < 30) signals.push('Oversold')
  else if (ind.rsi > 70) signals.push('Overbought')

  if (ind.macdCrossover === 'bullish') signals.push('MACD Bull Cross')
  else if (ind.macdCrossover === 'bearish') signals.push('MACD Bear Cross')
  else if (ind.macd > ind.macdSignal) signals.push('MACD Bullish')
  else signals.push('MACD Bearish')

  if (ind.sma200 !== null) {
    const wasBelow = ind.sma50 < ind.sma200
    if (!wasBelow) signals.push('Golden Cross Zone')
    else signals.push('Death Cross Zone')
  }

  if (price > ind.sma50) signals.push('Above SMA50')
  else signals.push('Below SMA50')

  if (ind.volumeRatio >= 2) signals.push('Vol Spike')
  else if (ind.volumeRatio < 0.5) signals.push('Low Volume')

  return signals
}

export function getMaStatus(price: number, sma50: number, sma200: number | null): string {
  if (sma200 !== null) {
    if (sma50 > sma200 && price > sma50) return '🟢 Golden + Above'
    if (sma50 > sma200) return '🟡 Golden Cross'
    if (sma50 < sma200 && price < sma50) return '🔴 Death + Below'
    return '🔴 Death Cross'
  }
  return price > sma50 ? '🟢 Above SMA50' : '🔴 Below SMA50'
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function round(n: number, decimals = 2) {
  return +n.toFixed(decimals)
}

function r2(n: number) {
  return +n.toFixed(2)
}

/** Maps an indicator array value back to the correct data index */
function getVal(arr: number[], dataIdx: number, totalLen: number): number | null {
  const arrStart = totalLen - arr.length
  if (dataIdx < arrStart) return null
  const val = arr[dataIdx - arrStart]
  return val != null ? r2(val) : null
}

function getMacdVal(
  arr: MACDResult[],
  dataIdx: number,
  totalLen: number,
  key: keyof MACDResult
): number | null {
  const arrStart = totalLen - arr.length
  if (dataIdx < arrStart) return null
  const val = arr[dataIdx - arrStart]?.[key]
  return val != null ? +val.toFixed(4) : null
}

function getBBVal(
  arr: BBResult[],
  dataIdx: number,
  totalLen: number,
  key: 'upper' | 'middle' | 'lower'
): number | null {
  const arrStart = totalLen - arr.length
  if (dataIdx < arrStart) return null
  const val = arr[dataIdx - arrStart]?.[key]
  return val != null ? r2(val) : null
}
