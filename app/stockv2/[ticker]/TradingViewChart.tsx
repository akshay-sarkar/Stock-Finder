'use client'

import { useState, useMemo } from 'react'

const STUDY_OPTIONS = [
  { ids: ['Volume@tv-basicstudies'],                                   label: 'Volume' },
  { ids: ['RSI@tv-basicstudies'],                                      label: 'RSI' },
  { ids: ['MACD@tv-basicstudies'],                                     label: 'MACD' },
  { ids: ['BB@tv-basicstudies'],                                       label: 'BB Band' },
  { ids: ['MAExp@tv-basicstudies', 'MASimple@tv-basicstudies'],        label: 'EMA 9 / SMA 20' },
]

const DEFAULT_STUDIES = [
  'Volume@tv-basicstudies',
  'RSI@tv-basicstudies',
  'MACD@tv-basicstudies',
  'BB@tv-basicstudies',
]

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
    () => new Set(DEFAULT_STUDIES)
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

  const toggleStudy = (ids: string[]) => {
    setActiveStudies((prev) => {
      const next = new Set(prev)
      const allOn = ids.every((id) => next.has(id))
      if (allOn) ids.forEach((id) => next.delete(id))
      else ids.forEach((id) => next.add(id))
      return next
    })
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-4 py-2 border-b border-gray-100 flex flex-wrap gap-2 items-center">
        {/* Interval */}
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

        {/* Indicators */}
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide mr-1">Indicators</span>
        {STUDY_OPTIONS.map((opt) => {
          const active = opt.ids.every((id) => activeStudies.has(id))
          return (
            <button
              key={opt.ids.join('+')}
              onClick={() => toggleStudy(opt.ids)}
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
        style={{ width: '100%', height: 780, border: 'none', display: 'block' }}
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
