'use client'

import { memo } from 'react'
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'
import { StockDetailData } from '@/lib/types'
import { tickDate, tooltipStyle } from './ChartUtils'

interface VolumeChartProps {
  data: StockDetailData
}

function fmtVol(n: number) {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B'
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(0) + 'K'
  return n.toString()
}

function volFormatter(v: unknown, name: string): [string, string] {
  if (v == null || isNaN(Number(v))) return ['—', name]
  return [fmtVol(Number(v)), name]
}

export const VolumeChart = memo(function VolumeChart({ data }: VolumeChartProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="flex items-center gap-4 mb-3">
        <h2 className="text-sm font-semibold text-gray-700">Volume</h2>
        <span className="flex items-center gap-1.5 text-xs text-gray-400">
          <span className="inline-block w-5 border-t-2 border-dashed border-red-400" />
          Vol SMA(20) — 20-period avg
        </span>
      </div>
      <ResponsiveContainer width="100%" height={130}>
        <ComposedChart data={data.chartData} margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
          <XAxis dataKey="date" tickFormatter={tickDate} tick={{ fontSize: 9 }} interval="preserveStartEnd" />
          <YAxis tickFormatter={fmtVol} tick={{ fontSize: 9 }} width={45} />
          <Tooltip formatter={volFormatter} labelFormatter={(l) => `📅 ${l}`} {...tooltipStyle} />
          <Bar dataKey="volume" fill="#94a3b8" name="Volume" radius={[1, 1, 0, 0]} />
          <Line
            dataKey="volSma20"
            stroke="#ef4444"
            name="Vol SMA(20)"
            dot={false}
            strokeWidth={1.5}
            strokeDasharray="5 3"
            connectNulls={false}
            type="monotone"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
})
