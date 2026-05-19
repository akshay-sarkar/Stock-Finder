'use client'
import { useEffect, useRef } from 'react'
import type { Bar } from './indicators'

interface HLCandle {
  t: number; T: number; s: string; i: string
  o: string; c: string; h: string; l: string; v: string; n: number
}

function parseCandle(c: HLCandle): Bar {
  return {
    time: Math.floor(c.t / 1000),
    open: parseFloat(c.o),
    high: parseFloat(c.h),
    low: parseFloat(c.l),
    close: parseFloat(c.c),
    volume: parseFloat(c.v),
  }
}

// Map dashboard interval labels to Hyperliquid interval strings
const HL_INTERVAL: Record<string, string> = {
  '1m': '1m', '5m': '5m', '15m': '15m', '1h': '1h', '4h': '4h', '1d': '1d',
}

interface Config {
  symbol: string
  interval: string
  onHistoryLoaded: (bars: Bar[]) => void
  onBar: (bar: Bar) => void
}

export function useHyperliquidWs({ symbol, interval, onHistoryLoaded, onBar }: Config) {
  const onHistoryRef = useRef(onHistoryLoaded)
  const onBarRef = useRef(onBar)
  useEffect(() => { onHistoryRef.current = onHistoryLoaded }, [onHistoryLoaded])
  useEffect(() => { onBarRef.current = onBar }, [onBar])

  useEffect(() => {
    if (!symbol || symbol === '__skip__') return

    const hlInterval = HL_INTERVAL[interval] ?? '1d'

    // Fetch historical snapshot
    const endTime = Date.now()
    const startTime = endTime - 500 * intervalMs(hlInterval)

    fetch('https://api.hyperliquid.xyz/info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'candleSnapshot', req: { coin: symbol, interval: hlInterval, startTime, endTime } }),
    })
      .then(r => r.json())
      .then((candles: HLCandle[]) => {
        if (!Array.isArray(candles)) return
        const bars = candles.map(parseCandle).sort((a, b) => a.time - b.time)
        onHistoryRef.current(bars)
      })
      .catch(e => console.error('[HL history]', e))

    // Live WebSocket
    const ws = new WebSocket('wss://api.hyperliquid.xyz/ws')

    ws.onopen = () => {
      ws.send(JSON.stringify({ method: 'subscribe', subscription: { type: 'candle', coin: symbol, interval: hlInterval } }))
    }

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string)
        if (msg.channel === 'candle' && msg.data) {
          onBarRef.current(parseCandle(msg.data as HLCandle))
        }
      } catch {}
    }

    ws.onerror = (e) => console.error('[HL WS error]', e)

    return () => { ws.close() }
  }, [symbol, interval])
}

function intervalMs(interval: string): number {
  const map: Record<string, number> = {
    '1m': 60_000, '5m': 300_000, '15m': 900_000, '1h': 3_600_000,
    '4h': 14_400_000, '1d': 86_400_000,
  }
  return map[interval] ?? 86_400_000
}
