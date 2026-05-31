'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { DEFAULT_TICKERS } from '@/lib/stockList'
import { Sidebar } from '../../stock/components'

export default function StockV2Layout({ children }: { children: React.ReactNode }) {
  const params = useParams()
  const ticker = (params?.ticker as string)?.toUpperCase() ?? ''
  const [sidebarPrices, setSidebarPrices] = useState<Record<string, { price: number; changePercent: number }>>({})
  const [sidebarOpen, setSidebarOpen] = useState(false)

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

  // Listen for the toggle event dispatched from StockHeader's hamburger button
  useEffect(() => {
    const handler = () => setSidebarOpen((v) => !v)
    window.addEventListener('sf:toggleSidebar', handler)
    return () => window.removeEventListener('sf:toggleSidebar', handler)
  }, [])

  // Close sidebar whenever the ticker changes (page navigation)
  useEffect(() => {
    setSidebarOpen(false)
  }, [ticker])

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Backdrop — mobile only, shown when sidebar is open */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-[55]"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        ticker={ticker}
        sidebarPrices={sidebarPrices}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {children}
      </div>
    </div>
  )
}
