'use client'

import { StockFundamentals } from '@/lib/types'

function fmtVol(n: number) {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B'
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(0) + 'K'
  return n.toString()
}

export function ShortInterestWidget({ fundamentals }: { fundamentals: StockFundamentals }) {
  const { shortPercentOfFloat, shortRatio, sharesShort } = fundamentals

  // Return null if all fields are null
  if (shortPercentOfFloat == null && shortRatio == null && sharesShort == null) {
    return null
  }

  const isHighShort = shortPercentOfFloat != null && shortPercentOfFloat > 0.20

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <h2 className="text-sm font-semibold text-gray-700 mb-3">Short Interest</h2>

      <div className="flex gap-4 mb-3">
        {/* Short Float */}
        <div className="flex flex-col">
          <span className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Short Float</span>
          <span className="text-sm font-semibold text-gray-800">
            {shortPercentOfFloat != null ? `${(shortPercentOfFloat * 100).toFixed(2)}%` : 'N/A'}
          </span>
        </div>

        {/* Short Ratio */}
        <div className="flex flex-col">
          <span className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Short Ratio</span>
          <span className="text-sm font-semibold text-gray-800">
            {shortRatio != null ? `${shortRatio.toFixed(1)}×` : 'N/A'}
          </span>
        </div>

        {/* Shares Short */}
        <div className="flex flex-col">
          <span className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Shares Short</span>
          <span className="text-sm font-semibold text-gray-800">
            {sharesShort != null ? fmtVol(sharesShort) : 'N/A'}
          </span>
        </div>
      </div>

      {/* High Short Interest Badge */}
      {isHighShort && (
        <div className="text-xs bg-red-50 text-red-600 border border-red-200 rounded px-2 py-0.5 font-semibold inline-block">
          ⚠ High Short Interest
        </div>
      )}
    </div>
  )
}