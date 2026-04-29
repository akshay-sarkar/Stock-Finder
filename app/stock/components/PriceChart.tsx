'use client'

import * as React from 'react'
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { StockDetailData } from '@/lib/types'

interface PriceChartProps {
  data: StockDetailData
  showEMA9: boolean
  showEMA20: boolean
  showSMA20: boolean
  showSMA50: boolean
  showSMA200: boolean
  showBB: boolean
}

const INDICATOR_HINTS: Record<string, string> = {
  Close: 'Closing price for the period. The most commonly referenced price — used for all indicator calculations.',
  EMA20: 'Exponential Moving Average (20 periods). Weights recent prices more heavily, making it react faster than SMA. Great for identifying short-term momentum shifts.',
  SMA50: 'Simple Moving Average (50 periods). Evenly averages the last 50 closing prices. Tracks the medium-term trend — price above SMA50 is generally considered bullish.',
  SMA200: 'Simple Moving Average (200 periods). Tracks the long-term trend. Golden Cross: SMA50 rises above SMA200 → bullish signal. Death Cross: SMA50 falls below SMA200 → bearish signal.',
  EMA9: 'Exponential Moving Average (9 periods). Fast-reacting indicator for short-term momentum.',
  SMA20: 'Simple Moving Average (20 periods). Medium-term trend indicator.',
  'BB Upper': 'Bollinger Upper Band (SMA20 + 2 standard deviations). Price touching or exceeding this line is statistically unusual — may signal overbought conditions or a strong breakout.',
  'BB Middle': 'Bollinger Middle Band = 20-period Simple Moving Average. Acts as the mean-reversion anchor. Price tends to oscillate around this line.',
  'BB Lower': 'Bollinger Lower Band (SMA20 − 2 standard deviations). Price touching or breaking below this line may indicate oversold conditions or a breakdown.',
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

function tickDate(d: string) {
  return d?.slice(5) ?? ''
}

function priceFormatter(v: unknown, name: string): [string, string] {
  if (v == null || isNaN(Number(v))) return ['—', name]
  return [`$${Number(v).toFixed(2)}`, name]
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

export const PriceChart = React.memo(function PriceChart({
  data,
  showEMA9,
  showEMA20,
  showSMA20,
  showSMA50,
  showSMA200,
  showBB,
}: PriceChartProps) {
  const isWeekly = data.chartData.length > 0 && data.chartData[0].hasOwnProperty('volSma20')

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="flex items-center gap-3 mb-3">
        <h2 className="text-sm font-semibold text-gray-700">
          Price &amp; Moving Averages
          <span className="text-gray-400 font-normal ml-2 text-xs">
            ({data.chartData.length} {isWeekly ? 'weeks' : 'days'})
          </span>
        </h2>
        {showBB && (
          <span className="text-[11px] text-violet-600 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded font-medium">
            Bollinger Bands (20, ±2σ)
          </span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={data.chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tickFormatter={tickDate} tick={{ fontSize: 10 }} interval="preserveStartEnd" />
          <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10 }} width={60} tickFormatter={(v) => `$${v}`} />
          <Tooltip formatter={priceFormatter} labelFormatter={(l) => `📅 ${l}`} {...tooltipStyle} />
          <Legend content={<ChartLegend />} />
          <Line type="monotone" dataKey="close" stroke="#2563eb" dot={false} name="Close" strokeWidth={2} connectNulls={false} />
          {showEMA9 && (
            <Line
              type="monotone"
              dataKey="ema9"
              stroke="#a855f7"
              dot={false}
              name="EMA9"
              strokeWidth={1.2}
              connectNulls={false}
              strokeDasharray="2 2"
            />
          )}
          {showEMA20 && (
            <Line
              type="monotone"
              dataKey="ema20"
              stroke="#10b981"
              dot={false}
              name="EMA20"
              strokeWidth={1.2}
              connectNulls={false}
              strokeDasharray="4 3"
            />
          )}
          {showSMA20 && (
            <Line type="monotone" dataKey="sma20" stroke="#06b6d4" dot={false} name="SMA20" strokeWidth={1.2} connectNulls={false} />
          )}
          {showSMA50 && (
            <Line type="monotone" dataKey="sma50" stroke="#f59e0b" dot={false} name="SMA50" strokeWidth={1.5} connectNulls={false} />
          )}
          {showSMA200 && (
            <Line type="monotone" dataKey="sma200" stroke="#ef4444" dot={false} name="SMA200" strokeWidth={1.5} connectNulls={false} />
          )}
          {showBB && (
            <>
              <Line
                type="monotone"
                dataKey="bbUpper"
                stroke="#7c3aed"
                dot={false}
                name="BB Upper"
                strokeWidth={1}
                connectNulls={false}
                strokeDasharray="5 3"
              />
              <Line
                type="monotone"
                dataKey="bbMiddle"
                stroke="#a78bfa"
                dot={false}
                name="BB Middle"
                strokeWidth={1}
                connectNulls={false}
                strokeDasharray="2 2"
              />
              <Line
                type="monotone"
                dataKey="bbLower"
                stroke="#7c3aed"
                dot={false}
                name="BB Lower"
                strokeWidth={1}
                connectNulls={false}
                strokeDasharray="5 3"
              />
            </>
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
})
