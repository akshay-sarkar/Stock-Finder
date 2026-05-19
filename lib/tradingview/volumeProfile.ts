import type { Bar } from './indicators'

export interface VPResult {
  poc: number
  vah: number
  val: number
  buckets: { priceMin: number; priceMax: number; volume: number; maxVolume: number }[]
}

export function computeVolumeProfile(bars: Bar[], priceLevels = 24): VPResult | null {
  if (bars.length === 0) return null

  const minPrice = Math.min(...bars.map(b => b.low))
  const maxPrice = Math.max(...bars.map(b => b.high))
  const range = maxPrice - minPrice
  if (range === 0) return null

  const bucketSize = range / priceLevels
  const volumes = new Array<number>(priceLevels).fill(0)

  for (const bar of bars) {
    const barRange = bar.high - bar.low
    if (barRange === 0) {
      const idx = Math.min(Math.floor((bar.close - minPrice) / bucketSize), priceLevels - 1)
      volumes[idx] += bar.volume
      continue
    }
    for (let i = 0; i < priceLevels; i++) {
      const bucketLow = minPrice + i * bucketSize
      const bucketHigh = bucketLow + bucketSize
      const overlap = Math.max(0, Math.min(bar.high, bucketHigh) - Math.max(bar.low, bucketLow))
      volumes[i] += bar.volume * (overlap / barRange)
    }
  }

  const maxVol = Math.max(...volumes)
  const pocIdx = volumes.indexOf(maxVol)
  const poc = minPrice + (pocIdx + 0.5) * bucketSize

  const totalVol = volumes.reduce((a, b) => a + b, 0)
  const targetVol = totalVol * 0.7
  let vaLow = pocIdx
  let vaHigh = pocIdx
  let vaVol = volumes[pocIdx]

  while (vaVol < targetVol) {
    const nextLow = vaLow > 0 ? volumes[vaLow - 1] : 0
    const nextHigh = vaHigh < priceLevels - 1 ? volumes[vaHigh + 1] : 0
    if (nextHigh >= nextLow && vaHigh < priceLevels - 1) vaVol += volumes[++vaHigh]
    else if (vaLow > 0) vaVol += volumes[--vaLow]
    else break
    if (vaLow === 0 && vaHigh === priceLevels - 1) break
  }

  return {
    poc,
    vah: minPrice + (vaHigh + 1) * bucketSize,
    val: minPrice + vaLow * bucketSize,
    buckets: volumes.map((volume, i) => ({
      priceMin: minPrice + i * bucketSize,
      priceMax: minPrice + (i + 1) * bucketSize,
      volume,
      maxVolume: maxVol,
    })),
  }
}

export interface FVG {
  type: 'bullish' | 'bearish'
  topPrice: number
  bottomPrice: number
  startTime: number
}

export function detectFVGs(bars: Bar[]): FVG[] {
  const fvgs: FVG[] = []
  for (let i = 0; i < bars.length - 2; i++) {
    const prev = bars[i]
    const next = bars[i + 2]
    if (prev.high < next.low) {
      fvgs.push({ type: 'bullish', bottomPrice: prev.high, topPrice: next.low, startTime: bars[i + 1].time })
    }
    if (prev.low > next.high) {
      fvgs.push({ type: 'bearish', bottomPrice: next.high, topPrice: prev.low, startTime: bars[i + 1].time })
    }
  }
  return fvgs.filter(fvg => {
    const startIdx = bars.findIndex(b => b.time >= fvg.startTime)
    if (startIdx === -1) return false
    for (let i = startIdx; i < bars.length; i++) {
      if (fvg.type === 'bullish' && bars[i].low <= fvg.bottomPrice) return false
      if (fvg.type === 'bearish' && bars[i].high >= fvg.topPrice) return false
    }
    return true
  }).slice(-20)
}
