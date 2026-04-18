'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Search, TrendingUp, RotateCcw, ChevronUp, ChevronDown,
  Settings, ChevronRight, Plus, Download, Upload, X, Check, ListFilter, ExternalLink,
} from 'lucide-react'
import { DEFAULT_TICKERS, COMPANY_NAMES } from '@/lib/stockList'
import type { FilterCriteria, ScreenerRow } from '@/lib/types'

// ─── Constants ─────────────────────────────────────────────────────────────────
const ITEMS_PER_PAGE  = 20
const SCAN_BATCH      = 50
const LS_WATCHLIST    = 'sf-watchlist-v2'
const LS_SHOWCOL      = 'sf-show-company'
const SS_STATE        = 'sf-screener-state'

const DEFAULT_FILTERS: FilterCriteria = {
  rsi: 'any', macd: 'any', movingAverage: 'any', volume: 'any',
}

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

// ─── Helpers ──────────────────────────────────────────────────────────────────
function rsiColor(rsi: number) {
  if (rsi < 30) return 'text-emerald-600 font-semibold'
  if (rsi > 70) return 'text-red-600 font-semibold'
  return 'text-gray-700'
}
function changeColor(val: number) {
  return val >= 0 ? 'text-emerald-600' : 'text-red-500'
}
function formatPrice(n: number) {
  return n >= 1000
    ? n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : n.toFixed(2)
}
function formatVol(ratio: number) {
  const cls = ratio >= 2 ? 'badge-green' : ratio < 0.5 ? 'badge-red' : 'badge-gray'
  return <span className={cls}>{ratio.toFixed(2)}x</span>
}

function SignalBadge({ label }: { label: string }) {
  const isGreen = ['MACD Bull', 'Oversold', 'Golden', 'Above SMA', 'Vol Spike'].some(s => label.startsWith(s))
  const isRed   = ['MACD Bear', 'Overbought', 'Death', 'Below SMA'].some(s => label.startsWith(s))
  return <span className={`${isRed ? 'badge-red' : isGreen ? 'badge-green' : 'badge-gray'} mr-1 mb-1`}>{label}</span>
}

// ─── Ticker Management Modal ──────────────────────────────────────────────────
function TickerModal({
  watchlist,
  onUpdate,
  onClose,
}: {
  watchlist: string[]
  onUpdate: (t: string[]) => void
  onClose: () => void
}) {
  const [search,      setSearch]      = useState('')
  const [addInput,    setAddInput]    = useState('')
  const [importText,  setImportText]  = useState('')
  const [tab,         setTab]         = useState<'list' | 'import'>('list')
  const [copied,      setCopied]      = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const filtered = search
    ? watchlist.filter(t => t.includes(search.toUpperCase()) ||
        (COMPANY_NAMES[t] ?? '').toLowerCase().includes(search.toLowerCase()))
    : watchlist

  function parseTickers(raw: string): string[] {
    return raw.split(/[\s,;\n]+/)
      .map(t => t.trim().toUpperCase().replace(/[^A-Z0-9.\-]/g, ''))
      .filter(t => t.length >= 1 && t.length <= 8)
  }

  function remove(t: string) { onUpdate(watchlist.filter(x => x !== t)) }

  function addTickers(raw: string) {
    const news = parseTickers(raw)
    onUpdate([...new Set([...watchlist, ...news])])
  }

  function handleAdd() {
    if (!addInput.trim()) return
    addTickers(addInput)
    setAddInput('')
  }

  function handleImport() {
    if (!importText.trim()) return
    addTickers(importText)
    setImportText('')
    setTab('list')
  }

  function handleFileImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      addTickers(ev.target?.result as string ?? '')
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(watchlist.join(', ')).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function downloadTxt() {
    const blob = new Blob([watchlist.join('\n')], { type: 'text/plain' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = 'watchlist.txt'; a.click()
    URL.revokeObjectURL(url)
  }

  function resetDefaults() {
    if (confirm(`Reset to ${DEFAULT_TICKERS.length}-ticker default list? Your changes will be lost.`)) {
      onUpdate([...DEFAULT_TICKERS])
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col"
        style={{ maxHeight: '80vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-gray-800">Manage Watchlist</h2>
            <p className="text-xs text-gray-400 mt-0.5">{watchlist.length} tickers</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-5">
          {(['list', 'import'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`py-2.5 px-3 text-sm font-medium border-b-2 -mb-px capitalize transition-colors ${
                tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >{t === 'list' ? 'Tickers' : 'Import'}</button>
          ))}
        </div>

        {tab === 'list' ? (
          <>
            {/* Search & Add */}
            <div className="px-5 py-3 space-y-2 border-b border-gray-50">
              <input
                type="text"
                placeholder="Search by ticker or company…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add ticker (e.g. RIVN, TSLA)"
                  value={addInput}
                  onChange={e => setAddInput(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && handleAdd()}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={handleAdd}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 shrink-0"
                >
                  <Plus size={14} /> Add
                </button>
              </div>
            </div>

            {/* Scrollable ticker grid */}
            <div className="flex-1 overflow-y-auto px-5 py-3">
              {filtered.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-6">No tickers match your search.</p>
              ) : (
                <div className="grid grid-cols-3 gap-1.5">
                  {filtered.map(t => (
                    <div key={t} className="group flex items-center justify-between bg-gray-50 hover:bg-red-50 rounded-lg px-2.5 py-1.5 transition-colors">
                      <div className="min-w-0">
                        <span className="text-sm font-semibold text-gray-700">{t}</span>
                        {COMPANY_NAMES[t] && (
                          <span className="block text-[10px] text-gray-400 truncate leading-tight">
                            {COMPANY_NAMES[t]}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => remove(t)}
                        className="text-gray-200 group-hover:text-red-400 transition-colors ml-1 shrink-0"
                        title={`Remove ${t}`}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            <p className="text-xs text-gray-500">
              Paste tickers separated by commas, spaces, or new lines. Duplicates are ignored.
            </p>
            <textarea
              value={importText}
              onChange={e => setImportText(e.target.value)}
              placeholder={"AAPL, MSFT, GOOGL\nTSLA NVDA\nAMZN"}
              rows={6}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono resize-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-2">
              <button
                onClick={handleImport}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm font-medium"
              >
                Add to Watchlist
              </button>
              <button
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-1.5 border border-gray-300 text-gray-600 hover:bg-gray-50 rounded-lg px-3 py-2 text-sm"
              >
                <Upload size={13} /> .txt / .csv
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".txt,.csv"
                className="hidden"
                onChange={handleFileImport}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center gap-2 px-5 py-3 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-1.5 text-xs text-gray-600 border border-gray-200 bg-white rounded-lg px-3 py-1.5 hover:border-gray-300 transition-colors"
          >
            {copied ? <Check size={12} className="text-emerald-500" /> : <Upload size={12} />}
            {copied ? 'Copied!' : 'Copy list'}
          </button>
          <button
            onClick={downloadTxt}
            className="flex items-center gap-1.5 text-xs text-gray-600 border border-gray-200 bg-white rounded-lg px-3 py-1.5 hover:border-gray-300 transition-colors"
          >
            <Download size={12} /> Export .txt
          </button>
          <button
            onClick={resetDefaults}
            className="ml-auto text-xs text-gray-400 hover:text-red-500 transition-colors"
          >
            ↺ Reset to defaults
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Pagination ────────────────────────────────────────────────────────────────
function Pagination({
  page, total, onChange,
}: { page: number; total: number; onChange: (p: number) => void }) {
  if (total <= 1) return null

  // Build compact page list with ellipsis
  const items: (number | '…')[] = []
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || Math.abs(i - page) <= 1) {
      items.push(i)
    } else if (items[items.length - 1] !== '…') {
      items.push('…')
    }
  }

  return (
    <div className="flex items-center gap-1 justify-center py-4 border-t border-gray-100">
      <button
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
        className="px-2 py-1 text-sm text-gray-500 disabled:opacity-30 hover:bg-gray-100 rounded"
      >‹ Prev</button>

      {items.map((p, i) =>
        p === '…' ? (
          <span key={`e${i}`} className="px-1 text-gray-400 text-sm select-none">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p as number)}
            className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
              p === page ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >{p}</button>
        )
      )}

      <button
        disabled={page === total}
        onClick={() => onChange(page + 1)}
        className="px-2 py-1 text-sm text-gray-500 disabled:opacity-30 hover:bg-gray-100 rounded"
      >Next ›</button>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Home() {
  const router = useRouter()
  const [tickerSearch, setTickerSearch] = useState('')

  function handleTickerSearch(e: React.FormEvent) {
    e.preventDefault()
    const t = tickerSearch.trim().toUpperCase().replace(/[^A-Z0-9.\-]/g, '')
    if (t.length >= 1 && t.length <= 8) {
      router.push(`/stock/${t}`)
      setTickerSearch('')
    }
  }

  // Filters & results
  const [filters,    setFilters]    = useState<FilterCriteria>(DEFAULT_FILTERS)
  const [results,    setResults]    = useState<ScreenerRow[]>([])
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState<string | null>(null)
  const [scanned,    setScanned]    = useState<number | null>(null)
  const [progress,   setProgress]   = useState<{ done: number; total: number } | null>(null)
  // Sort
  const [sortKey,    setSortKey]    = useState<keyof ScreenerRow>('rsi')
  const [sortAsc,    setSortAsc]    = useState(true)
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  // Column visibility
  const [showCompany, setShowCompany] = useState(true)
  const [showColMenu, setShowColMenu] = useState(false)
  // UI toggles
  const [showGlossary,    setShowGlossary]    = useState(false)
  const [showTickerModal, setShowTickerModal] = useState(false)
  // Watchlist (localStorage)
  const [watchlist,    setWatchlist]    = useState<string[]>(DEFAULT_TICKERS)
  const [watchlistReady, setWatchlistReady] = useState(false)
  // Session restore flag — must be useState (not useRef) so the save effect
  // only runs AFTER React re-renders with the restored values
  const [stateLoaded, setStateLoaded] = useState(false)

  // ── Restore column prefs & watchlist from localStorage ─────────────────────
  useEffect(() => {
    try {
      const wl = localStorage.getItem(LS_WATCHLIST)
      if (wl) setWatchlist(JSON.parse(wl))
    } catch {}
    try {
      const col = localStorage.getItem(LS_SHOWCOL)
      if (col !== null) setShowCompany(col === 'true')
    } catch {}
    setWatchlistReady(true)
  }, [])

  useEffect(() => {
    if (!watchlistReady) return
    localStorage.setItem(LS_WATCHLIST, JSON.stringify(watchlist))
  }, [watchlist, watchlistReady])

  useEffect(() => {
    localStorage.setItem(LS_SHOWCOL, String(showCompany))
  }, [showCompany])

  // ── Restore screener state from sessionStorage (coming back from stock page)
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(SS_STATE)
      if (saved) {
        const s = JSON.parse(saved)
        setFilters(s.filters    ?? DEFAULT_FILTERS)
        setResults(s.results    ?? [])
        setScanned(s.scanned    ?? null)
        setSortKey(s.sortKey    ?? 'rsi')
        setSortAsc(s.sortAsc    ?? true)
        setCurrentPage(1) // always start on page 1 after returning
      }
    } catch {}
    setStateLoaded(true)
  }, [])

  // ── Persist screener state to sessionStorage on every change ───────────────
  // Runs only after stateLoaded=true, which fires in the same React batch as
  // the restored state values — so we never save stale initial defaults.
  useEffect(() => {
    if (!stateLoaded) return
    sessionStorage.setItem(SS_STATE, JSON.stringify({ filters, results, scanned, sortKey, sortAsc }))
  }, [stateLoaded, filters, results, scanned, sortKey, sortAsc])

  // Reset to page 1 whenever sort changes
  useEffect(() => { setCurrentPage(1) }, [sortKey, sortAsc])

  // ── Scan ───────────────────────────────────────────────────────────────────
  async function runScan() {
    const tickers = watchlist.slice()
    if (tickers.length === 0) return

    setLoading(true)
    setError(null)
    setResults([])
    setScanned(null)
    setCurrentPage(1)

    // Split into batches of SCAN_BATCH, run sequentially so results trickle in
    const batches: string[][] = []
    for (let i = 0; i < tickers.length; i += SCAN_BATCH) {
      batches.push(tickers.slice(i, i + SCAN_BATCH))
    }
    setProgress({ done: 0, total: tickers.length })

    let allResults: ScreenerRow[] = []
    let totalScanned = 0

    try {
      for (const batch of batches) {
        const res = await fetch('/api/screener', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tickers: batch, filters }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Scan failed')

        allResults  = [...allResults,  ...(data.results ?? [])]
        totalScanned += data.scanned ?? batch.length
        setResults(allResults)
        setScanned(totalScanned)
        setProgress({ done: totalScanned, total: tickers.length })
      }
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

  const sorted = [...results].sort((a, b) => {
    const av = a[sortKey] as number
    const bv = b[sortKey] as number
    if (av == null) return 1
    if (bv == null) return -1
    return sortAsc ? av - bv : bv - av
  })

  // ── Pagination ─────────────────────────────────────────────────────────────
  const totalPages  = Math.ceil(sorted.length / ITEMS_PER_PAGE)
  const paginated   = sorted.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  function SortIcon({ col }: { col: keyof ScreenerRow }) {
    if (sortKey !== col) return null
    return sortAsc ? <ChevronUp size={13} className="inline ml-0.5" /> : <ChevronDown size={13} className="inline ml-0.5" />
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Ticker Modal */}
      {showTickerModal && (
        <TickerModal
          watchlist={watchlist}
          onUpdate={setWatchlist}
          onClose={() => setShowTickerModal(false)}
        />
      )}

      {/* Header */}
      <header className="bg-slate-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-5 flex items-center gap-3">
          <TrendingUp size={28} className="text-emerald-400" />
          <div>
            <h1 className="text-xl font-bold tracking-tight">Stock Finder</h1>
            <p className="text-slate-400 text-sm">Free technical analysis screener · Powered by Yahoo Finance</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <a href="https://www.capitoltrades.com/trades" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-slate-300 hover:text-white border border-slate-600 hover:border-slate-400 rounded-lg px-3 py-1.5 transition-colors">
              <ExternalLink size={13} /> Capitol Trades
            </a>
            <a href="https://www.quiverquant.com/congresstrading/" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-slate-300 hover:text-white border border-slate-600 hover:border-slate-400 rounded-lg px-3 py-1.5 transition-colors">
              <ExternalLink size={13} /> Quiver Congress
            </a>
            <a href="https://www.quiverquant.com/insiders/" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-slate-300 hover:text-white border border-slate-600 hover:border-slate-400 rounded-lg px-3 py-1.5 transition-colors">
              <ExternalLink size={13} /> Insider Trading
            </a>
            <div className="relative group">
              <button className="flex items-center gap-1 text-sm text-slate-300 hover:text-white border border-slate-600 hover:border-slate-400 rounded-lg px-3 py-1.5 transition-colors">
                News <ChevronDown size={13} />
              </button>
              <div className="absolute right-0 top-full mt-1 hidden group-hover:block bg-slate-800 border border-slate-600 rounded-xl shadow-xl z-50 py-1 min-w-[160px]">
                <a href="https://www.capitoltrades.com/buzz" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700 transition-colors">
                  <ExternalLink size={12} /> Capitol Buzz
                </a>
                <a href="https://www.capitoltrades.com/articles" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700 transition-colors">
                  <ExternalLink size={12} /> Capitol Articles
                </a>
              </div>
            </div>
          </div>
          <form onSubmit={handleTickerSearch} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Go to ticker…"
              value={tickerSearch}
              onChange={e => setTickerSearch(e.target.value.toUpperCase())}
              className="bg-slate-800 text-white placeholder-slate-400 border border-slate-600 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-36"
            />
            <button type="submit" className="text-slate-300 hover:text-white transition-colors">
              <Search size={16} />
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">

        {/* Filter Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Filters</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
            {/* RSI */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">RSI (14)</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                value={filters.rsi}
                onChange={e => setFilters({ ...filters, rsi: e.target.value as FilterCriteria['rsi'] })}
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                value={filters.macd}
                onChange={e => setFilters({ ...filters, macd: e.target.value as FilterCriteria['macd'] })}
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                value={filters.movingAverage}
                onChange={e =>
                  setFilters({ ...filters, movingAverage: e.target.value as FilterCriteria['movingAverage'] })
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                value={filters.volume}
                onChange={e => setFilters({ ...filters, volume: e.target.value as FilterCriteria['volume'] })}
              >
                <option value="any">Any</option>
                <option value="spike">Spike (&gt; 2× avg)</option>
                <option value="normal">Normal (0.5–2×)</option>
                <option value="low">Low (&lt; 0.5× avg)</option>
              </select>
            </div>
          </div>

          {/* Watchlist bar */}
          <div className="flex flex-wrap items-center gap-3 border-t border-gray-100 pt-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <ListFilter size={14} className="text-gray-400" />
              <span>Watchlist:</span>
              <span className="font-semibold text-gray-700">{watchlist.length} tickers</span>
            </div>
            <button
              onClick={() => setShowTickerModal(true)}
              className="flex items-center gap-1.5 text-xs text-blue-600 border border-blue-200 hover:bg-blue-50 rounded-lg px-3 py-1.5 transition-colors"
            >
              <Settings size={12} />
              Manage Watchlist
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-4">
            <button
              onClick={runScan}
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
              onClick={() => { setFilters(DEFAULT_FILTERS); setResults([]); setScanned(null) }}
              className="flex items-center gap-2 border border-gray-300 text-gray-600 hover:bg-gray-50 px-4 py-2.5 rounded-lg text-sm transition-colors"
            >
              <RotateCcw size={14} /> Reset
            </button>
          </div>
        </div>

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
        {scanned !== null && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Table header */}
            <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3 flex-wrap">
              <h2 className="font-semibold text-gray-800">
                {results.length} match{results.length !== 1 ? 'es' : ''}
                <span className="text-gray-400 font-normal text-sm ml-2">of {scanned} scanned</span>
              </h2>
              {results.length > 0 && (
                <span className="text-xs text-gray-400">
                  Page {currentPage}/{totalPages} · {ITEMS_PER_PAGE} per page
                </span>
              )}
              <div className="ml-auto flex items-center gap-2">
                {/* Column settings */}
                <div className="relative">
                  <button
                    onClick={() => setShowColMenu(v => !v)}
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg px-2.5 py-1.5 transition-colors"
                  >
                    <Settings size={12} /> Columns
                  </button>
                  {showColMenu && (
                    <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 p-3 w-44">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Show / Hide</p>
                      <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded px-1 py-1">
                        <input
                          type="checkbox"
                          checked={showCompany}
                          onChange={e => setShowCompany(e.target.checked)}
                          className="rounded"
                        />
                        <span className="text-sm text-gray-700">Company Name</span>
                      </label>
                    </div>
                  )}
                </div>
                <span className="text-xs text-gray-400 hidden sm:block">Click ticker for charts</span>
              </div>
            </div>

            {results.length === 0 && !loading ? (
              <div className="text-center py-16 text-gray-400">
                <Search size={36} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No stocks match the current filters.</p>
                <p className="text-xs mt-1">Try broadening your criteria or run a new scan.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600">Ticker</th>
                        {showCompany && (
                          <th className="text-left px-4 py-3 font-semibold text-gray-600">Company</th>
                        )}
                        <th className="text-right px-4 py-3 font-semibold text-gray-600 cursor-pointer hover:text-blue-600"
                          onClick={() => toggleSort('price')}>
                          Price <SortIcon col="price" />
                        </th>
                        <th className="text-right px-4 py-3 font-semibold text-gray-600 cursor-pointer hover:text-blue-600"
                          onClick={() => toggleSort('changePercent')}>
                          Chg% <SortIcon col="changePercent" />
                        </th>
                        <th className="text-right px-4 py-3 font-semibold text-gray-600 cursor-pointer hover:text-blue-600"
                          onClick={() => toggleSort('rsi')}>
                          RSI <SortIcon col="rsi" />
                        </th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600">MACD</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600">MA Status</th>
                        <th className="text-right px-4 py-3 font-semibold text-gray-600 cursor-pointer hover:text-blue-600"
                          onClick={() => toggleSort('volumeRatio')}>
                          Vol Ratio <SortIcon col="volumeRatio" />
                        </th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600">Signals</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginated.map((row, i) => (
                        <tr
                          key={row.ticker}
                          className={`border-b border-gray-100 hover:bg-blue-50 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-50/40'}`}
                        >
                          <td className="px-4 py-3">
                            <Link
                              href={`/stock/${row.ticker}`}
                              className="font-bold text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              {row.ticker}
                            </Link>
                          </td>
                          {showCompany && (
                            <td className="px-4 py-3 text-gray-500 text-xs">{row.companyName ?? '—'}</td>
                          )}
                          <td className="px-4 py-3 text-right font-mono">${formatPrice(row.price)}</td>
                          <td className={`px-4 py-3 text-right font-mono ${changeColor(row.changePercent)}`}>
                            {row.changePercent >= 0 ? '+' : ''}{row.changePercent.toFixed(2)}%
                          </td>
                          <td className={`px-4 py-3 text-right ${rsiColor(row.rsi)}`}>{row.rsi}</td>
                          <td className="px-4 py-3">
                            {row.macdCrossover === 'bullish' ? (
                              <span className="badge-green">▲ Bull Cross</span>
                            ) : row.macdCrossover === 'bearish' ? (
                              <span className="badge-red">▼ Bear Cross</span>
                            ) : row.macdHistogram > 0 ? (
                              <span className="badge-blue">Above Signal</span>
                            ) : (
                              <span className="badge-gray">Below Signal</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs">{row.maStatus}</td>
                          <td className="px-4 py-3 text-right">{formatVol(row.volumeRatio)}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap">
                              {row.signals.slice(0, 3).map(s => (
                                <SignalBadge key={s} label={s} />
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <Pagination page={currentPage} total={totalPages} onChange={p => { setCurrentPage(p); window.scrollTo({ top: 0 }) }} />
              </>
            )}
          </div>
        )}

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
