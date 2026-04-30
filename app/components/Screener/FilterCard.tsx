'use client'

import { Search, RotateCcw, Settings, ListFilter } from 'lucide-react'
import type { FilterCriteria } from '@/lib/types'

interface FilterCardProps {
  filters: FilterCriteria
  onFilterChange: (filters: FilterCriteria) => void
  watchlistCount: number
  onShowTickerModal: () => void
  onRunScan: () => void
  onReset: () => void
  loading: boolean
  progress: { done: number; total: number } | null
}

export function FilterCard({
  filters,
  onFilterChange,
  watchlistCount,
  onShowTickerModal,
  onRunScan,
  onReset,
  loading,
  progress,
}: FilterCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Filters</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        {/* RSI */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">RSI (14)</label>
          <select
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
            value={filters.rsi}
            onChange={e => onFilterChange({ ...filters, rsi: e.target.value as FilterCriteria['rsi'] })}
          >
            <option value="any">Any</option>
            <option value="oversold">Oversold (&lt; 30)</option>
            <option value="overbought">Overbought (&gt; 70)</option>
            <option value="neutral">Neutral (30–70)</option>
          </select>
        </div>

        {/* MACD */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">MACD (12,26,9)</label>
          <select
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
            value={filters.macd}
            onChange={e => onFilterChange({ ...filters, macd: e.target.value as FilterCriteria['macd'] })}
          >
            <option value="any">Any</option>
            <option value="bullish_crossover">Bullish Crossover</option>
            <option value="bearish_crossover">Bearish Crossover</option>
            <option value="above_signal">Above Signal Line</option>
            <option value="below_signal">Below Signal Line</option>
          </select>
        </div>

        {/* Moving Average */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Moving Average</label>
          <select
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
            value={filters.movingAverage}
            onChange={e =>
              onFilterChange({ ...filters, movingAverage: e.target.value as FilterCriteria['movingAverage'] })
            }
          >
            <option value="any">Any</option>
            <option value="above_sma50">Price Above SMA50</option>
            <option value="below_sma50">Price Below SMA50</option>
            <option value="price_above_sma200">Price Above SMA200</option>
            <option value="price_below_sma200">Price Below SMA200</option>
            <option value="golden_cross">Golden Cross (SMA50 &gt; SMA200)</option>
            <option value="death_cross">Death Cross (SMA50 &lt; SMA200)</option>
          </select>
        </div>

        {/* Volume */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Volume</label>
          <select
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
            value={filters.volume}
            onChange={e => onFilterChange({ ...filters, volume: e.target.value as FilterCriteria['volume'] })}
          >
            <option value="any">Any</option>
            <option value="spike">Spike (&gt; 2× avg)</option>
            <option value="normal">Normal (0.5–2×)</option>
            <option value="low">Low (&lt; 0.5× avg)</option>
          </select>
        </div>
      </div>

      {/* Fundamentals Row */}
      <div className="mb-4 pb-4 border-t border-gray-100 pt-4">
        <h3 className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-3">Fundamentals</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* P/E Ratio */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">P/E Ratio</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
              value={filters.pe}
              onChange={e => onFilterChange({ ...filters, pe: e.target.value as FilterCriteria['pe'] })}
            >
              <option value="any">Any</option>
              <option value="under_15">Under 15</option>
              <option value="under_25">Under 25</option>
              <option value="under_40">Under 40</option>
              <option value="over_40">Over 40</option>
              <option value="negative">Negative</option>
            </select>
          </div>

          {/* Market Cap */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Market Cap</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
              value={filters.marketCap}
              onChange={e => onFilterChange({ ...filters, marketCap: e.target.value as FilterCriteria['marketCap'] })}
            >
              <option value="any">Any</option>
              <option value="mega">Mega (&gt;= $200B)</option>
              <option value="large">Large ($10B–$200B)</option>
              <option value="mid">Mid ($2B–$10B)</option>
              <option value="small">Small (&lt; $2B)</option>
            </select>
          </div>

          {/* Dividend Yield */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Dividend Yield</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
              value={filters.dividendYield}
              onChange={e => onFilterChange({ ...filters, dividendYield: e.target.value as FilterCriteria['dividendYield'] })}
            >
              <option value="any">Any</option>
              <option value="none">None (0%)</option>
              <option value="over_1">&gt; 1%</option>
              <option value="over_2">&gt; 2%</option>
              <option value="over_4">&gt; 4%</option>
            </select>
          </div>

          {/* Revenue Growth */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Revenue Growth (YoY)</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
              value={filters.revenueGrowth}
              onChange={e => onFilterChange({ ...filters, revenueGrowth: e.target.value as FilterCriteria['revenueGrowth'] })}
            >
              <option value="any">Any</option>
              <option value="positive">Positive (&gt; 0%)</option>
              <option value="over_10">&gt; 10%</option>
              <option value="over_20">&gt; 20%</option>
              <option value="negative">Negative (&lt; 0%)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Watchlist bar */}
      <div className="flex flex-wrap items-center gap-3 border-t border-gray-100 pt-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <ListFilter size={14} className="text-gray-400" />
          <span>Watchlist:</span>
          <span className="font-semibold text-gray-700">{watchlistCount} tickers</span>
        </div>
        <button
          onClick={onShowTickerModal}
          className="flex items-center gap-1.5 text-xs text-blue-600 border border-blue-200 hover:bg-blue-50 rounded-lg px-3 py-1.5 transition-colors"
        >
          <Settings size={12} />
          Manage Watchlist
        </button>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-4">
        <button
          onClick={onRunScan}
          disabled={loading}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium px-5 py-2.5 rounded-lg transition-colors text-sm"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              {progress ? `Scanning… ${progress.done}/${progress.total}` : 'Scanning…'}
            </>
          ) : (
            <><Search size={16} /> Scan Stocks</>
          )}
        </button>
        <button
          onClick={onReset}
          className="flex items-center gap-2 border border-gray-300 text-gray-600 hover:bg-gray-50 px-4 py-2.5 rounded-lg text-sm transition-colors"
        >
          <RotateCcw size={14} /> Reset
        </button>
      </div>
    </div>
  )
}