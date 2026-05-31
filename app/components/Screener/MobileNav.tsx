// app/components/Screener/MobileNav.tsx
'use client'

import Link from 'next/link'
import { ExternalLink } from 'lucide-react'

interface MobileNavProps {
  onClose: () => void
}

export function MobileNav({ onClose }: MobileNavProps) {
  return (
    <div className="md:hidden border-t border-slate-700 bg-slate-900 px-4 py-3 space-y-1">
      <p className="text-xs text-slate-500 uppercase tracking-wider px-2 pb-1">Tools</p>
      <Link href="/tradingview" onClick={onClose}
        className="block px-3 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">
        Trading Dashboard
      </Link>
      <Link href="/market-movers" onClick={onClose}
        className="block px-3 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">
        Market Movers
      </Link>

      <p className="text-xs text-slate-500 uppercase tracking-wider px-2 pt-2 pb-1">Congress Trades</p>
      <a href="https://www.capitoltrades.com/trades" target="_blank" rel="noopener noreferrer" onClick={onClose}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">
        <ExternalLink size={12} /> Capitol Trades
      </a>
      <a href="https://www.quiverquant.com/congresstrading/" target="_blank" rel="noopener noreferrer" onClick={onClose}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">
        <ExternalLink size={12} /> Quiver Congress
      </a>

      <p className="text-xs text-slate-500 uppercase tracking-wider px-2 pt-2 pb-1">More</p>
      <a href="https://www.quiverquant.com/insiders/" target="_blank" rel="noopener noreferrer" onClick={onClose}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">
        <ExternalLink size={12} /> Insider Trading
      </a>
      <a href="https://www.capitoltrades.com/buzz" target="_blank" rel="noopener noreferrer" onClick={onClose}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">
        <ExternalLink size={12} /> Capitol Buzz
      </a>
      <a href="https://www.capitoltrades.com/articles" target="_blank" rel="noopener noreferrer" onClick={onClose}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">
        <ExternalLink size={12} /> Capitol Articles
      </a>
    </div>
  )
}
