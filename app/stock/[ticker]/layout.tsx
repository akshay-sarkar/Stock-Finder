'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { DEFAULT_TICKERS } from '@/lib/stockList'
import { Sidebar } from '../components'

export default function StockLayout({ children }: { children: React.ReactNode }) {
  const params = useParams()
  const ticker = (params?.ticker as string)?.toUpperCase() ?? ''
  const [sidebarPrices, setSidebarPrices] = useState<Record<string, { price: number; changePercent: number }>>({})

  useEffect(() => {
    fetch('/api/prices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tickers: DEFAULT_TICKERS }),
    })
      .then((r) => r.json())
      .then((d) => setSidebarPrices(d.prices ?? {}))
      .catch(() => {})
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar ticker={ticker} sidebarPrices={sidebarPrices} />
      <div className="flex-1 flex flex-col min-w-0">
        {children}
      </div>
    </div>
  )
}
