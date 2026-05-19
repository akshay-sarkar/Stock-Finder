'use client'
import { useHyperliquidWs } from './useHyperliquidWs'
import { useStockData } from './useStockData'
import type { Bar } from './indicators'

interface Config {
  source: 'stock' | 'crypto'
  symbol: string
  interval: string
  onHistoryLoaded: (bars: Bar[]) => void
  onBar: (bar: Bar) => void
}

const NOOP = () => {}

export function useMarketData({ source, symbol, interval, onHistoryLoaded, onBar }: Config) {
  const isStock = source === 'stock'

  // Both hooks always called (rules of hooks). The inactive one gets '__skip__' symbol and no-ops.
  useStockData({
    symbol: isStock ? symbol : '__skip__',
    interval,
    onHistoryLoaded: isStock ? onHistoryLoaded : NOOP,
    onBar: isStock ? onBar : NOOP,
  })

  useHyperliquidWs({
    symbol: !isStock ? symbol : '__skip__',
    interval,
    onHistoryLoaded: !isStock ? onHistoryLoaded : NOOP,
    onBar: !isStock ? onBar : NOOP,
  })
}
