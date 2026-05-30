'use client'

import { useState, useEffect, useCallback } from 'react'
import { useLocalStorageBool } from '@/lib/useLocalStorageBool'
import type { StockDetailData, EarningsData, AnalystData, NewsItem, FinancialsData } from '@/lib/types'
import {
  StockHeader,
  QuickStatsBar,
  RelatedStocksStrip,
  RangeSelector,
  VolumeChart,
  PriceChart,
  RSIChart,
  MACDChart,
  LatestIndicatorsTable,
  EarningsWidget,
  AnalystWidget,
  FinancialsWidget,
  FundamentalsSection,
  NewsWidget,
  type Range,
  DATE_RANGES,
} from '../components'

interface StockPageClientProps {
  ticker: string
  initialData: StockDetailData
  initialEarnings: EarningsData | null
  initialAnalyst: AnalystData | null
  initialNews: NewsItem[] | null
  initialFinancials: FinancialsData | null
}

export function StockPageClient({
  ticker,
  initialData,
  initialEarnings,
  initialAnalyst,
  initialNews,
  initialFinancials,
}: StockPageClientProps) {
  const [data, setData] = useState<StockDetailData>(initialData)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [range, setRange] = useState<Range>(DATE_RANGES[3])
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Set initial timestamp after hydration to avoid mismatch
  useEffect(() => {
    setLastUpdated(new Date())
  }, [])

  // Fetch financials in background if not provided server-side
  useEffect(() => {
    if (initialFinancials) return
    const abortController = new AbortController()
    const fetchFinancialsData = async () => {
      try {
        const res = await fetch(`/api/financials/${ticker}`, {
          signal: abortController.signal,
        })
        const data = await res.json()
        setFinancials(data.error ? null : data)
      } catch (e) {
        if ((e as Error).name !== 'AbortError') {
          setFinancials(null)
        }
      } finally {
        setFinancialsLoading(false)
      }
    }
    fetchFinancialsData()
    return () => abortController.abort()
  }, [ticker, initialFinancials])

  const [earnings] = useState<EarningsData | null>(initialEarnings)
  const [analyst] = useState<AnalystData | null>(initialAnalyst)
  const [news] = useState<NewsItem[] | null>(initialNews)
  const [showNews, setShowNews] = useState(false)
  const [financials, setFinancials] = useState<FinancialsData | null>(initialFinancials)
  const [financialsLoading, setFinancialsLoading] = useState(!initialFinancials)

  // Chart overlay toggles (persisted to localStorage, hydration-safe)
  const [showBB,    toggleBB,    setBB]    = useLocalStorageBool('sf-chart-bb',    false)
  const [showEMA20, toggleEMA20, setEMA20] = useLocalStorageBool('sf-chart-ema20', true)
  const [showSMA50, toggleSMA50, setSMA50] = useLocalStorageBool('sf-chart-sma50', true)
  const [showSMA200,toggleSMA200,setSMA200]= useLocalStorageBool('sf-chart-sma200',true)
  const [showEMA9,  toggleEMA9,  setEMA9]  = useLocalStorageBool('sf-chart-ema9',  false)
  const [showSMA20, toggleSMA20, setSMA20] = useLocalStorageBool('sf-chart-sma20', false)

  const toggleAllOverlays = () => {
    const next = !(showBB && showEMA9 && showEMA20 && showSMA20 && showSMA50 && showSMA200)
    setBB(next); setEMA9(next); setEMA20(next); setSMA20(next); setSMA50(next); setSMA200(next)
  }

  const fetchData = useCallback(
    (r: Range) => {
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
    },
    [ticker]
  )

  const handleRangeChange = (newRange: Range) => {
    setRange(newRange)
    fetchData(newRange)
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
            <button onClick={() => window.location.href = '/'} className="text-blue-600 hover:underline text-sm">
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
      <RelatedStocksStrip ticker={ticker} />

      {data.fundamentals && (
        <QuickStatsBar
          fundamentals={data.fundamentals}
          currentPrice={data.currentPrice}
          lastUpdated={lastUpdated}
        />
      )}

      <main className="px-4 py-4 space-y-4 bg-slate-50 flex-1">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <svg className="animate-spin h-8 w-8 text-blue-500 mx-auto mb-2" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <p className="text-gray-500 text-sm">Loading {range.label} data…</p>
            </div>
          </div>
        )}

        {!loading && (
          <>
            {(data || analyst) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <LatestIndicatorsTable data={data} />
                {analyst && <AnalystWidget data={analyst} currentPrice={data.currentPrice} ticker={ticker} />}
              </div>
            )}

            <RangeSelector
              range={range}
              onRangeChange={handleRangeChange}
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
              onToggleAllOverlays={toggleAllOverlays}
            />

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

            {financials || earnings || financialsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {financials ? (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <FinancialsWidget data={financials} ticker={ticker} />
                  </div>
                ) : financialsLoading ? (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <div className="h-32 bg-slate-100 animate-pulse rounded" />
                  </div>
                ) : null}
                {earnings && <EarningsWidget data={earnings} ticker={ticker} />}
              </div>
            ) : null}

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
          </>
        )}
      </main>

      <footer className="text-center text-xs text-gray-400 py-3 border-t mt-2">
        Data via Yahoo Finance · Not financial advice · For educational use only
      </footer>
    </>
  )
}
