'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, TrendingUp, ExternalLink, ChevronDown, Menu } from 'lucide-react'
import { StockDetailData } from '@/lib/types'
import { COMPANY_NAMES } from '@/lib/stockList'
import { MobileNav } from '../../components/Screener/MobileNav'

interface StockHeaderProps {
  ticker: string
  data: StockDetailData
}

function fmtPrice(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function StockHeader({ ticker, data }: StockHeaderProps) {
  const changeUp = data.changePercent >= 0
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-50">
      <div className="px-4 py-3 flex items-center gap-3 flex-wrap md:flex-nowrap">
        <Link
          href="/"
          className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors text-sm shrink-0"
        >
          <ArrowLeft size={15} /> Screener
        </Link>

        <TrendingUp size={20} className="text-emerald-400 shrink-0 hidden md:block" />

        {/* Price row — stacks on mobile */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-bold leading-tight">{ticker}</h1>
            <span className="text-xl font-bold">${fmtPrice(data.currentPrice)}</span>
            <span className={`text-sm ${changeUp ? 'text-emerald-400' : 'text-red-400'}`}>
              {changeUp ? '+' : ''}{data.change.toFixed(2)}&nbsp;
              ({changeUp ? '+' : ''}{data.changePercent.toFixed(2)}%)
            </span>
            {data.postMarketPrice != null && data.postMarketChange != null && data.postMarketChangePercent != null && (
              <span className="flex items-center gap-1 text-xs text-slate-400 border-l border-slate-600 pl-2">
                AH: <span className="font-semibold">${fmtPrice(data.postMarketPrice)}</span>
                <span className={data.postMarketChange >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                  {data.postMarketChange >= 0 ? '+' : ''}{data.postMarketChange.toFixed(2)} ({data.postMarketChangePercent >= 0 ? '+' : ''}{data.postMarketChangePercent.toFixed(2)}%)
                </span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-slate-400 text-xs truncate">{data.companyName ?? COMPANY_NAMES[ticker]}</p>
            <a
              href={`https://www.google.com/finance/quote/${ticker}:${data.exchange}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-white border border-blue-700 hover:border-blue-400 hover:bg-blue-700/40 rounded px-1.5 py-0.5 transition-colors shrink-0"
            >
              <ExternalLink size={10} /> Google
            </a>
            <a
              href={`https://www.quiverquant.com/stock/${ticker}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[11px] text-violet-400 hover:text-white border border-violet-700 hover:border-violet-400 hover:bg-violet-700/40 rounded px-1.5 py-0.5 transition-colors shrink-0"
            >
              <ExternalLink size={10} /> Quiver
            </a>
          </div>
        </div>

        {/* Desktop nav — hidden on mobile */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          <div className="relative group">
            <button className="flex items-center gap-1 text-sm text-slate-300 hover:text-white border border-slate-600 hover:border-slate-400 rounded-lg px-3 py-1.5 transition-colors">
              Tools <ChevronDown size={13} />
            </button>
            <div className="absolute right-0 top-full mt-1 hidden group-hover:block bg-slate-800 border border-slate-600 rounded-xl shadow-xl z-50 py-1 min-w-[160px]">
              <Link href="/tradingview" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700 transition-colors">
                Trading Dashboard
              </Link>
              <Link href="/market-movers" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700 transition-colors">
                Market Movers
              </Link>
            </div>
          </div>
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

        {/* Hamburger — mobile only */}
        <button
          onClick={() => setMobileMenuOpen(v => !v)}
          className="md:hidden text-slate-300 hover:text-white transition-colors p-1 shrink-0"
          aria-label="Toggle menu"
        >
          <Menu size={22} />
        </button>
      </div>

      {mobileMenuOpen && <MobileNav onClose={() => setMobileMenuOpen(false)} />}
    </header>
  )
}
