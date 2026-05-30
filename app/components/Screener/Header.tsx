'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, TrendingUp, ChevronDown, ExternalLink, Menu } from 'lucide-react'
import { MobileNav } from './MobileNav'

function useDropdown() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])
  return { open, setOpen, ref }
}

export function Header() {
  const router = useRouter()
  const [tickerSearch, setTickerSearch] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const tools = useDropdown()
  const congress = useDropdown()
  const news = useDropdown()

  function handleTickerSearch(e: React.FormEvent) {
    e.preventDefault()
    const t = tickerSearch.trim().toUpperCase().replace(/[^A-Z0-9.\-]/g, '')
    if (t.length >= 1 && t.length <= 8) {
      router.push(`/stockv2/${t}`)
      setTickerSearch('')
    }
  }

  return (
    <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 md:py-5 flex items-center gap-3 relative">
        <TrendingUp size={24} className="text-emerald-400 shrink-0" />
        <div className="min-w-0">
          <h1 className="text-base md:text-xl font-bold tracking-tight leading-tight">Stock Finder</h1>
          <p className="text-slate-400 text-xs hidden md:block">Free technical analysis screener · Powered by Yahoo Finance</p>
        </div>

        {/* Desktop nav — hidden on mobile */}
        <div className="hidden md:flex ml-auto items-center gap-2">
          <div className="relative" ref={tools.ref}>
            <button onClick={() => tools.setOpen(v => !v)} className="flex items-center gap-1 text-sm text-slate-300 hover:text-white border border-slate-600 hover:border-slate-400 rounded-lg px-3 py-1.5 transition-colors">
              Tools <ChevronDown size={13} />
            </button>
            {tools.open && (
              <div className="absolute right-0 top-full mt-1 bg-slate-800 border border-slate-600 rounded-xl shadow-xl z-50 py-1 min-w-[160px]">
                <Link href="/tradingview" onClick={() => tools.setOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700 transition-colors">
                  Trading Dashboard
                </Link>
                <Link href="/market-movers" onClick={() => tools.setOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700 transition-colors">
                  Market Movers
                </Link>
              </div>
            )}
          </div>
          <div className="relative" ref={congress.ref}>
            <button onClick={() => congress.setOpen(v => !v)} className="flex items-center gap-1 text-sm text-slate-300 hover:text-white border border-slate-600 hover:border-slate-400 rounded-lg px-3 py-1.5 transition-colors">
              Congress Trades <ChevronDown size={13} />
            </button>
            {congress.open && (
              <div className="absolute right-0 top-full mt-1 bg-slate-800 border border-slate-600 rounded-xl shadow-xl z-50 py-1 min-w-[170px]">
                <a href="https://www.capitoltrades.com/trades" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700 transition-colors">
                  <ExternalLink size={12} /> Capitol Trades
                </a>
                <a href="https://www.quiverquant.com/congresstrading/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700 transition-colors">
                  <ExternalLink size={12} /> Quiver Congress
                </a>
              </div>
            )}
          </div>
          <a href="https://www.quiverquant.com/insiders/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-slate-300 hover:text-white border border-slate-600 hover:border-slate-400 rounded-lg px-3 py-1.5 transition-colors">
            <ExternalLink size={13} /> Insider Trading
          </a>
          <div className="relative" ref={news.ref}>
            <button onClick={() => news.setOpen(v => !v)} className="flex items-center gap-1 text-sm text-slate-300 hover:text-white border border-slate-600 hover:border-slate-400 rounded-lg px-3 py-1.5 transition-colors">
              News <ChevronDown size={13} />
            </button>
            {news.open && (
              <div className="absolute right-0 top-full mt-1 bg-slate-800 border border-slate-600 rounded-xl shadow-xl z-50 py-1 min-w-[160px]">
                <a href="https://www.capitoltrades.com/buzz" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700 transition-colors">
                  <ExternalLink size={12} /> Capitol Buzz
                </a>
                <a href="https://www.capitoltrades.com/articles" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700 transition-colors">
                  <ExternalLink size={12} /> Capitol Articles
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Search + hamburger — always visible */}
        <form onSubmit={handleTickerSearch} className="flex items-center gap-2 ml-auto md:ml-0">
          <input
            type="text"
            placeholder="Ticker…"
            value={tickerSearch}
            onChange={e => setTickerSearch(e.target.value.toUpperCase())}
            className="bg-slate-800 text-white placeholder-slate-400 border border-slate-600 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-24 md:w-36"
          />
          <button type="submit" className="text-slate-300 hover:text-white transition-colors">
            <Search size={16} />
          </button>
        </form>

        {/* Hamburger — mobile only */}
        <button
          onClick={() => setMobileMenuOpen(v => !v)}
          className="md:hidden text-slate-300 hover:text-white transition-colors p-1"
          aria-label="Toggle menu"
        >
          <Menu size={22} />
        </button>
      </div>

      {/* Mobile nav drawer */}
      {mobileMenuOpen && <MobileNav onClose={() => setMobileMenuOpen(false)} />}
    </header>
  )
}
