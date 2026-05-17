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
              const displayPrice = stock.price ?? 0

              // Calculate position within 52-week range (0-100%)
              let rangePercent = 50
              if (stock.fiftyTwoWeekLow != null && stock.fiftyTwoWeekHigh != null && stock.fiftyTwoWeekLow !== stock.fiftyTwoWeekHigh) {
                rangePercent = ((displayPrice - stock.fiftyTwoWeekLow) / (stock.fiftyTwoWeekHigh - stock.fiftyTwoWeekLow)) * 100
                rangePercent = Math.max(0, Math.min(100, rangePercent))
              }

              return (
                <Link
                  key={stock.symbol}
                  href={`/stock/${stock.symbol}`}
                  className="flex flex-col gap-1.5 px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors text-xs shrink-0 w-40"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-semibold text-white truncate">
                      {stock.symbol}({stock.name})
                    </span>
                    {stock.changePercent != null && (
                      <span className={`font-medium shrink-0 ${up ? 'text-emerald-400' : 'text-red-400'}`}>
                        {up ? '+' : ''}{stock.changePercent.toFixed(1)}%
                      </span>
                    )}
                  </div>

                  {stock.fiftyTwoWeekLow != null && stock.fiftyTwoWeekHigh != null ? (
                    <div className="flex flex-col gap-1">
                      <div className="h-1.5 bg-slate-600 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all"
                          style={{ width: `${rangePercent}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>${stock.fiftyTwoWeekLow.toFixed(0)}</span>
                        <span className="font-semibold text-slate-200">${displayPrice.toFixed(2)}</span>
                        <span>${stock.fiftyTwoWeekHigh.toFixed(0)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-400">— Data unavailable —</div>
                  )}
                </Link>
              )
            })}
      </div>
    </div>
  )
}
