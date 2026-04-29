'use client'

import { memo } from 'react'
import { StockDetailData } from '@/lib/types'
import { AnalystWidget } from './AnalystWidget'
import { AnalystData } from '@/lib/types'

interface StatCardProps {
  label: string
  value: string
  sub?: string
  color?: string
}

function StatCard({ label, value, sub, color }: StatCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color ?? 'text-gray-800'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
    </div>
  )
}

interface IndicatorSummaryCardsProps {
  data: StockDetailData
  analyst: AnalystData | null
}

export const IndicatorSummaryCards = memo(function IndicatorSummaryCards({ data, analyst }: IndicatorSummaryCardsProps) {
  const ind = data.latestIndicators

  return (
    <div className="grid grid-cols-3 gap-3" style={{ gridTemplateRows: 'auto auto' }}>
      <StatCard
        label="RSI (14)"
        value={ind.rsi.toString()}
        sub={ind.rsi < 30 ? 'Oversold' : ind.rsi > 70 ? 'Overbought' : 'Neutral'}
        color={ind.rsi < 30 ? 'text-emerald-600' : ind.rsi > 70 ? 'text-red-600' : 'text-gray-800'}
      />

      <StatCard
        label="MACD Histogram"
        value={ind.macdHistogram.toFixed(3)}
        sub={
          ind.macdCrossover !== 'none'
            ? `${ind.macdCrossover === 'bullish' ? '▲ Bullish' : '▼ Bearish'} crossover!`
            : ind.macdHistogram > 0
              ? 'Above signal'
              : 'Below signal'
        }
        color={ind.macdHistogram > 0 ? 'text-emerald-600' : 'text-red-500'}
      />

      {analyst && (
        <div className="row-span-2">
          <AnalystWidget data={analyst} currentPrice={data.currentPrice} />
        </div>
      )}

      <StatCard
        label="SMA 50 / 200"
        value={`${ind.sma50.toFixed(0)} / ${ind.sma200?.toFixed(0) ?? 'N/A'}`}
        sub={ind.sma200 ? (ind.sma50 > ind.sma200 ? '🟢 Golden Cross' : '🔴 Death Cross') : 'Not enough data'}
      />

      <StatCard
        label="Volume Ratio"
        value={`${ind.volumeRatio.toFixed(2)}×`}
        sub={ind.volumeRatio >= 2 ? 'Spike!' : ind.volumeRatio < 0.5 ? 'Low volume' : 'Normal'}
        color={ind.volumeRatio >= 2 ? 'text-emerald-600' : 'text-gray-800'}
      />
    </div>
  )
})
