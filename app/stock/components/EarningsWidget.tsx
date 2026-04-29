'use client'

import { EarningsData } from '@/lib/types'

export function EarningsWidget({ data }: { data: EarningsData }) {
  const now = new Date()

  let daysUntil: number | null = null
  let nextDateLabel = 'N/A'
  if (data.nextEarningsDate) {
    const next = new Date(data.nextEarningsDate)
    daysUntil = Math.ceil((next.getTime() - now.getTime()) / 86400000)
    nextDateLabel = next.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const soon = daysUntil != null && daysUntil >= 0 && daysUntil <= 30

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <h2 className="text-sm font-semibold text-gray-700 mb-3">Earnings</h2>

      {/* Next earnings date + estimate */}
      <div className="flex flex-wrap gap-3 mb-3">
        <div className="flex flex-col">
          <span className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Next Report</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-800">{nextDateLabel}</span>
            {soon && daysUntil === 0 && (
              <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 rounded px-1.5 py-0.5 font-medium">Today</span>
            )}
            {soon && daysUntil != null && daysUntil > 0 && (
              <span className="text-xs bg-blue-50 text-blue-600 border border-blue-200 rounded px-1.5 py-0.5 font-medium">
                in {daysUntil}d
              </span>
            )}
          </div>
        </div>
        {data.epsEstimateNext != null && (
          <div className="flex flex-col">
            <span className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Est. EPS</span>
            <span className="text-sm font-semibold text-gray-800">
              ${data.epsEstimateNext.toFixed(2)}
              {data.epsEstimateLow != null && data.epsEstimateHigh != null && (
                <span className="text-xs text-gray-400 font-normal ml-1">
                  (${data.epsEstimateLow.toFixed(2)}–${data.epsEstimateHigh.toFixed(2)})
                </span>
              )}
            </span>
          </div>
        )}
      </div>

      {/* Historical earnings table */}
      {data.history.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-gray-400 font-medium pb-1.5 pr-4">Quarter</th>
                <th className="text-right text-gray-400 font-medium pb-1.5 pr-4">Est. EPS</th>
                <th className="text-right text-gray-400 font-medium pb-1.5 pr-4">Actual EPS</th>
                <th className="text-right text-gray-400 font-medium pb-1.5">Surprise</th>
              </tr>
            </thead>
            <tbody>
              {data.history.map((row) => {
                const beat = row.surprisePercent != null && row.surprisePercent > 0
                const miss = row.surprisePercent != null && row.surprisePercent < 0
                const qLabel = row.date
                  ? new Date(row.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
                  : '—'
                return (
                  <tr key={row.date} className="border-b border-gray-50 last:border-0">
                    <td className="py-1.5 pr-4 text-gray-600 font-medium">{qLabel}</td>
                    <td className="py-1.5 pr-4 text-right text-gray-500">
                      {row.epsEstimate != null ? `$${row.epsEstimate.toFixed(2)}` : '—'}
                    </td>
                    <td className="py-1.5 pr-4 text-right font-semibold text-gray-800">
                      {row.epsActual != null ? `$${row.epsActual.toFixed(2)}` : '—'}
                    </td>
                    <td className="py-1.5 text-right">
                      {row.surprisePercent != null ? (
                        <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          beat ? 'bg-emerald-50 text-emerald-700' : miss ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-500'
                        }`}>
                          {beat ? '▲' : miss ? '▼' : '='} {Math.abs(row.surprisePercent).toFixed(1)}%
                        </span>
                      ) : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {data.history.length === 0 && data.nextEarningsDate == null && (
        <p className="text-xs text-gray-400">Earnings data not available for this ticker.</p>
      )}
    </div>
  )
}