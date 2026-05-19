'use client'

import React, { useEffect, useRef, useCallback } from 'react'
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
  const macdLineRef = useRef<ISeriesApi<'Line'> | null>(null)
  const macdSignalRef = useRef<ISeriesApi<'Line'> | null>(null)
  const macdHistRef = useRef<ISeriesApi<'Histogram'> | null>(null)
  const wrRef = useRef<ISeriesApi<'Line'> | null>(null)
  const bbUpperRef = useRef<ISeriesApi<'Line'> | null>(null)
  const bbMiddleRef = useRef<ISeriesApi<'Line'> | null>(null)
  const bbLowerRef = useRef<ISeriesApi<'Line'> | null>(null)
  const fvgRef = useRef<FVGPrimitive | null>(null)

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
    macdLineRef.current = null; macdSignalRef.current = null; macdHistRef.current = null
    wrRef.current = null
    bbUpperRef.current = null; bbMiddleRef.current = null; bbLowerRef.current = null
    fvgRef.current = null

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
      rsiRef.current = chart.addSeries(LineSeries, { color: '#a78bfa', lineWidth: 1, priceLineVisible: false }, pane)
      chart.panes()[pane]?.setHeight(80)
    }

    if (config.showMACD) {
      const pane = nextPane++
      macdLineRef.current = chart.addSeries(LineSeries, { color: '#60a5fa', lineWidth: 1, priceLineVisible: false }, pane)
      macdSignalRef.current = chart.addSeries(LineSeries, { color: '#fb923c', lineWidth: 1, priceLineVisible: false }, pane)
      macdHistRef.current = chart.addSeries(HistogramSeries, { color: '#34d399', priceLineVisible: false }, pane)
      chart.panes()[pane]?.setHeight(80)
    }

    if (config.showWR) {
      const pane = nextPane++
      wrRef.current = chart.addSeries(LineSeries, { color: '#f472b6', lineWidth: 1, priceLineVisible: false }, pane)
      chart.panes()[pane]?.setHeight(80)
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

    return () => { chart.remove(); chartRef.current = null }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartKey])

  const applyIndicators = useCallback((bars: Bar[]) => {
    if (bars.length === 0) return

    if (rsiRef.current) {
      const data = computeRSI(bars)
      rsiRef.current.setData(data.map(d => ({ time: t(d.time), value: d.value })))
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

  useMarketData({
    source: config.source,
    symbol: config.symbol,
    interval: config.interval,
    onHistoryLoaded: handleHistoryLoaded,
    onBar: handleBar,
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
        <span className="text-slate-500">{config.interval}</span>
        <span className="text-slate-600 text-xs">{config.source}</span>
      </div>
      <div ref={containerRef} className="flex-1 min-h-0" />
    </div>
  )
})
