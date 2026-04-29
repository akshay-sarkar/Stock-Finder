'use client'

import * as React from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts'
import { StockDetailData } from '@/lib/types'

interface RSIChartProps {
  data: StockDetailData
}

import { tickDate, tooltipStyle, ChartLegend } from './ChartUtils'

function rsiFormatter(v: unknown, name: string): [string, string] {
  if (v == null || isNaN(Number(v))) return ['—', name]
  return [Number(v).toFixed(2), name]
}

const INDICATOR_HINTS: Record<string, string> = {
  'RSI(14)':
    'Relative Strength Index (14 periods). Oscillator scaled 0–100. Below 30 = oversold (possible bounce). Above 70 = overbought (possible pullback). Neutral zone: 30–70.',
}

export const RSIChart = React.memo(function RSIChart({ data }: RSIChartProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <h2 className="text-sm font-semibold text-gray-700 mb-3">RSI (14)</h2>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data.chartData} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tickFormatter={tickDate} tick={{ fontSize: 10 }} interval="preserveStartEnd" />
          <YAxis domain={[0, 100]} ticks={[0, 30, 50, 70, 100]} tick={{ fontSize: 10 }} width={35} />
          <Tooltip formatter={rsiFormatter} labelFormatter={(l) => `📅 ${l}`} {...tooltipStyle} />
          <Legend content={<ChartLegend hints={INDICATOR_HINTS} />} />
          <ReferenceLine
            y={70}
            stroke="#ef4444"
            strokeDasharray="5 3"
            label={{ value: 'Overbought 70', position: 'insideTopRight', fontSize: 10, fill: '#ef4444' }}
          />
          <ReferenceLine
            y={30}
            stroke="#10b981"
            strokeDasharray="5 3"
            label={{ value: 'Oversold 30', position: 'insideBottomRight', fontSize: 10, fill: '#10b981' }}
          />
          <ReferenceLine y={50} stroke="#d1d5db" strokeDasharray="2 2" />
          <Line type="monotone" dataKey="rsi" stroke="#8b5cf6" dot={false} name="RSI(14)" strokeWidth={2} connectNulls={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
})
