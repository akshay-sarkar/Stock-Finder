'use client'

import * as React from 'react'
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts'
import { StockDetailData } from '@/lib/types'

interface MACDChartProps {
  data: StockDetailData
}

import { tickDate, tooltipStyle, ChartLegend } from './ChartUtils'

function macdFormatter(v: unknown, name: string): [string, string] {
  if (v == null || isNaN(Number(v))) return ['—', name]
  return [Number(v).toFixed(4), name]
}

const INDICATOR_HINTS: Record<string, string> = {
  MACD: 'MACD Line = 12-period EMA minus 26-period EMA. Positive = bullish momentum, Negative = bearish momentum.',
  Signal: 'Signal Line = 9-period EMA of the MACD line. MACD crossing above Signal → bullish. MACD crossing below Signal → bearish.',
  Histogram: 'MACD Histogram = MACD minus Signal. Positive & growing bars = strengthening bullish momentum. Shrinking or negative = weakening or bearish momentum.',
}

export const MACDChart = React.memo(function MACDChart({ data }: MACDChartProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <h2 className="text-sm font-semibold text-gray-700 mb-3">MACD (12, 26, 9)</h2>
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={data.chartData} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tickFormatter={tickDate} tick={{ fontSize: 10 }} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 10 }} width={50} />
          <Tooltip formatter={macdFormatter} labelFormatter={(l) => `📅 ${l}`} {...tooltipStyle} />
          <Legend content={<ChartLegend hints={INDICATOR_HINTS} />} />
          <ReferenceLine y={0} stroke="#6b7280" />
          <Bar dataKey="macdHistogram" name="Histogram" fill="#94a3b8" radius={[1, 1, 0, 0]} />
          <Line type="monotone" dataKey="macd" stroke="#2563eb" dot={false} name="MACD" strokeWidth={2} connectNulls={false} />
          <Line type="monotone" dataKey="macdSignal" stroke="#ef4444" dot={false} name="Signal" strokeWidth={1.5} connectNulls={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
})
