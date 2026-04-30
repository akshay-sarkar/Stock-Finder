'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, ChevronUp, ChevronDown, Settings } from 'lucide-react'
import type { ScreenerRow } from '@/lib/types'

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

function fmtCap(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6)  return `$${(n / 1e6).toFixed(1)}M`
  return `$${n.toLocaleString()}`
}

function SignalBadge({ label }: { label: string }) {
  const isGreen = ['MACD Bull', 'Oversold', 'Golden', 'Above SMA', 'Vol Spike'].some(s => label.startsWith(s))
  const isRed   = ['MACD Bear', 'Overbought', 'Death', 'Below SMA'].some(s => label.startsWith(s))
  return <span className={`${isRed ? 'badge-red' : isGreen ? 'badge-green' : 'badge-gray'} mr-1 mb-1`}>{label}</span>
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

interface ResultsTableProps {
  results: ScreenerRow[]
  paginated: ScreenerRow[]
  scanned: number | null
  loading: boolean
  sortKey: keyof ScreenerRow
  sortAsc: boolean
  onSort: (key: keyof ScreenerRow) => void
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  itemsPerPage: number | 'All'
  onItemsPerPageChange: (items: number | 'All') => void
  showCompany: boolean
  onShowCompanyChange: (show: boolean) => void
  showPE: boolean
  onShowPEChange: (show: boolean) => void
  showMarketCap: boolean
  onShowMarketCapChange: (show: boolean) => void
  showDividend: boolean
  onShowDividendChange: (show: boolean) => void
}

export function ResultsTable({
  results,
  paginated,
  scanned,
  loading,
  sortKey,
  sortAsc,
  onSort,
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  onItemsPerPageChange,
  showCompany,
  onShowCompanyChange,
  showPE,
  onShowPEChange,
  showMarketCap,
  onShowMarketCapChange,
  showDividend,
  onShowDividendChange,
}: ResultsTableProps) {
  const [showColMenu, setShowColMenu] = useState(false)

  function SortIcon({ col }: { col: keyof ScreenerRow }) {
    if (sortKey !== col) return null
    return sortAsc ? <ChevronUp size={13} className="inline ml-0.5" /> : <ChevronDown size={13} className="inline ml-0.5" />
  }

  if (scanned === null) return null

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Table header */}
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3 flex-wrap">
        <h2 className="font-semibold text-gray-800">
          {results.length} match{results.length !== 1 ? 'es' : ''}
          <span className="text-gray-400 font-normal text-sm ml-2">of {scanned} scanned</span>
        </h2>
        {results.length > 0 && (
          <div className="text-xs text-gray-400 flex items-center gap-1">
            <span>Page {currentPage}/{totalPages} ·</span>
            <select
              className="bg-transparent border-none text-xs text-gray-400 cursor-pointer focus:ring-0 p-0 hover:text-gray-600"
              value={itemsPerPage}
              onChange={e => {
                onItemsPerPageChange(e.target.value === 'All' ? 'All' : Number(e.target.value))
              }}
            >
              <option value={20}>20 per page</option>
              <option value={40}>40 per page</option>
              <option value={60}>60 per page</option>
              <option value={80}>80 per page</option>
              <option value="All">All</option>
            </select>
          </div>
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
                    onChange={e => onShowCompanyChange(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">Company Name</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded px-1 py-1">
                  <input type="checkbox" checked={showPE} onChange={e => onShowPEChange(e.target.checked)} className="rounded" />
                  <span className="text-sm text-gray-700">P/E Ratio</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded px-1 py-1">
                  <input type="checkbox" checked={showMarketCap} onChange={e => onShowMarketCapChange(e.target.checked)} className="rounded" />
                  <span className="text-sm text-gray-700">Market Cap</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded px-1 py-1">
                  <input type="checkbox" checked={showDividend} onChange={e => onShowDividendChange(e.target.checked)} className="rounded" />
                  <span className="text-sm text-gray-700">Dividend Yield</span>
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
                  {showPE && (
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 cursor-pointer hover:text-blue-600"
                      onClick={() => onSort('trailingPE')}>
                      P/E <SortIcon col="trailingPE" />
                    </th>
                  )}
                  {showMarketCap && (
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 cursor-pointer hover:text-blue-600"
                      onClick={() => onSort('marketCap')}>
                      Mkt Cap <SortIcon col="marketCap" />
                    </th>
                  )}
                  {showDividend && (
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 cursor-pointer hover:text-blue-600"
                      onClick={() => onSort('dividendYield')}>
                      Div Yield <SortIcon col="dividendYield" />
                    </th>
                  )}
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 cursor-pointer hover:text-blue-600"
                    onClick={() => onSort('price')}>
                    Price <SortIcon col="price" />
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 cursor-pointer hover:text-blue-600"
                    onClick={() => onSort('changePercent')}>
                    Chg% <SortIcon col="changePercent" />
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 cursor-pointer hover:text-blue-600"
                    onClick={() => onSort('rsi')}>
                    RSI <SortIcon col="rsi" />
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">MACD</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">MA Status</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 cursor-pointer hover:text-blue-600"
                    onClick={() => onSort('volumeRatio')}>
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
                    {showPE && (
                      <td className="px-4 py-3 text-xs text-gray-700">
                        {row.trailingPE != null ? `${row.trailingPE.toFixed(1)}×` : '—'}
                      </td>
                    )}
                    {showMarketCap && (
                      <td className="px-4 py-3 text-xs text-gray-700">
                        {row.marketCap != null ? fmtCap(row.marketCap) : '—'}
                      </td>
                    )}
                    {showDividend && (
                      <td className="px-4 py-3 text-xs text-gray-700">
                        {row.dividendYield != null && row.dividendYield > 0
                          ? `${(row.dividendYield * 100).toFixed(2)}%`
                          : '—'}
                      </td>
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

          <Pagination page={currentPage} total={totalPages} onChange={p => { onPageChange(p); window.scrollTo({ top: 0 }) }} />
        </>
      )}
    </div>
  )
}