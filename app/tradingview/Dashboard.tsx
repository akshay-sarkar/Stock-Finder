'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { PaneConfig } from './components/PaneControls'

const ChartPane = dynamic(
  () => import('./components/ChartPane').then(m => m.ChartPane),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full bg-slate-900 border border-slate-700">
        <span className="text-slate-500 text-sm animate-pulse">Loading chart…</span>
      </div>
    ),
  }
)

type PaneCount = 1 | 2 | 4 | 6 | 8
const PANE_COUNTS: PaneCount[] = [1, 2, 4, 6, 8]

const GRID_CLASS: Record<PaneCount, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  4: 'grid-cols-2 grid-rows-2',
  6: 'grid-cols-3 grid-rows-2',
  8: 'grid-cols-4 grid-rows-2',
}

const DEFAULT_SYMBOLS = ['AAPL', 'SPY', 'QQQ', 'MSFT', 'NVDA', 'TSLA', 'AMZN', 'META']

function defaultPane(i: number): PaneConfig {
  return {
    id: `pane-${i}`,
    source: 'stock',
    symbol: DEFAULT_SYMBOLS[i] ?? 'AAPL',
    interval: '1d',
    showRSI: false,
    showMACD: false,
    showWR: false,
    showBB: false,
    showVP: false,
    showFVG: false,
  }
}

export function Dashboard() {
  const [paneCount, setPaneCount] = useState<PaneCount>(1)
  const [panes, setPanes] = useState<PaneConfig[]>(() =>
    Array.from({ length: 8 }, (_, i) => defaultPane(i))
  )
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const savedCount = localStorage.getItem('tv-pane-count')
      if (savedCount) setPaneCount(JSON.parse(savedCount) as PaneCount)
      const savedPanes = localStorage.getItem('tv-panes')
      if (savedPanes) setPanes(JSON.parse(savedPanes) as PaneConfig[])
    } catch {}
  }, [])

  useEffect(() => {
    if (!mounted) return
    localStorage.setItem('tv-pane-count', JSON.stringify(paneCount))
  }, [paneCount, mounted])

  useEffect(() => {
    if (!mounted) return
    localStorage.setItem('tv-panes', JSON.stringify(panes))
  }, [panes, mounted])

  const handlePaneChange = (index: number, config: PaneConfig) => {
    setPanes(prev => {
      const next = [...prev]
      next[index] = config
      return next
    })
  }

  const activePanes = panes.slice(0, paneCount)

  return (
    <div className="flex flex-col h-screen bg-slate-950 overflow-hidden">
      {/* Nav */}
      <div className="flex items-center gap-3 px-3 py-2 bg-slate-900 border-b border-slate-700 shrink-0">
        <Link href="/" className="text-slate-400 hover:text-white text-sm transition-colors">
          ← Back
        </Link>
        <span className="text-white font-semibold text-sm">Trading Dashboard</span>

        <div className="ml-auto flex items-center gap-1">
          <span className="text-slate-500 text-xs mr-2">Panes</span>
          {PANE_COUNTS.map(n => (
            <button
              key={n}
              onClick={() => setPaneCount(n)}
              className={`w-7 h-7 rounded text-xs font-medium transition-colors ${
                paneCount === n
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Chart grid */}
      <div className={`grid ${GRID_CLASS[paneCount]} flex-1 min-h-0 gap-px bg-slate-800`}>
        {activePanes.map((pane, i) => (
          <ChartPane
            key={pane.id}
            config={pane}
            onConfigChange={cfg => handlePaneChange(i, cfg)}
          />
        ))}
      </div>
    </div>
  )
}
