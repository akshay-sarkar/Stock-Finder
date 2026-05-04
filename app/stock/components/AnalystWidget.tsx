'use client'

import { AnalystData } from '@/lib/types'

interface AnalystWidgetProps {
  data: AnalystData
  currentPrice: number
  ticker?: string
}

function fmtPrice(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function recLabel(mean: number): { label: string; color: string } {
  if (mean <= 1.5) return { label: 'Strong Buy', color: 'text-emerald-600' }
  if (mean <= 2.5) return { label: 'Buy', color: 'text-green-600' }
  if (mean <= 3.5) return { label: 'Hold', color: 'text-amber-500' }
  if (mean <= 4.5) return { label: 'Underperform', color: 'text-orange-500' }
  return { label: 'Sell', color: 'text-red-600' }
}

export function AnalystWidget({ data, currentPrice, ticker }: AnalystWidgetProps) {
  const hasMean = data.recommendationMean != null
  const hasTargets = data.targetMeanPrice != null

  if (!hasMean && !hasTargets) return null

  const rec = hasMean ? recLabel(data.recommendationMean!) : null
  const gaugePos = hasMean
    ? Math.max(0, Math.min(100, ((data.recommendationMean! - 1) / 4) * 100))
    : null

  const upside =
    hasTargets && currentPrice > 0
      ? ((data.targetMeanPrice! - currentPrice) / currentPrice) * 100
      : null

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-700">Analyst Ratings</h2>
        {data.numberOfAnalystOpinions != null && (
          <a
            href={ticker ? `https://finance.yahoo.com/quote/${ticker}/analysis` : '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-500 hover:text-blue-600 hover:underline"
          >
            {data.numberOfAnalystOpinions} analysts
          </a>
        )}
      </div>

      {hasMean && rec && gaugePos != null && (
        <div className="mb-3">
          <div className="flex justify-between text-[10px] text-gray-400 mb-1">
            <span>Strong Sell</span>
            <span>Sell</span>
            <span>Hold</span>
            <span>Buy</span>
            <span>Strong Buy</span>
          </div>
          <div
            className="relative h-2.5 rounded-full overflow-visible"
            style={{ background: 'linear-gradient(to right, #ef4444, #f59e0b, #10b981)' }}
          >
            <div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-gray-700 shadow-md z-10"
              style={{ left: `calc(${100 - gaugePos}% - 8px)` }}
            />
          </div>
          <div className="mt-2 text-center">
            <span className={`text-sm font-bold ${rec.color}`}>{rec.label}</span>
          </div>
        </div>
      )}

      {hasTargets && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">12-Month Price Target</p>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex flex-col items-center">
              <span className="text-xs text-gray-400">Low</span>
              <span className="text-sm font-semibold text-red-500">
                {data.targetLowPrice != null ? `$${fmtPrice(data.targetLowPrice)}` : '—'}
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xs text-gray-400">Mean</span>
              <span className="text-sm font-bold text-gray-800">${fmtPrice(data.targetMeanPrice!)}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xs text-gray-400">High</span>
              <span className="text-sm font-semibold text-emerald-600">
                {data.targetHighPrice != null ? `$${fmtPrice(data.targetHighPrice)}` : '—'}
              </span>
            </div>
            {upside != null && (
              <div className="flex flex-col items-center ml-2 pl-2 border-l border-gray-100">
                <span className="text-xs text-gray-400">Upside to Mean</span>
                <span className={`text-sm font-bold ${upside >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {upside >= 0 ? '+' : ''}
                  {upside.toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
