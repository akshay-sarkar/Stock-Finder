'use client'

import React, { useState } from 'react'
import { StockFundamentals } from '@/lib/types'

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmtCap(n: number | null): string {
  if (n == null) return 'N/A'
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6)  return `$${(n / 1e6).toFixed(1)}M`
  return `$${n.toLocaleString()}`
}
function fmtMult(n: number | null, suffix = '×'): string {
  if (n == null) return 'N/A'
  return `${n.toFixed(2)}${suffix}`
}
function fmtPct(n: number | null): string {
  if (n == null) return 'N/A'
  return `${(n * 100).toFixed(2)}%`
}
function fmtDollar(n: number | null): string {
  if (n == null) return 'N/A'
  return `$${n.toFixed(2)}`
}
function fmtPctChange(n: number | null): { text: string; positive: boolean | null } {
  if (n == null) return { text: 'N/A', positive: null }
  return { text: `${n >= 0 ? '+' : ''}${(n * 100).toFixed(1)}%`, positive: n >= 0 }
}

function HintTooltip({ children, hint }: { children: React.ReactNode; hint: string }) {
  const [show, setShow] = useState(false)

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
          {/* Arrow */}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-gray-900" />
        </span>
      )}
    </span>
  )
}

function FundRow({ label, value, hint, positive }: {
  label: string; value: string; hint?: string; positive?: boolean | null
}) {
  const valColor = positive === true ? 'text-emerald-600' : positive === false ? 'text-red-500' : 'text-gray-800'
  return (
    <div className="flex justify-between items-center border-b border-gray-100 py-2">
      {hint ? (
        <HintTooltip hint={hint}>
          <span className="text-xs text-gray-500 border-b border-dotted border-gray-300">{label}</span>
        </HintTooltip>
      ) : (
        <span className="text-xs text-gray-500">{label}</span>
      )}
      <span className={`text-sm font-semibold ${valColor}`}>{value}</span>
    </div>
  )
}

export function FundamentalsSection({ f }: { f: StockFundamentals }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="flex items-center gap-3 mb-3">
        <h2 className="text-sm font-semibold text-gray-700">Key Statistics</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-0">
        {/* Valuation */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Valuation</p>
          <FundRow label="Market Cap"    value={fmtCap(f.marketCap)}     hint="Total market value of all outstanding shares." />
          <FundRow label="P/E (TTM)"     value={fmtMult(f.trailingPE)}   hint="Trailing P/E: share price ÷ earnings per share (past 12 months). Lower = cheaper relative to earnings." />
          <FundRow label="Forward P/E"   value={fmtMult(f.forwardPE)}    hint="Forward P/E: share price ÷ next 12 months' expected earnings. Reflects analyst growth expectations." />
          <FundRow label="Price / Book"  value={fmtMult(f.priceToBook)}  hint="Share price ÷ book value per share. P/B < 1 may indicate the stock is trading below its net asset value." />
          <FundRow label="Price / Sales" value={fmtMult(f.priceToSales)} hint="Market cap ÷ annual revenue. Useful for evaluating unprofitable or high-growth companies. May be unavailable for some sectors or recently-listed companies." />
        </div>

        {/* Earnings & Dividends */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Earnings &amp; Dividends</p>
          <FundRow label="EPS (TTM)"        value={fmtDollar(f.trailingEps)}  hint="Earnings Per Share (trailing 12 months). Net income ÷ shares outstanding." />
          <FundRow label="Forward EPS"      value={fmtDollar(f.forwardEps)}   hint="Estimated EPS for the next 12 months based on analyst consensus." />
          <FundRow label="Dividend Yield"   value={fmtPct(f.dividendYield)}   hint="Annual dividend as a % of the current share price. Higher yield = more income per dollar invested." />
          <FundRow label="Dividend / Share" value={fmtDollar(f.dividendRate)} hint="Annual dividend paid per share in dollars." />
          <FundRow label="Ex-Div Date"      value={f.exDividendDate ?? 'N/A'} hint="You must own the stock before this date to receive the next dividend payment." />
          <FundRow label="Payout Ratio"     value={fmtPct(f.payoutRatio)}     hint="% of earnings paid as dividends. Ratios above 80% may be unsustainable long-term." />
        </div>

        {/* Risk & Range */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Risk &amp; Range</p>
          <FundRow label="Beta"     value={fmtMult(f.beta, '')}           hint="Volatility vs the S&P 500. Beta > 1 = moves more than the market. Beta < 1 = less volatile." />
          <FundRow label="52W High" value={fmtDollar(f.fiftyTwoWeekHigh)} hint="Highest price in the past 52 weeks. A breakout above this level is a strong bullish signal." />
          <FundRow label="52W Low"  value={fmtDollar(f.fiftyTwoWeekLow)}  hint="Lowest price in the past 52 weeks. Bouncing from this level may signal a support floor." />
        </div>
      </div>
    </div>
  )
}