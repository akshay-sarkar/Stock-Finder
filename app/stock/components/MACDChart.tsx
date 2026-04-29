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

function tickDate(d: string) {
  return d?.slice(5) ?? ''
}

function macdFormatter(v: unknown, name: string): [string, string] {
  if (v == null || isNaN(Number(v))) return ['—', name]
  return [Number(v).toFixed(4), name]
}

const tooltipStyle = {
  contentStyle: {
    fontSize: '12px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
    padding: '8px 12px',
  },
}

const INDICATOR_HINTS: Record<string, string> = {
  MACD: 'MACD Line = 12-period EMA minus 26-period EMA. Positive = bullish momentum, Negative = bearish momentum.',
  Signal: 'Signal Line = 9-period EMA of the MACD line. MACD crossing above Signal → bullish. MACD crossing below Signal → bearish.',
  Histogram: 'MACD Histogram = MACD minus Signal. Positive & growing bars = strengthening bullish momentum. Shrinking or negative = weakening or bearish momentum.',
}

function HintTooltip({ children, hint }: { children: React.ReactNode; hint: string }) {
  const [show, setShow] = React.useState(false)

  return (
    <span
      className="relative inline-flex items-center cursor-help"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
    >
      {children}
      {show && (
        <span
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 bg-gray-900 text-white text-xs rounded-xl px-3 py-2.5 z-[9999] shadow-2xl pointer-events-none leading-relaxed"
          style={{ minWidth: '220px' }}
        >
          {hint}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-gray-900" />
        </span>
      )}
    </span>
  )
}

interface LegendPayloadItem {
  color: string
  value: string
  type?: string
}

function ChartLegend({ payload }: { payload?: LegendPayloadItem[] }) {
  if (!payload?.length) return null
  return (
    <div className="flex flex-wrap gap-4 justify-center mt-2 mb-1 px-2">
      {payload.map((item) => {
        const hint = INDICATOR_HINTS[item.value]
        const label = (
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block w-5 rounded-sm shrink-0"
              style={{
                height: item.type === 'rect' ? 8 : 2,
                backgroundColor: item.color,
                opacity: 0.9,
              }}
            />
            <span className="text-xs text-gray-600 border-b border-dotted border-gray-400 leading-tight">
              {item.value}
            </span>
          </span>
        )
        if (!hint) return <span key={item.value}>{label}</span>
        return (
          <HintTooltip key={item.value} hint={hint}>
            {label}
          </HintTooltip>
        )
      })}
    </div>
  )
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
          <Legend content={<ChartLegend />} />
          <ReferenceLine y={0} stroke="#6b7280" />
          <Bar dataKey="macdHistogram" name="Histogram" fill="#94a3b8" radius={[1, 1, 0, 0]} />
          <Line type="monotone" dataKey="macd" stroke="#2563eb" dot={false} name="MACD" strokeWidth={2} connectNulls={false} />
          <Line type="monotone" dataKey="macdSignal" stroke="#ef4444" dot={false} name="Signal" strokeWidth={1.5} connectNulls={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
})
