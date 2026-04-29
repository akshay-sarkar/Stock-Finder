'use client'

import { useRef, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { DEFAULT_TICKERS, COMPANY_NAMES } from '@/lib/stockList'

interface SidebarProps {
  ticker: string
  sidebarPrices: Record<string, { price: number; changePercent: number }>
}

export function Sidebar({
  ticker,
  sidebarPrices,
}: SidebarProps) {
  const router = useRouter()
  const sidebarRef = useRef<HTMLElement>(null)
  const [sidebarSearch, setSidebarSearch] = useState('')

  const filteredSidebarTickers = sidebarSearch
    ? DEFAULT_TICKERS.filter(
        (t) =>
          t.includes(sidebarSearch.toUpperCase()) ||
          (COMPANY_NAMES[t] ?? '').toLowerCase().includes(sidebarSearch.toLowerCase())
      )
    : DEFAULT_TICKERS

  useEffect(() => {
    const savedScroll = sessionStorage.getItem('sf-sidebar-scroll')
    if (savedScroll && sidebarRef.current) {
      sidebarRef.current.scrollTop = parseInt(savedScroll, 10)
    }
    if (sessionStorage.getItem('sf-sidebar-focus') === 'true' && sidebarRef.current) {
      sidebarRef.current.focus()
      sessionStorage.removeItem('sf-sidebar-focus')
    }
  }, [ticker])

  const handleSidebarScroll = (e: React.UIEvent<HTMLElement>) => {
    sessionStorage.setItem('sf-sidebar-scroll', e.currentTarget.scrollTop.toString())
  }

  const handleSidebarKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      const currentIndex = filteredSidebarTickers.indexOf(ticker)
      if (currentIndex === -1) return

      if (e.key === 'ArrowDown' && currentIndex < filteredSidebarTickers.length - 1) {
        sessionStorage.setItem('sf-sidebar-focus', 'true')
        router.push(`/stock/${filteredSidebarTickers[currentIndex + 1]}`)
      } else if (e.key === 'ArrowUp' && currentIndex > 0) {
        sessionStorage.setItem('sf-sidebar-focus', 'true')
        router.push(`/stock/${filteredSidebarTickers[currentIndex - 1]}`)
      }
    }
  }

  return (
    <aside
      ref={sidebarRef}
      onScroll={handleSidebarScroll}
      onKeyDown={handleSidebarKeyDown}
      tabIndex={0}
      className="w-[170px] shrink-0 bg-slate-900 border-r border-slate-700 sticky top-0 h-screen overflow-y-auto z-10 outline-none"
    >
      <div className="px-3 py-4">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2 px-1">
          Watchlist
        </p>
        <div className="mb-2">
          <input
            type="text"
            placeholder="Search…"
            value={sidebarSearch}
        onChange={(e) => setSidebarSearch(e.target.value)}
            className="w-full bg-slate-800 text-white placeholder-slate-500 border border-slate-600 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <nav className="space-y-0.5">
          {filteredSidebarTickers.map((t) => {
            const priceData = sidebarPrices[t]
            const isActive = t === ticker
            return (
              <Link
                key={t}
                href={`/stock/${t}`}
                className={`flex items-center justify-between gap-1 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className="flex flex-col min-w-0 flex-1">
                  <span className="font-semibold leading-tight">{t}</span>
                  {COMPANY_NAMES[t] && (
                    <span
                      className={`truncate leading-tight text-[10px] ${
                        isActive ? 'text-blue-200' : 'text-slate-500'
                      }`}
                    >
                      {COMPANY_NAMES[t]}
                    </span>
                  )}
                </span>

                {priceData ? (
                  <span className="flex flex-col items-end shrink-0 tabular-nums">
                    <span className="text-[10px] text-slate-300 leading-tight">
                      $
                      {priceData.price >= 1000
                        ? priceData.price.toLocaleString('en-US', {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          })
                        : priceData.price.toFixed(2)}
                    </span>
                    <span
                      className={`text-[10px] font-medium leading-tight ${
                        priceData.changePercent >= 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {priceData.changePercent >= 0 ? '+' : ''}
                      {priceData.changePercent.toFixed(1)}%
                    </span>
                  </span>
                ) : null}
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
