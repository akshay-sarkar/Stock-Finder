'use client'

import { useRef, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { DEFAULT_TICKERS, COMPANY_NAMES, SECTOR_MAP } from '@/lib/stockList'
import { ChevronDown, X } from 'lucide-react'

interface SidebarProps {
  ticker: string
  sidebarPrices: Record<string, { price: number; changePercent: number }>
  /** Mobile-only: whether the drawer is open */
  isOpen?: boolean
  /** Mobile-only: called when the user dismisses the drawer */
  onClose?: () => void
}

export function Sidebar({
  ticker,
  sidebarPrices,
  isOpen = false,
  onClose,
}: SidebarProps) {
  const router = useRouter()
  const sidebarRef = useRef<HTMLElement>(null)
  const [sidebarSearch, setSidebarSearch] = useState('')
  const [expandedSectors, setExpandedSectors] = useState<Record<string, boolean>>({})

  const filteredSidebarTickers = sidebarSearch
    ? DEFAULT_TICKERS.filter(
        (t) =>
          t.includes(sidebarSearch.toUpperCase()) ||
          (COMPANY_NAMES[t] ?? '').toLowerCase().includes(sidebarSearch.toLowerCase())
      )
    : DEFAULT_TICKERS

  // Group filtered tickers by sector
  const groupedBySector = filteredSidebarTickers.reduce(
    (acc, t) => {
      const sector = SECTOR_MAP[t] ?? 'Other'
      if (!acc[sector]) acc[sector] = []
      acc[sector].push(t)
      return acc
    },
    {} as Record<string, string[]>
  )

  const toggleSector = (sector: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setExpandedSectors((prev) => {
      const next = {
        ...prev,
        [sector]: !(prev[sector] ?? true),
      }
      localStorage.setItem('sf-sidebar-expanded', JSON.stringify(next))
      return next
    })
  }

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

  useEffect(() => {
    const saved = localStorage.getItem('sf-sidebar-expanded')
    if (saved) {
      try {
        setExpandedSectors(JSON.parse(saved))
      } catch {
        // Invalid JSON, ignore
      }
    }
  }, [])

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
        router.push(`/stockv2/${filteredSidebarTickers[currentIndex + 1]}`)
      } else if (e.key === 'ArrowUp' && currentIndex > 0) {
        sessionStorage.setItem('sf-sidebar-focus', 'true')
        router.push(`/stockv2/${filteredSidebarTickers[currentIndex - 1]}`)
      }
    }
  }

  return (
    <aside
      ref={sidebarRef}
      onScroll={handleSidebarScroll}
      onKeyDown={handleSidebarKeyDown}
      tabIndex={0}
      className={[
        // Shared styles
        'bg-slate-900 border-r border-slate-700 overflow-y-auto outline-none',
        // Desktop: static in the flow, always visible
        'md:w-[170px] md:shrink-0 md:sticky md:top-0 md:h-screen md:translate-x-0 md:z-10',
        // Mobile: fixed overlay, slides in/out
        'fixed inset-y-0 left-0 w-[230px] h-full z-[60] transition-transform duration-300 ease-in-out',
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
      ].join(' ')}
    >
      <div className="px-3 py-4">
        {/* Mobile header row: title + close button */}
        <div className="flex items-center justify-between mb-2 px-1 md:block">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
            Watchlist
          </p>
          <button
            onClick={onClose}
            className="md:hidden text-slate-400 hover:text-white transition-colors p-1 -mr-1"
            aria-label="Close watchlist"
          >
            <X size={18} />
          </button>
        </div>
        <div className="mb-2">
          <input
            type="text"
            placeholder="Search…"
            value={sidebarSearch}
        onChange={(e) => setSidebarSearch(e.target.value)}
            className="w-full bg-slate-800 text-white placeholder-slate-500 border border-slate-600 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <nav className="space-y-1">
          {Object.keys(groupedBySector)
            .sort()
            .map((sector) => {
              const isExpanded = expandedSectors[sector] ?? true
              const sectorTickers = groupedBySector[sector]

              return (
                <div key={sector}>
                  <button
                    onClick={(e) => toggleSector(sector, e)}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-colors"
                  >
                    <span>{sector}</span>
                    <ChevronDown
                      size={14}
                      className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {isExpanded && (
                    <div className="ml-1 space-y-0.5 mt-0.5 border-l border-slate-700 pl-0">
                      {sectorTickers.map((t) => {
                        const priceData = sidebarPrices[t]
                        const isActive = t === ticker
                        return (
                          <Link
                            key={t}
                            href={`/stockv2/${t}`}
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
                    </div>
                  )}
                </div>
              )
            })}
        </nav>
      </div>
    </aside>
  )
}
