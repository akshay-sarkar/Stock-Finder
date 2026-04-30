'use client'

import { useState, useEffect, useMemo } from 'react'
import { ChevronRight } from 'lucide-react'
import type { ScreenerRow } from '@/lib/types'
import { TickerModal } from './components/Screener/TickerModal'
import { FilterCard } from './components/Screener/FilterCard'
import { ResultsTable } from './components/Screener/ResultsTable'
import { Header } from './components/Screener/Header'
import { useScreenerState, DEFAULT_FILTERS } from '@/lib/useScreenerState'

// ─── Constants ─────────────────────────────────────────────────────────────────
const SCAN_BATCH      = parseInt(process.env.TICKER_PER_BATCH || '50', 10) || 50

// ─── Signal glossary ──────────────────────────────────────────────────────────
const SIGNAL_GLOSSARY = [
  { signal: 'Oversold',         color: 'bg-emerald-100 text-emerald-700',
    desc: 'RSI < 30. Fallen sharply — may be due for a bounce. Confirm with price action before entering.' },
  { signal: 'Overbought',       color: 'bg-red-100 text-red-700',
    desc: 'RSI > 70. Rallied strongly and may be stretched. Watch for momentum slowing before shorting.' },
  { signal: 'MACD Bull Cross',  color: 'bg-emerald-100 text-emerald-700',
    desc: 'MACD histogram just flipped positive — MACD crossed above Signal. Strongest when it occurs below zero.' },
  { signal: 'MACD Bear Cross',  color: 'bg-red-100 text-red-700',
    desc: 'MACD histogram just flipped negative — MACD crossed below Signal. Most significant above the zero line.' },
  { signal: 'MACD Bullish',     color: 'bg-blue-100 text-blue-700',
    desc: 'MACD is above Signal (histogram > 0) but no fresh crossover. Upward momentum present.' },
  { signal: 'MACD Bearish',     color: 'bg-gray-100 text-gray-600',
    desc: 'MACD is below Signal (histogram < 0). Downward momentum dominant. No fresh crossover.' },
  { signal: 'Golden Cross Zone',color: 'bg-emerald-100 text-emerald-700',
    desc: 'SMA50 > SMA200 — in a long-term uptrend zone. One of the most watched bullish macro signals.' },
  { signal: 'Death Cross Zone', color: 'bg-red-100 text-red-700',
    desc: 'SMA50 < SMA200 — in a long-term downtrend zone. Often confirms a bear market.' },
  { signal: 'Above SMA50',      color: 'bg-emerald-100 text-emerald-700',
    desc: 'Price is above the 50-day SMA. Medium-term trend is up. Institutions use this as a key support level.' },
  { signal: 'Below SMA50',      color: 'bg-red-100 text-red-700',
    desc: 'Price is below the 50-day SMA. Medium-term trend is down. A break below SMA50 is often bearish.' },
  { signal: 'Vol Spike',        color: 'bg-emerald-100 text-emerald-700',
    desc: "Volume > 2× 20-day avg. High volume confirms conviction behind a move — breakouts on spike volume are reliable." },
  { signal: 'Low Volume',       color: 'bg-gray-100 text-gray-600',
    desc: "Volume < 50% of 20-day avg. Low-volume moves are less reliable and often reverse." },
]

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Home() {
  const {
    filters, setFilters,
    results, setResults,
    scanned, setScanned,
    sortKey, setSortKey,
    sortAsc, setSortAsc,
    showCompany, setShowCompany,
    showPE, setShowPE,
    showMarketCap, setShowMarketCap,
    showDividend, setShowDividend,
    watchlist, setWatchlist
  } = useScreenerState()

  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState<string | null>(null)
  const [progress,   setProgress]   = useState<{ done: number; total: number } | null>(null)
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState<number | 'All'>(20)
  // UI toggles
  const [showGlossary,    setShowGlossary]    = useState(false)
  const [showTickerModal, setShowTickerModal] = useState(false)

  // Reset to page 1 whenever sort changes
  useEffect(() => { setCurrentPage(1) }, [sortKey, sortAsc])

  // ── Scan ───────────────────────────────────────────────────────────────────
  async function runScan() {
    const tickers = watchlist.slice()
    if (tickers.length === 0) return

    setLoading(true)
    setError(null)
    setResults([])
    setScanned(0)
    setCurrentPage(1)

    // Split into batches of SCAN_BATCH
    const batches: string[][] = []
    for (let i = 0; i < tickers.length; i += SCAN_BATCH) {
      batches.push(tickers.slice(i, i + SCAN_BATCH))
    }
    setProgress({ done: 0, total: tickers.length })

    try {
      let batchIndex = 0
      const CONCURRENCY = 3
      
      const workers = Array(CONCURRENCY).fill(null).map(async () => {
        while (batchIndex < batches.length) {
          const currentBatch = batches[batchIndex++]
          
          const res = await fetch('/api/screener', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tickers: currentBatch, filters }),
          })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error ?? 'Scan failed')

          // Use functional state updates to safely handle concurrent responses
          setResults(prev => [...prev, ...(data.results ?? [])])
          setScanned(prev => (prev ?? 0) + (data.scanned ?? currentBatch.length))
          setProgress(prev => prev ? { ...prev, done: prev.done + currentBatch.length } : null)
        }
      })

      await Promise.all(workers)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
      setProgress(null)
    }
  }

  // ── Sort ───────────────────────────────────────────────────────────────────
  function toggleSort(key: keyof ScreenerRow) {
    if (sortKey === key) setSortAsc(v => !v)
    else { setSortKey(key); setSortAsc(true) }
  }

  const sorted = useMemo(() => {
    return [...results].sort((a, b) => {
      const av = a[sortKey] ?? (sortAsc ? Infinity : -Infinity)
      const bv = b[sortKey] ?? (sortAsc ? Infinity : -Infinity)
      if (typeof av === 'string' || typeof bv === 'string') return 0
      return sortAsc ? (av as number) - (bv as number) : (bv as number) - (av as number)
    })
  }, [results, sortKey, sortAsc])

  // ── Pagination ─────────────────────────────────────────────────────────────
  const totalPages = useMemo(() => 
    itemsPerPage === 'All' ? 1 : Math.ceil(sorted.length / itemsPerPage)
  , [sorted.length, itemsPerPage])
  
  const paginated = useMemo(() => 
    itemsPerPage === 'All' ? sorted : sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  , [sorted, itemsPerPage, currentPage])

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Ticker Modal */}
      {showTickerModal && (
        <TickerModal
          watchlist={watchlist}
          onUpdate={setWatchlist}
          onClose={() => setShowTickerModal(false)}
        />
      )}

      {/* Header */}
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">

        {/* Filter Card */}
        <FilterCard
          filters={filters}
          onFilterChange={setFilters}
          watchlistCount={watchlist.length}
          onShowTickerModal={() => setShowTickerModal(true)}
          onRunScan={runScan}
          onReset={() => { setFilters(DEFAULT_FILTERS); setResults([]); setScanned(null) }}
          loading={loading}
          progress={progress}
        />

        {/* Progress bar */}
        {loading && progress && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">
                Scanning batch {Math.ceil(progress.done / SCAN_BATCH)} of {Math.ceil(progress.total / SCAN_BATCH)}…
              </span>
              <span className="text-xs text-gray-400">{progress.done} / {progress.total}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.round((progress.done / progress.total) * 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1.5">Results appear as each batch completes. 10-min cache active.</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* Results */}
        <ResultsTable
          results={results}
          paginated={paginated}
          scanned={scanned}
          loading={loading}
          sortKey={sortKey}
          sortAsc={sortAsc}
          onSort={toggleSort}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
          showCompany={showCompany}
          onShowCompanyChange={setShowCompany}
          showPE={showPE}
          onShowPEChange={setShowPE}
          showMarketCap={showMarketCap}
          onShowMarketCapChange={setShowMarketCap}
          showDividend={showDividend}
          onShowDividendChange={setShowDividend}
        />

        {/* Indicator quick-reference */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-gray-500">
          {[
            ['RSI',       'Relative Strength Index. <30 = Oversold, >70 = Overbought'],
            ['MACD',      'Moving Avg Convergence Divergence. Crossovers signal trend shifts'],
            ['MA Status', 'SMA50/SMA200 relationship. Golden/Death cross + price position'],
            ['Vol Ratio', "Today's volume vs 20-day avg. >2× = significant spike"],
          ].map(([title, desc]) => (
            <div key={title} className="bg-white rounded-lg border border-gray-200 p-3">
              <p className="font-semibold text-gray-700 mb-0.5">{title}</p>
              <p>{desc}</p>
            </div>
          ))}
        </div>

        {/* Signal Glossary (collapsible) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <button
            onClick={() => setShowGlossary(v => !v)}
            className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
          >
            <div>
              <span className="font-semibold text-gray-700 text-sm">Signal Glossary</span>
              <span className="text-xs text-gray-400 ml-2">— what each badge means</span>
            </div>
            <ChevronRight size={16} className={`text-gray-400 transition-transform ${showGlossary ? 'rotate-90' : ''}`} />
          </button>
          {showGlossary && (
            <div className="border-t border-gray-100 p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {SIGNAL_GLOSSARY.map(({ signal, color, desc }) => (
                  <div key={signal} className="flex gap-3 items-start p-3 bg-gray-50 rounded-lg">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 mt-0.5 whitespace-nowrap ${color}`}>
                      {signal}
                    </span>
                    <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="text-center text-xs text-gray-400 py-6 border-t mt-4">
        Data via Yahoo Finance · Not financial advice · For educational use only
      </footer>
    </div>
  )
}
