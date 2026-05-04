'use client'

import { memo } from 'react'
import { StockDetailData } from '@/lib/types'

interface LatestIndicatorsTableProps {
  data: StockDetailData
}

function getRSIStatus(rsi: number): { label: string; color: string } {
  if (rsi < 30) return { label: 'Oversold', color: 'text-emerald-600' }
  if (rsi > 70) return { label: 'Overbought', color: 'text-red-600' }
  return { label: 'Neutral', color: 'text-gray-600' }
}

function getMACDStatus(histogram: number, crossover: string): { label: string; color: string } {
  if (crossover !== 'none') {
    return { label: `${crossover === 'bullish' ? '▲ Bullish' : '▼ Bearish'} crossover`, color: crossover === 'bullish' ? 'text-emerald-600' : 'text-red-500' }
  }
  return { label: histogram > 0 ? 'Above signal' : 'Below signal', color: histogram > 0 ? 'text-emerald-600' : 'text-red-500' }
}

function getVolumeStatus(volumeRatio: number): { label: string; color: string } {
  if (volumeRatio >= 2) return { label: 'Spike!', color: 'text-emerald-600' }
  if (volumeRatio < 0.5) return { label: 'Low volume', color: 'text-orange-500' }
  return { label: 'Normal', color: 'text-gray-600' }
}

export const LatestIndicatorsTable = memo(function LatestIndicatorsTable({ data }: LatestIndicatorsTableProps) {
  const ind = data.latestIndicators
  const rsiStatus = getRSIStatus(ind.rsi)
  const macdStatus = getMACDStatus(ind.macdHistogram, ind.macdCrossover)
  const volumeStatus = getVolumeStatus(ind.volumeRatio)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <h2 className="text-sm font-semibold text-gray-700 mb-2">Latest Indicator Values</h2>
      <div className="grid grid-cols-2 gap-x-6 gap-y-0 text-sm">
        {(
          [
            { label: 'RSI(14)', value: ind.rsi, status: rsiStatus.label, statusColor: rsiStatus.color },
            { label: 'MACD Line', value: ind.macd.toFixed(4), status: null, statusColor: null },
            { label: 'MACD Signal', value: ind.macdSignal.toFixed(4), status: null, statusColor: null },
            { label: 'MACD Histogram', value: ind.macdHistogram.toFixed(4), status: macdStatus.label, statusColor: macdStatus.color },
            { label: 'EMA(20)', value: `$${ind.ema20.toFixed(2)}`, status: null, statusColor: null },
            { label: 'SMA(50)', value: `$${ind.sma50.toFixed(2)}`, status: null, statusColor: null },
            { label: 'SMA(200)', value: ind.sma200 ? `$${ind.sma200.toFixed(2)}` : 'N/A', status: null, statusColor: null },
            { label: 'Volume Ratio', value: `${ind.volumeRatio.toFixed(2)}×`, status: volumeStatus.label, statusColor: volumeStatus.color },
          ]
        ).map(({ label, value, status, statusColor }) => (
          <div key={label} className="flex justify-between border-b border-gray-100 py-1.5">
            <div className="flex flex-col gap-0.5">
              <span className="text-gray-400 text-xs">{label}</span>
              {status && <span className={`text-xs ${statusColor}`}>{status}</span>}
            </div>
            <span className="font-medium text-gray-800 text-xs">{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
})
