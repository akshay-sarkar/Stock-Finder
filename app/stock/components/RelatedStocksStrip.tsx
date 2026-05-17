'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface RelatedStock {
  symbol: string
  price: number | null
  changePercent: number | null
}

interface RelatedStocksStripProps {
  ticker: string
}

export function RelatedStocksStrip({ ticker }: RelatedStocksStripProps) {
  const [related, setRelated] = useState<RelatedStock[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/stock/${ticker}/related`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setRelated(data)
      })
      .catch(() => {
        // Silently fail
      })
      .finally(() => setLoading(false))
  }, [ticker])

  // Don't render if no related stocks and not loading
  if (!loading && related.length === 0) return null

  return (
    <div className="bg-slate-800 border-b border-slate-700 px-4 py-2">
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
        <span className="text-slate-400 text-xs font-medium shrink-0 pr-1">Related:</span>

        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-6 w-16 rounded-full bg-slate-700 animate-pulse shrink-0"
              />
            ))
          : related.map(stock => {
              const up = (stock.changePercent ?? 0) >= 0
              return (
                <Link
                  key={stock.symbol}
                  href={`/stock/${stock.symbol}`}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-700 hover:bg-slate-600 transition-colors text-xs shrink-0 whitespace-nowrap"
                >
                  <span className="font-semibold text-white">{stock.symbol}</span>
                  {stock.changePercent != null && (
                    <span className={up ? 'text-emerald-400' : 'text-red-400'}>
                      {up ? '+' : ''}{stock.changePercent.toFixed(2)}%
                    </span>
                  )}
                </Link>
              )
            })}
      </div>
    </div>
  )
}
