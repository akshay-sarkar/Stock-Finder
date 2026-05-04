'use client'

import { StockFundamentals } from '@/lib/types'

function fmtVol(n: number) {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B'
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(0) + 'K'
  return n.toString()
}

interface RangeBarProps {
  low: number
  high: number
  current: number
}

function fmtPrice(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function RangeBar({ low, high, current }: RangeBarProps) {
  const pct = Math.max(0, Math.min(100, ((current - low) / (high - low)) * 100))
  return (
    <span className="flex items-center gap-1.5 text-xs text-slate-400">
      <span className="text-red-400 font-semibold">${fmtPrice(low)}</span>
      <span
        className="relative w-20 h-1.5 rounded-full overflow-visible shrink-0"
        style={{ background: 'linear-gradient(to right, #ef4444, #10b981)' }}
      >
        <span
          className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white border-2 border-slate-600 shadow"
          style={{ left: `calc(${pct}% - 5px)` }}
        />
      </span>
      <span className="text-emerald-400 font-semibold">${fmtPrice(high)}</span>
      <span className="text-slate-500">({pct.toFixed(0)}%)</span>
    </span>
  )
}

interface QuickStatsBarProps {
  fundamentals: StockFundamentals
  currentPrice: number
  lastUpdated: Date | null
}

export function QuickStatsBar({ fundamentals, currentPrice, lastUpdated }: QuickStatsBarProps) {
  return (
    <div className="px-4 pb-2.5 flex flex-wrap gap-x-5 gap-y-1 border-t border-slate-700/60 pt-2 justify-between">
      <div className="flex flex-wrap gap-x-5 gap-y-1">
        {fundamentals.trailingPE != null && (
          <span className="text-xs text-blue-500">
            P/E&nbsp;<span className="text-blue-400 font-semibold">{fundamentals.trailingPE.toFixed(1)}×</span>
          </span>
        )}
        {fundamentals.fiftyTwoWeekHigh != null && fundamentals.fiftyTwoWeekLow != null && (
          <RangeBar
            low={fundamentals.fiftyTwoWeekLow}
            high={fundamentals.fiftyTwoWeekHigh}
            current={currentPrice}
          />
        )}
        {fundamentals.dividendYield != null && fundamentals.dividendYield > 0 && (
          <span className="text-xs text-amber-500">
            Div&nbsp;<span className="text-amber-400 font-semibold">{(fundamentals.dividendYield * 100).toFixed(2)}%</span>
          </span>
        )}
        {(fundamentals.shortPercentOfFloat != null || fundamentals.shortRatio != null || fundamentals.sharesShort != null) && (
          <div className="flex gap-2 text-xs">
            {fundamentals.shortPercentOfFloat != null && (
              <span className={fundamentals.shortPercentOfFloat > 0.2 ? 'text-red-500' : 'text-purple-500'}>
                Short Float&nbsp;
                <span className={`font-semibold ${fundamentals.shortPercentOfFloat > 0.2 ? 'text-red-400' : 'text-purple-400'}`}>
                  {(fundamentals.shortPercentOfFloat * 100).toFixed(2)}%
                </span>
              </span>
            )}
            {fundamentals.shortRatio != null && (
              <span className="text-pink-500">
                Ratio&nbsp;
                <span className="font-semibold text-pink-400">
                  {fundamentals.shortRatio.toFixed(1)}×
                </span>
              </span>
            )}
            {fundamentals.sharesShort != null && (
              <span className="text-cyan-500">
                Shares&nbsp;
                <span className="font-semibold text-cyan-400">
                  {fmtVol(fundamentals.sharesShort)}
                </span>
              </span>
            )}
          </div>
        )}
      </div>
      {lastUpdated && (
        <span className="text-xs text-slate-500 italic">
          Updated {lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        </span>
      )}
    </div>
  )
}
