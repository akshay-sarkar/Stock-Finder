'use client'

import { useState, useEffect } from 'react'
import { DEFAULT_TICKERS } from '@/lib/stockList'
import type { FilterCriteria, ScreenerRow } from '@/lib/types'

const LS_WATCHLIST    = 'sf-watchlist-v2'
const LS_SHOWCOL      = 'sf-show-company'
const LS_COL_PE       = 'sf-col-pe'
const LS_COL_MKTCAP   = 'sf-col-mktcap'
const LS_COL_DIV      = 'sf-col-dividend'
const SS_STATE        = 'sf-screener-state'

export const DEFAULT_FILTERS: FilterCriteria = {
  rsi: 'any', macd: 'any', movingAverage: 'any', volume: 'any',
  pe: 'any', marketCap: 'any', dividendYield: 'any', revenueGrowth: 'any', signals: 'any',
}

export function useScreenerState() {
  // Filters & results
  const [filters, setFilters] = useState<FilterCriteria>(DEFAULT_FILTERS)
  const [results, setResults] = useState<ScreenerRow[]>([])
  const [scanned, setScanned] = useState<number | null>(null)
  // Sort
  const [sortKey, setSortKey] = useState<keyof ScreenerRow>('rsi')
  const [sortAsc, setSortAsc] = useState(true)
  // Column visibility
  const [showCompany, setShowCompany] = useState(true)
  const [showPE, setShowPE] = useState(true)
  const [showMarketCap, setShowMarketCap] = useState(true)
  const [showDividend, setShowDividend] = useState(false)
  // Watchlist (localStorage)
  const [watchlist, setWatchlist] = useState<string[]>(DEFAULT_TICKERS)
  
  const [watchlistReady, setWatchlistReady] = useState(false)
  // Session restore flag
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
    if (localStorage.getItem(LS_COL_PE)     === 'false') setShowPE(false)
    if (localStorage.getItem(LS_COL_MKTCAP) === 'false') setShowMarketCap(false)
    if (localStorage.getItem(LS_COL_DIV)    === 'true')  setShowDividend(true)
    setWatchlistReady(true)
  }, [])

  useEffect(() => {
    if (!watchlistReady) return
    localStorage.setItem(LS_WATCHLIST, JSON.stringify(watchlist))
  }, [watchlist, watchlistReady])

  useEffect(() => {
    localStorage.setItem(LS_SHOWCOL, String(showCompany))
  }, [showCompany])

  useEffect(() => {
    localStorage.setItem(LS_COL_PE,     String(showPE))
    localStorage.setItem(LS_COL_MKTCAP, String(showMarketCap))
    localStorage.setItem(LS_COL_DIV,    String(showDividend))
  }, [showPE, showMarketCap, showDividend])

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

  return {
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
  }
}