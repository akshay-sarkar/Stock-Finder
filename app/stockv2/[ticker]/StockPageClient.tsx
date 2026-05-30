'use client'

import { useState, useEffect } from 'react'
import type { StockDetailData, EarningsData, AnalystData, NewsItem, FinancialsData } from '@/lib/types'
import {
  StockHeader,
  QuickStatsBar,
  RelatedStocksStrip,
  LatestIndicatorsTable,
  EarningsWidget,
  AnalystWidget,
  FinancialsWidget,
  FundamentalsSection,
  NewsWidget,
} from '../../stock/components'
import { TradingViewChart } from './TradingViewChart'
import { AccordionSection } from './AccordionSection'

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
  const [data] = useState<StockDetailData>(initialData)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    setLastUpdated(new Date())
  }, [])

  const [earnings] = useState<EarningsData | null>(initialEarnings)
  const [analyst] = useState<AnalystData | null>(initialAnalyst)
  const [news] = useState<NewsItem[] | null>(initialNews)
const [financials, setFinancials] = useState<FinancialsData | null>(initialFinancials)
  const [financialsLoading, setFinancialsLoading] = useState(!initialFinancials)

  useEffect(() => {
    if (initialFinancials) return
    const abortController = new AbortController()
    fetch(`/api/financials/${ticker}`, { signal: abortController.signal })
      .then((res) => res.json())
      .then((d) => setFinancials(d.error ? null : d))
      .catch((e) => { if ((e as Error).name !== 'AbortError') setFinancials(null) })
      .finally(() => setFinancialsLoading(false))
    return () => abortController.abort()
  }, [ticker, initialFinancials])

  if (!data) {
    return (
      <>
        <div className="bg-slate-900 text-white shadow-lg sticky top-0 z-50">
          <div className="px-4 py-4 text-slate-300 font-semibold">{ticker}</div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500 mb-4">Failed to load data</p>
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

      <main className="px-4 py-4 space-y-3 bg-slate-50 flex-1">
        {(data || analyst) && (
          <AccordionSection title="Indicators & Analysis" storageKey="indicators">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <LatestIndicatorsTable data={data} />
              {analyst && <AnalystWidget data={analyst} currentPrice={data.currentPrice} ticker={ticker} />}
            </div>
          </AccordionSection>
        )}

        <AccordionSection title="Price Chart" storageKey="chart">
          <TradingViewChart ticker={ticker} exchange={data.exchange} />
        </AccordionSection>

        <AccordionSection title="Key Statistics" storageKey="fundamentals">
          {data.fundamentals ? (
            <FundamentalsSection f={data.fundamentals} />
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">
              Key statistics not available for this ticker (e.g. ETFs may not have P/E or dividend data).
            </p>
          )}
        </AccordionSection>

        {(financials || earnings || financialsLoading) && (
          <AccordionSection title="Financials & Earnings" storageKey="financials" defaultOpen={false}>
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
          </AccordionSection>
        )}

        {news && news.length > 0 && (
          <AccordionSection title="Recent News" storageKey="news" defaultOpen={false}>
            <NewsWidget items={news} />
          </AccordionSection>
        )}
      </main>

      <footer className="text-center text-xs text-gray-400 py-3 border-t mt-2">
        Data via Yahoo Finance · Charts via TradingView · Not financial advice · For educational use only
      </footer>
    </>
  )
}
