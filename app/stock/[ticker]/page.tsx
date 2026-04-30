'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { isValidTicker } from '@/lib/validation'
import type { StockDetailData, EarningsData, AnalystData, NewsItem, FinancialsData } from '@/lib/types'
import {
  StockHeader,
  QuickStatsBar,
  RangeSelector,
  IndicatorSummaryCards,
  VolumeChart,
  PriceChart,
  RSIChart,
  MACDChart,
  LatestIndicatorsTable,
  EarningsWidget,
  ShortInterestWidget,
  FinancialsWidget,
  FundamentalsSection,
  NewsWidget,
  type Range,
  DATE_RANGES,
} from '../components'

export default function StockPage() {
  const params = useParams()
  const router = useRouter()
  const ticker = (params?.ticker as string)?.toUpperCase() ?? ''

  const [data, setData] = useState<StockDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [range, setRange] = useState<Range>(DATE_RANGES[3])
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const [earnings, setEarnings] = useState<EarningsData | null>(null)
  const [analyst, setAnalyst] = useState<AnalystData | null>(null)
  const [news, setNews] = useState<NewsItem[] | null>(null)
  const [showNews, setShowNews] = useState(false)
  const [financials, setFinancials] = useState<FinancialsData | null>(null)

  // Chart overlay toggles (persisted to localStorage)
  const [showBB, setShowBB] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('sf-chart-bb') === 'true'
  })
  const [showEMA20, setShowEMA20] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true
    return localStorage.getItem('sf-chart-ema20') !== 'false'
  })
  const [showSMA50, setShowSMA50] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true
    return localStorage.getItem('sf-chart-sma50') !== 'false'
  })
  const [showSMA200, setShowSMA200] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true
    return localStorage.getItem('sf-chart-sma200') !== 'false'
  })
  const [showEMA9, setShowEMA9] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('sf-chart-ema9') === 'true'
  })
  const [showSMA20, setShowSMA20] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('sf-chart-sma20') === 'true'
  })

  const toggleBB = () =>
    setShowBB((prev) => {
      const next = !prev
      localStorage.setItem('sf-chart-bb', String(next))
      return next
    })
  const toggleEMA20 = () =>
    setShowEMA20((prev) => {
      const next = !prev
      localStorage.setItem('sf-chart-ema20', String(next))
      return next
    })
  const toggleSMA50 = () =>
    setShowSMA50((prev) => {
      const next = !prev
      localStorage.setItem('sf-chart-sma50', String(next))
      return next
    })
  const toggleSMA200 = () =>
    setShowSMA200((prev) => {
      const next = !prev
      localStorage.setItem('sf-chart-sma200', String(next))
      return next
    })
  const toggleEMA9 = () =>
    setShowEMA9((prev) => {
      const next = !prev
      localStorage.setItem('sf-chart-ema9', String(next))
      return next
    })
  const toggleSMA20 = () =>
    setShowSMA20((prev) => {
      const next = !prev
      localStorage.setItem('sf-chart-sma20', String(next))
      return next
    })

  // Guard: redirect to home if ticker is invalid
  useEffect(() => {
    if (ticker && !isValidTicker(ticker)) {
      router.replace('/')
    }
  }, [ticker, router])

  // Fetch earnings
  useEffect(() => {
    if (!ticker || !isValidTicker(ticker)) return
    fetch(`/api/earnings/${ticker}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) setEarnings(d)
      })
      .catch(() => {})
  }, [ticker])

  // Fetch analyst data
  useEffect(() => {
    if (!ticker || !isValidTicker(ticker)) return
    fetch(`/api/analyst/${ticker}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) setAnalyst(d)
      })
      .catch(() => {})
  }, [ticker])

  // Fetch news
  useEffect(() => {
    if (!ticker || !isValidTicker(ticker)) return
    fetch(`/api/news/${ticker}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) setNews(d.items)
      })
      .catch(() => {})
  }, [ticker])

  // Fetch financials
  useEffect(() => {
    if (!ticker || !isValidTicker(ticker)) return
    fetch(`/api/financials/${ticker}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) setFinancials(d)
      })
      .catch(() => {})
  }, [ticker])

  // Fetch main stock data
  const fetchData = useCallback((r: Range) => {
    if (!ticker || !isValidTicker(ticker)) return
    setLoading(true)
    setError(null)
    const url = `/api/stock/${ticker}?days=${r.fetchDays}&interval=${r.interval}&display=${r.displayPoints}`
    fetch(url)
      .then((res) => res.json())
      .then((d) => {
        if (d.error) throw new Error(d.error)
        setData(d)
        setLastUpdated(new Date())
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [ticker])

  useEffect(() => {
    fetchData(range)
  }, [fetchData, range])

  if (loading) {
    return (
      <>
        <div className="bg-slate-900 text-white shadow-lg sticky top-0 z-50">
          <div className="px-4 py-4 text-slate-300 font-semibold">{ticker}</div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <svg className="animate-spin h-8 w-8 text-blue-500 mx-auto mb-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <p className="text-gray-500 text-sm">Loading {ticker} ({range.label})…</p>
            {range.label === '5Y' && <p className="text-gray-400 text-xs mt-1">5Y weekly fetch may take a few seconds</p>}
          </div>
        </div>
      </>
    )
  }

  if (error || !data) {
    return (
      <>
        <div className="bg-slate-900 text-white shadow-lg sticky top-0 z-50">
          <div className="px-4 py-4 text-slate-300 font-semibold">{ticker}</div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error ?? 'Failed to load data'}</p>
            <button onClick={() => router.push('/')} className="text-blue-600 hover:underline text-sm">
              ← Back to Screener
            </button>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <StockHeader ticker={ticker} data={data} />

      {data.fundamentals && (
        <QuickStatsBar
          fundamentals={data.fundamentals}
          currentPrice={data.currentPrice}
          lastUpdated={lastUpdated}
        />
      )}

      <main className="px-4 py-4 space-y-4 bg-slate-50 flex-1">
          <RangeSelector
            range={range}
            onRangeChange={setRange}
            showEMA9={showEMA9}
            onToggleEMA9={toggleEMA9}
            showEMA20={showEMA20}
            onToggleEMA20={toggleEMA20}
            showSMA20={showSMA20}
            onToggleSMA20={toggleSMA20}
            showSMA50={showSMA50}
            onToggleSMA50={toggleSMA50}
            showSMA200={showSMA200}
            onToggleSMA200={toggleSMA200}
            showBB={showBB}
            onToggleBB={toggleBB}
          />

          <IndicatorSummaryCards data={data} analyst={analyst} />

          <VolumeChart data={data} />

          <PriceChart
            data={data}
            showEMA9={showEMA9}
            showEMA20={showEMA20}
            showSMA20={showSMA20}
            showSMA50={showSMA50}
            showSMA200={showSMA200}
            showBB={showBB}
          />

          <RSIChart data={data} />

          <MACDChart data={data} />

          {data.fundamentals ? (
            <FundamentalsSection f={data.fundamentals} />
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center text-sm text-gray-400">
              Key statistics not available for this ticker (e.g. ETFs may not have P/E or dividend data).
            </div>
          )}

          {financials && (financials.annual.length > 0 || financials.quarterly.length > 0) ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="text-sm font-semibold text-gray-700 mb-3">Historical Financials</div>
                <FinancialsWidget data={financials} />
              </div>
              {earnings && <EarningsWidget data={earnings} />}
            </div>
          ) : (
            earnings && <EarningsWidget data={earnings} />
          )}

          {data.fundamentals && <ShortInterestWidget fundamentals={data.fundamentals} />}

          {news && news.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <button
                onClick={() => setShowNews((v) => !v)}
                className="w-full flex items-center justify-between text-sm font-semibold text-gray-700"
              >
                <span>Recent News</span>
                <span className="text-gray-400 text-xs font-normal">{showNews ? '▲ collapse' : '▶ expand'}</span>
              </button>
              {showNews && (
                <div className="mt-3">
                  <NewsWidget items={news} />
                </div>
              )}
            </div>
          )}

          <LatestIndicatorsTable data={data} />
        </main>

        <footer className="text-center text-xs text-gray-400 py-3 border-t mt-2">
          Data via Yahoo Finance · Not financial advice · For educational use only
        </footer>
    </>
  )
}
