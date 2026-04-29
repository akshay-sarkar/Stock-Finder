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

import { tickDate, tooltipStyle, ChartLegend } from './ChartUtils'

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

function priceFormatter(v: unknown, name: string): [string, string] {
  if (v == null || isNaN(Number(v))) return ['—', name]
  return [`$${Number(v).toFixed(2)}`, name]
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
          <Legend content={<ChartLegend hints={INDICATOR_HINTS} />} />
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
