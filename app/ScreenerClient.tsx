'use client'

import { useState, useCallback, useMemo } from 'react'
import { ChevronRight } from 'lucide-react'
import type { ScreenerRow } from '@/lib/types'
import { TickerModal } from './components/Screener/TickerModal'
import { FilterCard } from './components/Screener/FilterCard'
import { ResultsTable } from './components/Screener/ResultsTable'
import { useScreenerState, DEFAULT_FILTERS } from '@/lib/useScreenerState'
import { SCAN_BATCH, SIGNAL_GLOSSARY } from './constants/screener'

interface ScreenerClientProps {}

export function ScreenerClient({}: ScreenerClientProps) {
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
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState<number | 'All'>(20)
  const [showGlossary,    setShowGlossary]    = useState(false)
  const [showTickerModal, setShowTickerModal] = useState(false)

  // Reset to page 1 whenever sort changes
  useMemo(() => { setCurrentPage(1) }, [sortKey, sortAsc])

  async function runScan() {
    const tickers = watchlist.slice()
    if (tickers.length === 0) return

    setLoading(true)
    setError(null)
    setResults([])
    setScanned(0)
    setCurrentPage(1)

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

  const totalPages = useMemo(() =>
    itemsPerPage === 'All' ? 1 : Math.ceil(sorted.length / itemsPerPage)
  , [sorted.length, itemsPerPage])

  const paginated = useMemo(() =>
    itemsPerPage === 'All' ? sorted : sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  , [sorted, itemsPerPage, currentPage])

  return (
    <>
      {/* Ticker Modal */}
      {showTickerModal && (
        <TickerModal
          watchlist={watchlist}
          onUpdate={setWatchlist}
          onClose={() => setShowTickerModal(false)}
        />
      )}

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
    </>
  )
}
