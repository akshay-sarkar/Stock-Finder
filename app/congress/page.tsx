'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { TrendingUp, ArrowLeft, RefreshCw, ExternalLink, Search, ChevronUp, ChevronDown } from 'lucide-react'
import type { CongressionalTrade } from '@/lib/types'

const ITEMS_PER_PAGE = 25

// ─── Helpers ──────────────────────────────────────────────────────────────────
function partyBadge(party: string) {
  if (party === 'D') return <span className="badge-blue">D · Dem</span>
  if (party === 'R') return <span className="badge-red">R · Rep</span>
  if (party === 'I') return <span className="badge-gray">I · Ind</span>
  return <span className="badge-gray">{party || '—'}</span>
}

function typeBadge(type: string) {
  if (type === 'buy')          return <span className="badge-green">Buy</span>
  if (type === 'sell')         return <span className="badge-red">Sell</span>
  if (type === 'sell_partial') return <span className="badge-yellow">Sell Partial</span>
  if (type === 'exchange')     return <span className="badge-blue">Exchange</span>
  return <span className="badge-gray">{type || '—'}</span>
}

function fmtPrice(n: number) {
  return n >= 1000
    ? n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : n.toFixed(2)
}

function minutesSince(ts: number) {
  const mins = Math.floor((Date.now() - ts) / 60000)
  if (mins < 1) return 'just now'
  if (mins === 1) return '1 min ago'
  return `${mins} min ago`
}

// ─── Pagination ────────────────────────────────────────────────────────────────
function Pagination({ page, total, onChange }: { page: number; total: number; onChange: (p: number) => void }) {
  if (total <= 1) return null
  const items: (number | '…')[] = []
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || Math.abs(i - page) <= 1) items.push(i)
    else if (items[items.length - 1] !== '…') items.push('…')
  }
  return (
    <div className="flex items-center gap-1 justify-center py-4 border-t border-gray-100">
      <button disabled={page === 1} onClick={() => onChange(page - 1)}
        className="px-2 py-1 text-sm text-gray-500 disabled:opacity-30 hover:bg-gray-100 rounded">
        ‹ Prev
      </button>
      {items.map((p, i) => p === '…' ? (
        <span key={`e${i}`} className="px-1 text-gray-400 text-sm select-none">…</span>
      ) : (
        <button key={p} onClick={() => onChange(p as number)}
          className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
            p === page ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
          }`}>
          {p}
        </button>
      ))}
      <button disabled={page === total} onClick={() => onChange(page + 1)}
        className="px-2 py-1 text-sm text-gray-500 disabled:opacity-30 hover:bg-gray-100 rounded">
        Next ›
      </button>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CongressPage() {
  const router = useRouter()

  const [trades,    setTrades]    = useState<CongressionalTrade[]>([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState<string | null>(null)
  const [fetchedAt, setFetchedAt] = useState<number | null>(null)
  const [page,      setPage]      = useState(1)
  const [tickerSearch, setTickerSearch] = useState('')

  // Filters
  const [partyFilter, setPartyFilter] = useState<'all' | 'D' | 'R'>('all')
  const [typeFilter,  setTypeFilter]  = useState<'all' | 'buy' | 'sell'>('all')

  // Sort
  const [sortKey,  setSortKey]  = useState<'filedDate' | 'transactionDate' | 'ticker' | 'politician'>('filedDate')
  const [sortAsc,  setSortAsc]  = useState(false)

  async function loadTrades(forceRefresh = false) {
    setLoading(true)
    setError(null)
    try {
      const url = `/api/congressional-trades${forceRefresh ? '?refresh=1' : ''}`
      const res  = await fetch(url)
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error ?? 'Failed to load trades')
      setTrades(data.trades ?? [])
      setFetchedAt(data.fetchedAt ?? Date.now())
      setPage(1)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadTrades() }, [])

  function handleTickerSearch(e: React.FormEvent) {
    e.preventDefault()
    const t = tickerSearch.trim().toUpperCase().replace(/[^A-Z0-9.\-]/g, '')
    if (t.length >= 1 && t.length <= 8) {
      router.push(`/stock/${t}`)
      setTickerSearch('')
    }
  }

  function toggleSort(key: typeof sortKey) {
    if (sortKey === key) setSortAsc(v => !v)
    else { setSortKey(key); setSortAsc(false) }
  }

  function SortIcon({ col }: { col: typeof sortKey }) {
    if (sortKey !== col) return null
    return sortAsc
      ? <ChevronUp size={12} className="inline ml-0.5" />
      : <ChevronDown size={12} className="inline ml-0.5" />
  }

  // Client-side filter + sort
  const filtered = trades
    .filter(t => {
      if (partyFilter !== 'all' && t.party !== partyFilter) return false
      if (typeFilter === 'buy'  && t.tradeType !== 'buy')  return false
      if (typeFilter === 'sell' && t.tradeType !== 'sell' && t.tradeType !== 'sell_partial') return false
      return true
    })
    .sort((a, b) => {
      let av: string, bv: string
      if (sortKey === 'filedDate')       { av = a.filedDate;       bv = b.filedDate }
      else if (sortKey === 'transactionDate') { av = a.transactionDate; bv = b.transactionDate }
      else if (sortKey === 'ticker')     { av = a.ticker;          bv = b.ticker }
      else                               { av = a.politician;       bv = b.politician }
      if (av < bv) return sortAsc ? -1 : 1
      if (av > bv) return sortAsc ? 1 : -1
      return 0
    })

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated  = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-slate-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-5 flex items-center gap-4">
          <Link href="/"
            className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors text-sm shrink-0">
            <ArrowLeft size={15} /> Screener
          </Link>
          <div className="flex items-center gap-3">
            <TrendingUp size={26} className="text-emerald-400" />
            <div>
              <h1 className="text-xl font-bold tracking-tight">Congressional Trades</h1>
              <p className="text-slate-400 text-sm">STOCK Act disclosures · via Capitol Trades</p>
            </div>
          </div>
          <form onSubmit={handleTickerSearch} className="ml-auto flex items-center gap-2">
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

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-4">

        {/* Filter bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Party */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Party:</span>
              {(['all', 'D', 'R'] as const).map(v => (
                <button key={v}
                  onClick={() => { setPartyFilter(v); setPage(1) }}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors border ${
                    partyFilter === v
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-300 text-gray-600 hover:border-blue-400 hover:text-blue-600'
                  }`}
                >
                  {v === 'all' ? 'All' : v === 'D' ? '🔵 Dem' : '🔴 Rep'}
                </button>
              ))}
            </div>

            {/* Type */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Type:</span>
              {(['all', 'buy', 'sell'] as const).map(v => (
                <button key={v}
                  onClick={() => { setTypeFilter(v); setPage(1) }}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors border ${
                    typeFilter === v
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-300 text-gray-600 hover:border-blue-400 hover:text-blue-600'
                  }`}
                >
                  {v === 'all' ? 'All' : v === 'buy' ? 'Buy' : 'Sell'}
                </button>
              ))}
            </div>

            <div className="ml-auto flex items-center gap-3">
              {fetchedAt && (
                <span className="text-xs text-gray-400">
                  Updated {minutesSince(fetchedAt)} · 5-min cache
                </span>
              )}
              <button
                onClick={() => loadTrades(true)}
                disabled={loading}
                className="flex items-center gap-1.5 text-sm text-gray-600 border border-gray-300 hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            ⚠️ {error}
            <p className="text-xs mt-1 text-red-500">
              Capitol Trades may have changed their page structure. Try refreshing or visit{' '}
              <a href="https://www.capitoltrades.com/trades" target="_blank" rel="noopener noreferrer"
                className="underline">capitoltrades.com</a> directly.
            </p>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading && trades.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <svg className="animate-spin h-8 w-8 text-blue-500 mx-auto mb-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <p className="text-gray-500 text-sm">Fetching congressional trades…</p>
                <p className="text-gray-400 text-xs mt-1">Enriching with live prices via Yahoo Finance</p>
              </div>
            </div>
          ) : (
            <>
              {/* Table header */}
              <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3 flex-wrap">
                <h2 className="font-semibold text-gray-800">
                  {filtered.length} trade{filtered.length !== 1 ? 's' : ''}
                  {trades.length !== filtered.length && (
                    <span className="text-gray-400 font-normal text-sm ml-2">of {trades.length} loaded</span>
                  )}
                </h2>
                {filtered.length > 0 && (
                  <span className="text-xs text-gray-400">
                    Page {page}/{totalPages} · {ITEMS_PER_PAGE} per page
                  </span>
                )}
                <a
                  href="https://www.capitoltrades.com/trades"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 transition-colors"
                >
                  View on Capitol Trades <ExternalLink size={11} />
                </a>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 cursor-pointer hover:text-blue-600"
                        onClick={() => toggleSort('politician')}>
                        Member <SortIcon col="politician" />
                      </th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Party</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Chamber</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 cursor-pointer hover:text-blue-600"
                        onClick={() => toggleSort('ticker')}>
                        Ticker <SortIcon col="ticker" />
                      </th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Company</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Type</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Amount</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 cursor-pointer hover:text-blue-600"
                        onClick={() => toggleSort('transactionDate')}>
                        Txn Date <SortIcon col="transactionDate" />
                      </th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 cursor-pointer hover:text-blue-600"
                        onClick={() => toggleSort('filedDate')}>
                        Filed <SortIcon col="filedDate" />
                      </th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-600">Price</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-600">Chg%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((trade, i) => (
                      <tr
                        key={trade.id}
                        className={`border-b border-gray-100 hover:bg-blue-50 transition-colors ${
                          i % 2 === 0 ? '' : 'bg-gray-50/40'
                        }`}
                      >
                        <td className="px-4 py-3">
                          {trade.politicianId ? (
                            <a
                              href={`https://www.capitoltrades.com/politicians/${trade.politicianId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-800 hover:text-blue-600 font-medium text-xs hover:underline"
                            >
                              {trade.politician}
                            </a>
                          ) : (
                            <span className="text-gray-800 font-medium text-xs">{trade.politician}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">{partyBadge(trade.party)}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{trade.chamber}</td>
                        <td className="px-4 py-3">
                          {trade.ticker ? (
                            <Link
                              href={`/stock/${trade.ticker}`}
                              className="font-bold text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              {trade.ticker}
                            </Link>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 max-w-[140px] truncate">
                          {trade.companyName || '—'}
                        </td>
                        <td className="px-4 py-3">{typeBadge(trade.tradeType)}</td>
                        <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                          {trade.amountRange || '—'}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                          {trade.transactionDate || '—'}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                          {trade.filedDate || '—'}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-xs">
                          {trade.currentPrice != null ? `$${fmtPrice(trade.currentPrice)}` : '—'}
                        </td>
                        <td className={`px-4 py-3 text-right font-mono text-xs ${
                          trade.changePercent == null
                            ? 'text-gray-400'
                            : trade.changePercent >= 0 ? 'text-emerald-600' : 'text-red-500'
                        }`}>
                          {trade.changePercent != null
                            ? `${trade.changePercent >= 0 ? '+' : ''}${trade.changePercent.toFixed(2)}%`
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filtered.length === 0 && !loading && (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-sm">No trades match the current filters.</p>
                </div>
              )}

              <Pagination
                page={page}
                total={totalPages}
                onChange={p => { setPage(p); window.scrollTo({ top: 0 }) }}
              />
            </>
          )}
        </div>

        {/* Disclaimer */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800">
          <p className="font-semibold mb-0.5">About this data</p>
          <p>
            Congressional trades are publicly disclosed under the STOCK Act within 45 days of the transaction.
            Data is sourced from <a href="https://www.capitoltrades.com" target="_blank" rel="noopener noreferrer"
              className="underline">Capitol Trades</a>, which aggregates official House and Senate disclosures.
            Prices shown are current market prices — not the price at time of the trade.
            Not financial advice.
          </p>
        </div>
      </main>

      <footer className="text-center text-xs text-gray-400 py-6 border-t mt-4">
        Data via Capitol Trades · STOCK Act disclosures are public record · Not financial advice
      </footer>
    </div>
  )
}
