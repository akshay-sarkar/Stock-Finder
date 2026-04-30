'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, TrendingUp, ChevronDown, ExternalLink } from 'lucide-react'

export function Header() {
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

  return (
    <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-5 flex items-center gap-3">
        <TrendingUp size={28} className="text-emerald-400" />
        <div>
          <h1 className="text-xl font-bold tracking-tight">Stock Finder</h1>
          <p className="text-slate-400 text-sm">Free technical analysis screener · Powered by Yahoo Finance</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="relative group">
            <button className="flex items-center gap-1 text-sm text-slate-300 hover:text-white border border-slate-600 hover:border-slate-400 rounded-lg px-3 py-1.5 transition-colors">
              Congress Trades <ChevronDown size={13} />
            </button>
            <div className="absolute right-0 top-full mt-1 hidden group-hover:block bg-slate-800 border border-slate-600 rounded-xl shadow-xl z-50 py-1 min-w-[170px]">
              <a href="https://www.capitoltrades.com/trades" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700 transition-colors">
                <ExternalLink size={12} /> Capitol Trades
              </a>
              <a href="https://www.quiverquant.com/congresstrading/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700 transition-colors">
                <ExternalLink size={12} /> Quiver Congress
              </a>
            </div>
          </div>
          <a href="https://www.quiverquant.com/insiders/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-slate-300 hover:text-white border border-slate-600 hover:border-slate-400 rounded-lg px-3 py-1.5 transition-colors">
            <ExternalLink size={13} /> Insider Trading
          </a>
          <div className="relative group">
            <button className="flex items-center gap-1 text-sm text-slate-300 hover:text-white border border-slate-600 hover:border-slate-400 rounded-lg px-3 py-1.5 transition-colors">
              News <ChevronDown size={13} />
            </button>
            <div className="absolute right-0 top-full mt-1 hidden group-hover:block bg-slate-800 border border-slate-600 rounded-xl shadow-xl z-50 py-1 min-w-[160px]">
              <a href="https://www.capitoltrades.com/buzz" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700 transition-colors">
                <ExternalLink size={12} /> Capitol Buzz
              </a>
              <a href="https://www.capitoltrades.com/articles" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700 transition-colors">
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
  )
}