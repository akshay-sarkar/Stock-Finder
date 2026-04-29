'use client'

import { useState } from 'react'
import { FinancialsData, FinancialsRow } from '@/lib/types'

function fmtCap(n: number | null): string {
  if (n == null) return 'N/A'
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6)  return `$${(n / 1e6).toFixed(1)}M`
  return `$${n.toLocaleString()}`
}

export function FinancialsWidget({ data }: { data: FinancialsData }) {
  const [view, setView] = useState<'annual' | 'quarterly'>('annual')
  const rows = view === 'annual' ? data.annual : data.quarterly

  if (!rows.length) return null

  const metrics: { key: keyof FinancialsRow; growthKey: keyof FinancialsRow; label: string }[] = [
    { key: 'revenue',         growthKey: 'revenueGrowth',         label: 'Revenue'          },
    { key: 'grossProfit',     growthKey: 'grossProfitGrowth',     label: 'Gross Profit'     },
    { key: 'operatingIncome', growthKey: 'operatingIncomeGrowth', label: 'Operating Income' },
    { key: 'netIncome',       growthKey: 'netIncomeGrowth',       label: 'Net Income'       },
  ]

  function fmtGrowth(n: number | null) {
    if (n == null) return null
    const positive = n >= 0
    const text = `${n >= 0 ? '+' : ''}${(n * 100).toFixed(1)}%`
    return (
      <span className={`text-[10px] font-semibold ml-1 ${positive ? 'text-emerald-600' : 'text-red-500'}`}>
        {positive ? '▲' : '▼'} {text}
      </span>
    )
  }

  return (
    <div>
      {/* Tab toggle */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs font-medium">
          <button
            onClick={() => setView('annual')}
            className={`px-3 py-1 transition-colors ${view === 'annual' ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
          >
            Annual
          </button>
          <button
            onClick={() => setView('quarterly')}
            className={`px-3 py-1 border-l border-gray-200 transition-colors ${view === 'quarterly' ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
          >
            Quarterly
          </button>
        </div>
        <span className="text-[11px] text-gray-400 italic">
          {view === 'annual' ? 'Last 4 fiscal years' : 'Last 8 quarters'}, newest first
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left text-gray-400 font-medium pb-1.5 pr-4 w-36">Metric</th>
              {rows.map(r => (
                <th key={r.period} className="text-right text-gray-400 font-medium pb-1.5 pr-3 whitespace-nowrap">
                  {r.period}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {metrics.map(({ key, growthKey, label }) => (
              <tr key={key} className="border-b border-gray-50 last:border-0">
                <td className="py-2 pr-4 text-gray-500 font-medium">{label}</td>
                {rows.map(r => {
                  const val = r[key] as number | null
                  const gval = r[growthKey] as number | null
                  return (
                    <td key={r.period} className="py-2 pr-3 text-right text-gray-800 font-semibold whitespace-nowrap">
                      {val != null ? fmtCap(val) : '—'}
                      {fmtGrowth(gval)}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}