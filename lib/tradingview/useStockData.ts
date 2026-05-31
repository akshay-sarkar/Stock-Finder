'use client'
import { useEffect, useRef } from 'react'
import type { Bar } from './indicators'

interface Config {
  symbol: string
  interval: string
  onHistoryLoaded: (bars: Bar[]) => void
  onBar: (bar: Bar) => void
  onNameLoaded?: (name: string) => void
}

export function useStockData({ symbol, interval, onHistoryLoaded, onBar, onNameLoaded }: Config) {
  const onHistoryRef = useRef(onHistoryLoaded)
  const onBarRef = useRef(onBar)
  const onNameRef = useRef(onNameLoaded)
  const lastBarsRef = useRef<Bar[]>([])
  useEffect(() => { onHistoryRef.current = onHistoryLoaded }, [onHistoryLoaded])
  useEffect(() => { onBarRef.current = onBar }, [onBar])
  useEffect(() => { onNameRef.current = onNameLoaded }, [onNameLoaded])

  useEffect(() => {
    if (!symbol || symbol === '__skip__') return

    let cancelled = false

    fetch(`/api/tradingview/stock/${symbol}?interval=${interval}`)
      .then(r => r.json())
      .then((data: { bars?: Bar[]; name?: string; error?: string }) => {
        if (cancelled || !data.bars) return
        lastBarsRef.current = data.bars
        onHistoryRef.current(data.bars)
        if (data.name) onNameRef.current?.(data.name)
      })
      .catch(e => console.error('[stock history]', e))

    const poll = async () => {
      if (cancelled) return
      try {
        const r = await fetch(`/api/tradingview/stock/${symbol}/quote`)
        const data: { price?: number; time?: number } = await r.json()
        if (cancelled || !data.price) return

        const bars = lastBarsRef.current
        if (bars.length === 0) return
        const last = bars[bars.length - 1]
        onBarRef.current({
          ...last,
          close: data.price,
          high: Math.max(last.high, data.price),
          low: Math.min(last.low, data.price),
        })
      } catch {}
    }

    const timer = setInterval(poll, 60_000)

    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [symbol, interval])
}
