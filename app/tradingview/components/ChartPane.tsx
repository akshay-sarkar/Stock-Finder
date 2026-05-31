'use client'

import React, { useEffect, useRef, useCallback, useState } from 'react'
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
  LineStyle,
  type IChartApi,
  type ISeriesApi,
  type Time,
} from 'lightweight-charts'
import { useMarketData } from '@/lib/tradingview/useMarketData'
import { computeRSI, computeMACD, computeBB, computeWilliamsR, type Bar } from '@/lib/tradingview/indicators'
import { computeVolumeProfile, detectFVGs } from '@/lib/tradingview/volumeProfile'
import { FVGPrimitive } from '@/lib/tradingview/chartPrimitives'
import { PaneControls, type PaneConfig } from './PaneControls'

export type { PaneConfig }

// ── Pane height persistence ────────────────────────────────────────────────
const PANE_HEIGHT_KEYS = {
  rsi:  'sf-tv-rsi-height',
  macd: 'sf-tv-macd-height',
  wr:   'sf-tv-wr-height',
} as const

function readPaneHeight(key: string, fallback: number): number {
  if (typeof window === 'undefined') return fallback
  try {
    const v = localStorage.getItem(key)
    return v ? Math.max(60, parseInt(v, 10)) : fallback
  } catch { return fallback }
}

function savePaneHeight(key: string, h: number) {
  try { localStorage.setItem(key, String(h)) } catch {}
}

interface Props {
  config: PaneConfig
  onConfigChange: (config: PaneConfig) => void
}

const DARK_THEME = {
  layout: { background: { color: '#0f172a' }, textColor: '#94a3b8' },
  grid: { vertLines: { color: '#1e293b' }, horzLines: { color: '#1e293b' } },
  crosshair: { vertLine: { color: '#475569' }, horzLine: { color: '#475569' } },
  timeScale: { borderColor: '#334155' },
  rightPriceScale: { borderColor: '#334155' },
}

const t = (n: number) => n as unknown as Time

function flashTickerBar(el: HTMLDivElement, bar: Bar) {
  const cls = bar.close >= bar.open ? 'flash-green' : 'flash-red'
  el.classList.remove('flash-green', 'flash-red')
  void el.offsetWidth
  el.classList.add(cls)
}

export const ChartPane = React.memo(function ChartPane({ config, onConfigChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const tickerBarRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candleRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const rsiRef = useRef<ISeriesApi<'Line'> | null>(null)
  const rsiOversoldBandRef   = useRef<ISeriesApi<'Histogram'> | null>(null)
  const rsiOverboughtBandRef = useRef<ISeriesApi<'Histogram'> | null>(null)
  const macdLineRef = useRef<ISeriesApi<'Line'> | null>(null)
  const macdSignalRef = useRef<ISeriesApi<'Line'> | null>(null)
  const macdHistRef = useRef<ISeriesApi<'Histogram'> | null>(null)
  const wrRef = useRef<ISeriesApi<'Line'> | null>(null)
  const bbUpperRef = useRef<ISeriesApi<'Line'> | null>(null)
  const bbMiddleRef = useRef<ISeriesApi<'Line'> | null>(null)
  const bbLowerRef = useRef<ISeriesApi<'Line'> | null>(null)
  const fvgRef = useRef<FVGPrimitive | null>(null)

  // Track which pane index each indicator occupies so we can poll their heights
  const rsiPaneIdxRef  = useRef<number>(-1)
  const macdPaneIdxRef = useRef<number>(-1)
  const wrPaneIdxRef   = useRef<number>(-1)

  // Company name returned by the API alongside bar data
  const [companyName, setCompanyName] = useState('')

  // Persists across chart recreations (indicator toggles)
  const barsRef = useRef<Bar[]>([])


  // Chart recreated only when indicator layout or data source changes.
  // VP/FVG toggles don't add new panes so they don't need recreation.
  const chartKey = [
    config.source, config.symbol, config.interval,
    config.showRSI, config.showMACD, config.showWR, config.showBB,
  ].join('|')

  // Captured in a ref so the chart-init effect can call it without stale closure
  const applyIndicatorsRef = useRef<(bars: Bar[]) => void>(() => {})

  useEffect(() => {
    if (!containerRef.current) return

    candleRef.current = null; rsiRef.current = null
    rsiOversoldBandRef.current = null; rsiOverboughtBandRef.current = null
    macdLineRef.current = null; macdSignalRef.current = null; macdHistRef.current = null
    wrRef.current = null
    bbUpperRef.current = null; bbMiddleRef.current = null; bbLowerRef.current = null
    fvgRef.current = null
    rsiPaneIdxRef.current = -1; macdPaneIdxRef.current = -1; wrPaneIdxRef.current = -1

    const chart = createChart(containerRef.current, { ...DARK_THEME, autoSize: true })
    chartRef.current = chart

    candleRef.current = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e', downColor: '#ef4444',
      borderUpColor: '#22c55e', borderDownColor: '#ef4444',
      wickUpColor: '#22c55e', wickDownColor: '#ef4444',
    })

    if (config.showBB) {
      bbUpperRef.current = chart.addSeries(LineSeries, {
        color: '#f59e0b', lineWidth: 1, lineStyle: LineStyle.Dashed,
        priceLineVisible: false, lastValueVisible: false,
      })
      bbMiddleRef.current = chart.addSeries(LineSeries, {
        color: 'rgba(245,158,11,0.4)', lineWidth: 1,
        priceLineVisible: false, lastValueVisible: false,
      })
      bbLowerRef.current = chart.addSeries(LineSeries, {
        color: '#f59e0b', lineWidth: 1, lineStyle: LineStyle.Dashed,
        priceLineVisible: false, lastValueVisible: false,
      })
    }

    let nextPane = 1

    if (config.showRSI) {
      const pane = nextPane++

      // ── Neutral zone fill: 30 → 70 ────────────────────────────────────────
      // Drawn first so RSI line renders on top
      rsiOversoldBandRef.current = chart.addSeries(HistogramSeries, {
        color: 'rgba(148,163,184,0.15)', base: 30,
        priceLineVisible: false, lastValueVisible: false,
      }, pane)
      // rsiOverboughtBandRef unused for now (neutral zone uses one series)
      rsiOverboughtBandRef.current = null

      // ── RSI line ────────────────────────────────────────────────────────────
      rsiRef.current = chart.addSeries(LineSeries, {
        color: '#a78bfa', lineWidth: 2, priceLineVisible: false,
      }, pane)

      // ── Reference lines at 30, 50, 70 ──────────────────────────────────────
      rsiRef.current.createPriceLine({
        price: 70, color: '#ef4444', lineWidth: 1,
        lineStyle: LineStyle.Dashed, axisLabelVisible: true, title: '',
      })
      rsiRef.current.createPriceLine({
        price: 50, color: '#334155', lineWidth: 1,
        lineStyle: LineStyle.Dotted, axisLabelVisible: false, title: '',
      })
      rsiRef.current.createPriceLine({
        price: 30, color: '#22c55e', lineWidth: 1,
        lineStyle: LineStyle.Dashed, axisLabelVisible: true, title: '',
      })

      rsiPaneIdxRef.current = pane
    }

    if (config.showMACD) {
      const pane = nextPane++
      macdLineRef.current = chart.addSeries(LineSeries, { color: '#60a5fa', lineWidth: 1, priceLineVisible: false }, pane)
      macdSignalRef.current = chart.addSeries(LineSeries, { color: '#fb923c', lineWidth: 1, priceLineVisible: false }, pane)
      macdHistRef.current = chart.addSeries(HistogramSeries, { color: '#34d399', priceLineVisible: false }, pane)
      macdPaneIdxRef.current = pane
    }

    if (config.showWR) {
      const pane = nextPane++
      wrRef.current = chart.addSeries(LineSeries, { color: '#f472b6', lineWidth: 1, priceLineVisible: false }, pane)
      wrPaneIdxRef.current = pane
    }

    if (config.showFVG && candleRef.current) {
      const prim = new FVGPrimitive()
      fvgRef.current = prim
      candleRef.current.attachPrimitive(prim)
    }

    // Reapply cached bars immediately — preserves data when indicator is toggled
    const cached = barsRef.current
    if (cached.length > 0 && candleRef.current) {
      candleRef.current.setData(cached.map(b => ({ time: t(b.time), open: b.open, high: b.high, low: b.low, close: b.close })))
      applyIndicatorsRef.current(cached)
    }

    // ── Restore saved pane heights after chart has fully laid out ────────────
    // A small delay is needed because lightweight-charts re-calculates layout
    // after series data is set, which can override heights set during init.
    const restoreTimer = setTimeout(() => {
      const panes = chart.panes()
      const rsiIdx  = rsiPaneIdxRef.current
      const macdIdx = macdPaneIdxRef.current
      const wrIdx   = wrPaneIdxRef.current
      if (rsiIdx  >= 0 && panes[rsiIdx])  panes[rsiIdx].setHeight(readPaneHeight(PANE_HEIGHT_KEYS.rsi,  110))
      if (macdIdx >= 0 && panes[macdIdx]) panes[macdIdx].setHeight(readPaneHeight(PANE_HEIGHT_KEYS.macd, 80))
      if (wrIdx   >= 0 && panes[wrIdx])   panes[wrIdx].setHeight(readPaneHeight(PANE_HEIGHT_KEYS.wr,   80))
    }, 150)

    // ── Save heights on mouseup (fires after user drags a pane separator) ────
    // More accurate than polling — only saves when a drag interaction ends.
    function snapshotHeights() {
      const panes = chart.panes()
      const rsiIdx  = rsiPaneIdxRef.current
      const macdIdx = macdPaneIdxRef.current
      const wrIdx   = wrPaneIdxRef.current
      if (rsiIdx  >= 0 && panes[rsiIdx])  savePaneHeight(PANE_HEIGHT_KEYS.rsi,  panes[rsiIdx].getHeight())
      if (macdIdx >= 0 && panes[macdIdx]) savePaneHeight(PANE_HEIGHT_KEYS.macd, panes[macdIdx].getHeight())
      if (wrIdx   >= 0 && panes[wrIdx])   savePaneHeight(PANE_HEIGHT_KEYS.wr,   panes[wrIdx].getHeight())
    }
    const el = containerRef.current
    el?.addEventListener('mouseup', snapshotHeights)

    return () => {
      clearTimeout(restoreTimer)
      el?.removeEventListener('mouseup', snapshotHeights)
      snapshotHeights()   // save final heights before chart is destroyed
      chart.remove()
      chartRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartKey])

  const applyIndicators = useCallback((bars: Bar[]) => {
    if (bars.length === 0) return

    if (rsiRef.current) {
      const data = computeRSI(bars)
      rsiRef.current.setData(data.map(d => ({ time: t(d.time), value: d.value })))
      // Neutral zone fill: base=30, value=70 → fills 30 → 70
      rsiOversoldBandRef.current?.setData(
        data.map(d => ({ time: t(d.time), value: 70 }))
      )
    }

    if (macdLineRef.current && macdSignalRef.current && macdHistRef.current) {
      const data = computeMACD(bars)
      macdLineRef.current.setData(data.map(d => ({ time: t(d.time), value: d.macd })))
      macdSignalRef.current.setData(data.map(d => ({ time: t(d.time), value: d.signal })))
      macdHistRef.current.setData(data.map(d => ({
        time: t(d.time), value: d.histogram,
        color: d.histogram >= 0 ? '#34d399' : '#f87171',
      })))
    }

    if (bbUpperRef.current && bbMiddleRef.current && bbLowerRef.current) {
      const data = computeBB(bars)
      bbUpperRef.current.setData(data.map(d => ({ time: t(d.time), value: d.upper })))
      bbMiddleRef.current.setData(data.map(d => ({ time: t(d.time), value: d.middle })))
      bbLowerRef.current.setData(data.map(d => ({ time: t(d.time), value: d.lower })))
    }

    if (wrRef.current) {
      const data = computeWilliamsR(bars)
      wrRef.current.setData(data.map(d => ({ time: t(d.time), value: d.value })))
    }

    if (config.showVP && candleRef.current) {
      const vp = computeVolumeProfile(bars)
      if (vp) {
        candleRef.current.createPriceLine({ price: vp.poc, color: '#f59e0b', lineWidth: 2, lineStyle: LineStyle.Dashed, title: 'POC' })
        candleRef.current.createPriceLine({ price: vp.vah, color: '#22c55e', lineWidth: 1, lineStyle: LineStyle.Dotted, title: 'VAH' })
        candleRef.current.createPriceLine({ price: vp.val, color: '#ef4444', lineWidth: 1, lineStyle: LineStyle.Dotted, title: 'VAL' })
      }
    }

    if (fvgRef.current && bars.length > 0) {
      fvgRef.current.updateData(detectFVGs(bars), bars[bars.length - 1].time)
    }
  }, [config.showVP])

  // Keep ref in sync so chart-init effect can call latest version
  useEffect(() => { applyIndicatorsRef.current = applyIndicators }, [applyIndicators])

  const handleHistoryLoaded = useCallback((bars: Bar[]) => {
    barsRef.current = bars  // persist for chart recreations
    if (!candleRef.current) return
    candleRef.current.setData(bars.map(b => ({ time: t(b.time), open: b.open, high: b.high, low: b.low, close: b.close })))
    applyIndicators(bars)
  }, [applyIndicators])

  const handleBar = useCallback((bar: Bar) => {
    if (!candleRef.current) return
    candleRef.current.update({ time: t(bar.time), open: bar.open, high: bar.high, low: bar.low, close: bar.close })
    if (tickerBarRef.current) flashTickerBar(tickerBarRef.current, bar)
  }, [])

  // Clear name whenever the symbol changes so stale name doesn't flash
  useEffect(() => { setCompanyName('') }, [config.symbol, config.source])

  useMarketData({
    source: config.source,
    symbol: config.symbol,
    interval: config.interval,
    onHistoryLoaded: handleHistoryLoaded,
    onBar: handleBar,
    onNameLoaded: setCompanyName,
  })

  const handleChange = useCallback((patch: Partial<PaneConfig>) => {
    onConfigChange({ ...config, ...patch })
  }, [config, onConfigChange])

  return (
    <div className="flex flex-col h-full min-h-0 bg-slate-900 border border-slate-700">
      <PaneControls config={config} onChange={handleChange} />
      <div
        ref={tickerBarRef}
        className="flex items-center gap-2 px-2 py-0.5 bg-slate-900 text-xs select-none"
      >
        <span className="font-bold text-white">{config.symbol}</span>
        {companyName && (
          <span className="text-slate-400 truncate max-w-[200px]">{companyName}</span>
        )}
        <span className="text-slate-600">{config.interval}</span>
        <span className="text-slate-700 text-xs">{config.source}</span>
      </div>
      <div ref={containerRef} className="flex-1 min-h-0" />
    </div>
  )
})
