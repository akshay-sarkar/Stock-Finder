'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface MoverStock {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: number
}

interface DayMoversResponse {
  gainers: MoverStock[]
  losers: MoverStock[]
  trending: MoverStock[]
}

interface WeekMoversResponse {
  weekGainers: MoverStock[]
  weekLosers: MoverStock[]
}

export default function MarketMoversPage() {
  const [activeTab, setActiveTab] = useState<'day' | 'week'>('day')
  const [dayData, setDayData] = useState<DayMoversResponse | null>(null)
  const [weekData, setWeekData] = useState<WeekMoversResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDayData()
  }, [])

  const fetchDayData = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/market-movers/day')
      if (!res.ok) throw new Error('Failed to load day movers')
      const data = await res.json()
      setDayData(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error loading data')
    } finally {
      setLoading(false)
    }
  }

  const fetchWeekData = async () => {
    if (weekData) return
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/market-movers/week')
      if (!res.ok) throw new Error('Failed to load week movers')
      const data = await res.json()
      setWeekData(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error loading data')
    } finally {
      setLoading(false)
    }
  }

  const handleTabChange = (tab: 'day' | 'week') => {
    setActiveTab(tab)
    if (tab === 'week' && !weekData) {
      fetchWeekData()
    }
  }

  return (
    <>
      <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-50">
        <div className="px-4 py-4 flex items-center gap-2">
          <Link
            href="/"
            className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
            <span className="text-sm">Screener</span>
          </Link>
          <div className="ml-4 text-lg font-semibold">Market Movers</div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-4 bg-slate-50 min-h-screen">
        {/* Tab Switcher */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleTabChange('day')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              activeTab === 'day'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
            }`}
          >
            Day
          </button>
          <button
            onClick={() => handleTabChange('week')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              activeTab === 'week'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
            }`}
          >
            Week
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <svg
                className="animate-spin h-8 w-8 text-blue-500 mx-auto mb-2"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                />
              </svg>
              <p className="text-gray-500 text-sm">Loading movers…</p>
            </div>
          </div>
        )}

        {/* Day Tab */}
        {!loading && activeTab === 'day' && dayData && (
          <div className="grid grid-cols-3 gap-4">
            <MoverCard
              title="🟢 Top Gainers"
              stocks={dayData.gainers}
              highlight="positive"
            />
            <MoverCard
              title="🔴 Top Losers"
              stocks={dayData.losers}
              highlight="negative"
            />
            <MoverCard
              title="🔥 Trending Now"
              stocks={dayData.trending}
              highlight="neutral"
            />
          </div>
        )}

        {/* Week Tab */}
        {!loading && activeTab === 'week' && weekData && (
          <div className="grid grid-cols-2 gap-4">
            <MoverCard
              title="📈 Week Gainers"
              stocks={weekData.weekGainers}
              highlight="positive"
            />
            <MoverCard
              title="📉 Week Losers"
              stocks={weekData.weekLosers}
              highlight="negative"
            />
          </div>
        )}
      </main>

      <footer className="text-center text-xs text-gray-400 py-3 border-t mt-2">
        Data via Yahoo Finance · Not financial advice · For educational use only
      </footer>
    </>
  )
}

interface MoverCardProps {
  title: string
  stocks: MoverStock[]
  highlight: 'positive' | 'negative' | 'neutral'
}

function MoverCard({ title, stocks, highlight }: MoverCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">{title}</h3>
      <div className="space-y-2">
        {stocks.map(stock => (
          <Link
            key={stock.symbol}
            href={`/stockv2/${stock.symbol}`}
            className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors group"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-800 group-hover:text-blue-600">
                  {stock.symbol}
                </span>
              </div>
              <p className="text-xs text-gray-500 truncate">{stock.name}</p>
            </div>
            <div className="flex flex-col items-end gap-0.5 flex-shrink-0 ml-2">
              <span className="text-sm font-semibold text-gray-800">
                ${stock.price.toFixed(2)}
              </span>
              <span
                className={`text-xs font-semibold ${
                  stock.changePercent >= 0
                    ? 'text-emerald-600'
                    : 'text-red-600'
                }`}
              >
                {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
