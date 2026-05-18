'use client'

import { useState, useMemo } from 'react'

const STUDY_OPTIONS = [
  { id: 'Volume@tv-basicstudies', label: 'Volume' },
  { id: 'RSI@tv-basicstudies', label: 'RSI' },
  { id: 'MACD@tv-basicstudies', label: 'MACD' },
  { id: 'BB@tv-basicstudies', label: 'Bollinger Bands' },
  { id: 'MAExp@tv-basicstudies', label: 'EMA 20' },
  { id: 'MASimple@tv-basicstudies', label: 'SMA 50' },
  { id: 'StochasticRSI@tv-basicstudies', label: 'Stoch RSI' },
  { id: 'ATR@tv-basicstudies', label: 'ATR' },
] as const

const INTERVALS = [
  { value: '60', label: '1H' },
  { value: 'D',  label: '1D' },
  { value: 'W',  label: '1W' },
] as const

type Interval = typeof INTERVALS[number]['value']

const YAHOO_TO_TV_EXCHANGE: Record<string, string> = {
  NMS: 'NASDAQ',
  NGM: 'NASDAQ',
  NCM: 'NASDAQ',
  NYQ: 'NYSE',
  ASE: 'AMEX',
  PCX: 'NYSE',
  BTS: 'NYSE',
  PNK: 'OTC',
}

interface TradingViewChartProps {
  ticker: string
  exchange: string
}

export function TradingViewChart({ ticker, exchange }: TradingViewChartProps) {
  const [activeStudies, setActiveStudies] = useState<Set<string>>(
    () => new Set(['Volume@tv-basicstudies', 'RSI@tv-basicstudies', 'MACD@tv-basicstudies'])
  )
  const [interval, setInterval] = useState<Interval>('D')

  const tvExchange = YAHOO_TO_TV_EXCHANGE[exchange] ?? exchange
  const tvSymbol = `${tvExchange}:${ticker}`

  const iframeSrc = useMemo(() => {
    const settings = {
      symbol: tvSymbol,
      interval,
      timezone: 'America/New_York',
      theme: 'light',
      style: '1',
      locale: 'en',
      enable_publishing: false,
      allow_symbol_change: false,
      hide_side_toolbar: false,
      studies: Array.from(activeStudies),
      utm_source: 'localhost',
      utm_medium: 'widget_new',
      utm_campaign: 'advanced-chart',
    }
    const hash = encodeURIComponent(JSON.stringify(settings))
    return `https://www.tradingview-widget.com/embed-widget/advanced-chart/?locale=en#${hash}`
  }, [tvSymbol, interval, activeStudies])

  const toggleStudy = (id: string) => {
    setActiveStudies((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Controls bar */}
      <div className="px-4 py-2 border-b border-gray-100 flex flex-wrap gap-2 items-center">
        {/* Interval buttons */}
        <div className="flex gap-1 mr-3 border-r border-gray-200 pr-3">
          {INTERVALS.map((iv) => (
            <button
              key={iv.value}
              onClick={() => setInterval(iv.value)}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                interval === iv.value
                  ? 'bg-slate-800 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {iv.label}
            </button>
          ))}
        </div>

        {/* Indicator toggles */}
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide mr-1">Indicators</span>
        {STUDY_OPTIONS.map((opt) => {
          const active = activeStudies.has(opt.id)
          return (
            <button
              key={opt.id}
              onClick={() => toggleStudy(opt.id)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                active
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-white border-gray-300 text-gray-600 hover:border-blue-400 hover:text-blue-600'
              }`}
            >
              {opt.label}
            </button>
          )
        })}
      </div>

      <iframe
        key={iframeSrc}
        src={iframeSrc}
        style={{ width: '100%', height: 680, border: 'none', display: 'block' }}
        allowTransparency
        title={`${ticker} chart`}
        lang="en"
      />

      <div className="px-4 py-1.5 border-t border-gray-100 text-right">
        <a
          href="https://www.tradingview.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          Charts by TradingView
        </a>
      </div>
    </div>
  )
}
