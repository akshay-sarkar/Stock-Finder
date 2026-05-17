'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface RelatedStock {
  symbol: string
  name: string
  price: number | null
  changePercent: number | null
  fiftyTwoWeekLow: number | null
  fiftyTwoWeekHigh: number | null
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
                className="w-32 h-14 rounded-lg bg-slate-700 animate-pulse shrink-0"
              />
            ))
          : related.map(stock => {
              const up = (stock.changePercent ?? 0) >= 0
              const displayPrice = stock.price != null ? `$${stock.price.toFixed(2)}` : '—'
              const rangeText = stock.fiftyTwoWeekLow != null && stock.fiftyTwoWeekHigh != null
                ? `$${stock.fiftyTwoWeekLow.toFixed(0)}–$${stock.fiftyTwoWeekHigh.toFixed(0)}`
                : '—'
              return (
                <Link
                  key={stock.symbol}
                  href={`/stock/${stock.symbol}`}
                  className="flex flex-col gap-1 px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors text-xs shrink-0 w-36"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-semibold text-white truncate">{stock.symbol}</span>
                    {stock.changePercent != null && (
                      <span className={`font-medium shrink-0 ${up ? 'text-emerald-400' : 'text-red-400'}`}>
                        {up ? '+' : ''}{stock.changePercent.toFixed(1)}%
                      </span>
                    )}
                  </div>
                  <div className="text-slate-300 text-[11px] flex items-center justify-between">
                    <span>{rangeText}</span>
                    <span className="font-semibold">{displayPrice}</span>
                  </div>
                </Link>
              )
            })}
      </div>
    </div>
  )
}
