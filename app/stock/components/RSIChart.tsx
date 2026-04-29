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

function tickDate(d: string) {
  return d?.slice(5) ?? ''
}

function rsiFormatter(v: unknown, name: string): [string, string] {
  if (v == null || isNaN(Number(v))) return ['—', name]
  return [Number(v).toFixed(2), name]
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
  'RSI(14)':
    'Relative Strength Index (14 periods). Oscillator scaled 0–100. Below 30 = oversold (possible bounce). Above 70 = overbought (possible pullback). Neutral zone: 30–70.',
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
          <Legend content={<ChartLegend />} />
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
