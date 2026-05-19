/* eslint-disable @typescript-eslint/no-explicit-any */
import { RSI, MACD, BollingerBands, WilliamsR } from 'technicalindicators'

export interface Bar {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export function computeRSI(bars: Bar[], period = 14): { time: number; value: number }[] {
  const values = bars.map(b => b.close)
  const results: number[] = RSI.calculate({ period, values })
  const offset = bars.length - results.length
  return results.map((value, i) => ({ time: bars[offset + i].time, value }))
}

export interface MACDPoint {
  time: number
  macd: number
  signal: number
  histogram: number
}

export function computeMACD(bars: Bar[]): MACDPoint[] {
  const values = bars.map(b => b.close)
  const results: any[] = MACD.calculate({
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    values,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  })
  const offset = bars.length - results.length
  return results.map((r, i) => ({
    time: bars[offset + i].time,
    macd: r.MACD ?? 0,
    signal: r.signal ?? 0,
    histogram: r.histogram ?? 0,
  }))
}

export interface BBPoint {
  time: number
  upper: number
  middle: number
  lower: number
}

export function computeBB(bars: Bar[], period = 20, stdDev = 2): BBPoint[] {
  const values = bars.map(b => b.close)
  const results: any[] = BollingerBands.calculate({ period, stdDev, values })
  const offset = bars.length - results.length
  return results.map((r, i) => ({
    time: bars[offset + i].time,
    upper: r.upper,
    middle: r.middle,
    lower: r.lower,
  }))
}

export function computeWilliamsR(bars: Bar[], period = 14): { time: number; value: number }[] {
  const high = bars.map(b => b.high)
  const low = bars.map(b => b.low)
  const close = bars.map(b => b.close)
  const results: number[] = WilliamsR.calculate({ period, high, low, close })
  const offset = bars.length - results.length
  return results.map((value, i) => ({ time: bars[offset + i].time, value }))
}
