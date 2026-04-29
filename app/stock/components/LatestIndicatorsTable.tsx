'use client'

import { StockDetailData } from '@/lib/types'

interface LatestIndicatorsTableProps {
  data: StockDetailData
}

export function LatestIndicatorsTable({ data }: LatestIndicatorsTableProps) {
  const ind = data.latestIndicators

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <h2 className="text-sm font-semibold text-gray-700 mb-2">Latest Indicator Values</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-0 text-sm">
        {(
          [
            ['RSI(14)', ind.rsi],
            ['MACD Line', ind.macd.toFixed(4)],
            ['MACD Signal', ind.macdSignal.toFixed(4)],
            ['MACD Histogram', ind.macdHistogram.toFixed(4)],
            ['EMA(20)', `$${ind.ema20.toFixed(2)}`],
            ['SMA(50)', `$${ind.sma50.toFixed(2)}`],
            ['SMA(200)', ind.sma200 ? `$${ind.sma200.toFixed(2)}` : 'N/A'],
            ['Volume Ratio', `${ind.volumeRatio.toFixed(2)}×`],
          ] as [string, string | number][]
        ).map(([label, value]) => (
          <div key={label} className="flex justify-between border-b border-gray-100 py-1.5">
            <span className="text-gray-400 text-xs">{label}</span>
            <span className="font-medium text-gray-800 text-xs">{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
