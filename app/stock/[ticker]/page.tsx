'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ResponsiveContainer,
  ComposedChart,
  LineChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts'
import { ArrowLeft, TrendingUp, ExternalLink } from 'lucide-react'
import { DEFAULT_TICKERS, COMPANY_NAMES } from '@/lib/stockList'
import { isValidTicker } from '@/lib/validation'
import type { StockDetailData, StockFundamentals } from '@/lib/types'

// ─── Date range config ────────────────────────────────────────────────────────
const DATE_RANGES = [
  { label: '1M',  fetchDays: 320,  interval: '1d'  as const, displayPoints: 22   },
  { label: '3M',  fetchDays: 320,  interval: '1d'  as const, displayPoints: 65   },
  { label: '6M',  fetchDays: 320,  interval: '1d'  as const, displayPoints: 130  },
  { label: '1Y',  fetchDays: 380,  interval: '1d'  as const, displayPoints: 252  },
  { label: '2Y',  fetchDays: 740,  interval: '1d'  as const, displayPoints: 504  },
  { label: '5Y',  fetchDays: 1830, interval: '1wk' as const, displayPoints: 260  },
] as const
type Range = (typeof DATE_RANGES)[number]

// ─── Indicator descriptions ────────────────────────────────────────────────────
const INDICATOR_HINTS: Record<string, string> = {
  Close:
    'Closing price for the period. The most commonly referenced price — used for all indicator calculations.',
  EMA20:
    'Exponential Moving Average (20 periods). Weights recent prices more heavily, making it react faster than SMA. Great for identifying short-term momentum shifts.',
  SMA50:
    'Simple Moving Average (50 periods). Evenly averages the last 50 closing prices. Tracks the medium-term trend — price above SMA50 is generally considered bullish.',
  SMA200:
    'Simple Moving Average (200 periods). Tracks the long-term trend. Golden Cross: SMA50 rises above SMA200 → bullish signal. Death Cross: SMA50 falls below SMA200 → bearish signal.',
  'RSI(14)':
    'Relative Strength Index (14 periods). Oscillator scaled 0–100. Below 30 = oversold (possible bounce). Above 70 = overbought (possible pullback). Neutral zone: 30–70.',
  MACD:
    'MACD Line = 12-period EMA minus 26-period EMA. Positive = bullish momentum, Negative = bearish momentum.',
  Signal:
    'Signal Line = 9-period EMA of the MACD line. MACD crossing above Signal → bullish. MACD crossing below Signal → bearish.',
  Histogram:
    'MACD Histogram = MACD minus Signal. Positive & growing bars = strengthening bullish momentum. Shrinking or negative = weakening or bearish momentum.',
  Volume:
    'Number of shares traded. High volume on a price move confirms the strength of that move. Low-volume moves are less reliable.',
  'Vol SMA(20)':
    'Rolling 20-period average of volume. Bars exceeding this dotted line indicate above-average participation — often tied to earnings, news, or institutional activity.',
  // Bollinger Bands
  'BB Upper':
    'Bollinger Upper Band (SMA20 + 2 standard deviations). Price touching or exceeding this line is statistically unusual — may signal overbought conditions or a strong breakout.',
  'BB Middle':
    'Bollinger Middle Band = 20-period Simple Moving Average. Acts as the mean-reversion anchor. Price tends to oscillate around this line.',
  'BB Lower':
    'Bollinger Lower Band (SMA20 − 2 standard deviations). Price touching or breaking below this line may indicate oversold conditions or a breakdown.',
}

// ─── Hover tooltip component ──────────────────────────────────────────────────
// Replaces <abbr title> which is unreliable inside recharts and small screens.
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

// ─── Custom recharts Legend using HintTooltip ─────────────────────────────────
interface LegendPayloadItem { color: string; value: string; type?: string }
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

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmtPrice(n: number) {
  return n >= 1000
    ? n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : n.toFixed(2)
}
function fmtVol(n: number) {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B'
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(0) + 'K'
  return n.toString()
}
function tickDate(d: string) { return d?.slice(5) ?? '' }

// Tooltip formatters
function priceFormatter(v: unknown, name: string): [string, string] {
  if (v == null || isNaN(Number(v))) return ['—', name]
  return [`$${Number(v).toFixed(2)}`, name]
}
function rsiFormatter(v: unknown, name: string): [string, string] {
  if (v == null || isNaN(Number(v))) return ['—', name]
  return [Number(v).toFixed(2), name]
}
function macdFormatter(v: unknown, name: string): [string, string] {
  if (v == null || isNaN(Number(v))) return ['—', name]
  return [Number(v).toFixed(4), name]
}
function volFormatter(v: unknown, name: string): [string, string] {
  if (v == null || isNaN(Number(v))) return ['—', name]
  return [fmtVol(Number(v)), name]
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

// ─── Fundamentals formatters ──────────────────────────────────────────────────
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

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color }: {
  label: string; value: string; sub?: string; color?: string
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color ?? 'text-gray-800'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
    </div>
  )
}

// ─── Fundamentals Row ─────────────────────────────────────────────────────────
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

// ─── Fundamentals section ─────────────────────────────────────────────────────
function FundamentalsSection({ f }: { f: StockFundamentals }) {
  const [growthView, setGrowthView] = useState<'yoy' | 'qoq'>('yoy')

  const revGrowth  = fmtPctChange(growthView === 'yoy' ? f.revenueGrowth  : f.revenueGrowthQoQ)
  const earnGrowth = fmtPctChange(growthView === 'yoy' ? f.earningsGrowth : f.earningsGrowthQoQ)
  const grossMarg  = growthView === 'qoq' && f.grossMarginsQoQ != null
    ? fmtPct(f.grossMarginsQoQ)
    : fmtPct(f.grossMargins)

  const hasQoQ = f.revenueGrowthQoQ != null || f.earningsGrowthQoQ != null

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      <div className="flex items-center gap-3 mb-4">
        <h3 className="text-sm font-semibold text-gray-700">Key Statistics</h3>
        {/* YoY / QoQ toggle — only show if QoQ data is available */}
        <div className="flex items-center rounded-lg border border-gray-200 overflow-hidden text-xs font-medium">
          <button
            onClick={() => setGrowthView('yoy')}
            className={`px-2.5 py-1 transition-colors ${
              growthView === 'yoy'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-500 hover:bg-gray-50'
            }`}
          >
            YoY
          </button>
          <button
            onClick={() => setGrowthView('qoq')}
            className={`px-2.5 py-1 transition-colors border-l border-gray-200 ${
              growthView === 'qoq'
                ? 'bg-blue-600 text-white'
                : hasQoQ ? 'bg-white text-gray-500 hover:bg-gray-50' : 'bg-gray-50 text-gray-300 cursor-not-allowed'
            }`}
            disabled={!hasQoQ}
            title={hasQoQ ? 'Quarter-over-Quarter (sequential quarters)' : 'QoQ data not available for this ticker'}
          >
            QoQ
          </button>
        </div>
        <span className="text-[11px] text-gray-400 italic">
          {growthView === 'yoy'
            ? 'Year-over-Year (trailing annual)'
            : 'Quarter-over-Quarter (most recent vs prior quarter)'}
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-0">
        {/* Valuation */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Valuation</p>
          <FundRow label="Market Cap"    value={fmtCap(f.marketCap)}     hint="Total market value of all outstanding shares." />
          <FundRow label="P/E (TTM)"     value={fmtMult(f.trailingPE)}   hint="Trailing P/E: share price ÷ earnings per share (past 12 months). Lower = cheaper relative to earnings." />
          <FundRow label="Forward P/E"   value={fmtMult(f.forwardPE)}    hint="Forward P/E: share price ÷ next 12 months' expected earnings. Reflects analyst growth expectations." />
          <FundRow label="Price / Book"  value={fmtMult(f.priceToBook)}  hint="Share price ÷ book value per share. P/B < 1 may indicate the stock is trading below its net asset value." />
          <FundRow label="Price / Sales" value={fmtMult(f.priceToSales)} hint="Market cap ÷ annual revenue. Useful for evaluating unprofitable or high-growth companies." />
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

        {/* Financials */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Financials</p>
          <FundRow
            label="Revenue Growth"
            value={revGrowth.text}
            positive={revGrowth.positive}
            hint={growthView === 'yoy'
              ? 'Year-over-year revenue growth (trailing 12 months vs prior year). Sustained positive growth indicates business expansion.'
              : 'Quarter-over-quarter revenue growth (most recent quarter vs prior quarter). Useful for spotting acceleration or deceleration in near-term momentum.'}
          />
          <FundRow
            label="Earnings Growth"
            value={earnGrowth.text}
            positive={earnGrowth.positive}
            hint={growthView === 'yoy'
              ? 'Year-over-year earnings (net income) growth. Accelerating EPS growth often drives share price appreciation.'
              : 'Quarter-over-quarter net income growth. Sequential acceleration in profitability is a strong near-term bullish signal.'}
          />
          <FundRow label="Profit Margin"   value={fmtPct(f.profitMargins)}  hint="Net income ÷ revenue (trailing 12 months). Higher margins mean more pricing power and operational efficiency." />
          <FundRow
            label={growthView === 'qoq' && f.grossMarginsQoQ != null ? 'Gross Margin (MRQ)' : 'Gross Margin'}
            value={grossMarg}
            hint={growthView === 'qoq' && f.grossMarginsQoQ != null
              ? 'Gross profit ÷ revenue for the most recent quarter. Comparing to the TTM figure highlights seasonal or structural margin shifts.'
              : 'Gross profit ÷ revenue (trailing 12 months). High gross margins leave more room for R&D, marketing, and growth.'}
          />
          <FundRow label="Current Ratio"   value={fmtMult(f.currentRatio, '')} hint="Current assets ÷ current liabilities. Ratio > 1 means the company can cover short-term obligations." />
          <FundRow
            label="Debt / Equity"
            value={f.debtToEquity != null ? `${f.debtToEquity.toFixed(1)}%` : 'N/A'}
            hint="Total debt as a % of shareholders' equity. High D/E = more leverage and financial risk."
          />
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function StockPage() {
  const params = useParams()
  const router = useRouter()
  const ticker = (params?.ticker as string)?.toUpperCase() ?? ''

  const [data, setData]       = useState<StockDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [range, setRange]     = useState<Range>(DATE_RANGES[3]) // default 1Y

  // ── Chart overlay toggles (persisted to localStorage) ─────────────────────
  const [showBB, setShowBB] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('sf-chart-bb') === 'true'
  })
  const toggleBB = () => setShowBB(prev => {
    const next = !prev
    localStorage.setItem('sf-chart-bb', String(next))
    return next
  })

  // ── Guard: redirect to home if ticker is invalid ──────────────────────────
  useEffect(() => {
    if (ticker && !isValidTicker(ticker)) {
      router.replace('/')
    }
  }, [ticker, router])

  // Sidebar price changes — populated from screener cache (no extra Yahoo calls)
  const [sidebarPrices, setSidebarPrices] =
    useState<Record<string, { price: number; changePercent: number }>>({})

  useEffect(() => {
    fetch('/api/prices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tickers: DEFAULT_TICKERS }),
    })
      .then(r => r.json())
      .then(d => setSidebarPrices(d.prices ?? {}))
      .catch(() => {}) // non-critical — sidebar still works without prices
  }, [])

  const fetchData = useCallback((r: Range) => {
    if (!ticker || !isValidTicker(ticker)) return
    setLoading(true)
    setError(null)
    const url =
      `/api/stock/${ticker}` +
      `?days=${r.fetchDays}&interval=${r.interval}&display=${r.displayPoints}`
    fetch(url)
      .then((res) => res.json())
      .then((d) => {
        if (d.error) throw new Error(d.error)
        setData(d)
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [ticker])

  useEffect(() => { fetchData(range) }, [fetchData, range])

  // ── Sidebar — always rendered ──────────────────────────────────────────────
  const Sidebar = (
    <aside className="w-[170px] shrink-0 bg-slate-900 border-r border-slate-700 sticky top-0 h-screen overflow-y-auto z-10">
      <div className="px-3 py-4">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3 px-1">
          Watchlist
        </p>
        <nav className="space-y-0.5">
          {DEFAULT_TICKERS.map((t) => {
            const priceData = sidebarPrices[t]
            const isActive  = t === ticker
            return (
              <Link
                key={t}
                href={`/stock/${t}`}
                className={`flex items-center justify-between gap-1 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {/* Left: ticker + company name */}
                <span className="flex flex-col min-w-0 flex-1">
                  <span className="font-semibold leading-tight">{t}</span>
                  {COMPANY_NAMES[t] && (
                    <span className={`truncate leading-tight text-[10px] ${
                      isActive ? 'text-blue-200' : 'text-slate-500'
                    }`}>
                      {COMPANY_NAMES[t]}
                    </span>
                  )}
                </span>

                {/* Right: price + change% or active dot */}
                {isActive ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-white opacity-80 shrink-0" />
                ) : priceData ? (
                  <span className="flex flex-col items-end shrink-0 tabular-nums">
                    <span className="text-[10px] text-slate-300 leading-tight">
                      ${priceData.price >= 1000
                        ? priceData.price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
                        : priceData.price.toFixed(2)}
                    </span>
                    <span className={`text-[10px] font-medium leading-tight ${
                      priceData.changePercent >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {priceData.changePercent >= 0 ? '+' : ''}
                      {priceData.changePercent.toFixed(1)}%
                    </span>
                  </span>
                ) : null}
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        {Sidebar}
          <div className="flex-1 flex flex-col">
          <header className="bg-slate-900 text-white shadow-lg">
            <div className="px-4 py-4 flex items-center gap-4">
              <Link href="/" className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors text-sm">
                <ArrowLeft size={15} /> Screener
              </Link>
              <span className="text-slate-300 font-semibold">{ticker}</span>
            </div>
          </header>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <svg className="animate-spin h-8 w-8 text-blue-500 mx-auto mb-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <p className="text-gray-500 text-sm">Loading {ticker} ({range.label})…</p>
              {range.label === '5Y' && (
                <p className="text-gray-400 text-xs mt-1">5Y weekly fetch may take a few seconds</p>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        {Sidebar}
          <div className="flex-1 flex flex-col">
          <header className="bg-slate-900 text-white shadow-lg">
            <div className="px-4 py-4 flex items-center gap-4">
              <Link href="/" className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors text-sm">
                <ArrowLeft size={15} /> Screener
              </Link>
              <span className="text-slate-300 font-semibold">{ticker}</span>
            </div>
          </header>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-red-500 mb-4">{error ?? 'Failed to load data'}</p>
              <button onClick={() => router.push('/')} className="text-blue-600 hover:underline text-sm">
                ← Back to Screener
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const ind      = data.latestIndicators
  const changeUp = data.changePercent >= 0
  const isWeekly = range.interval === '1wk'

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* ── Sidebar ── */}
      {Sidebar}

      {/* ── Main content ── */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <header className="bg-slate-900 text-white shadow-lg">
          <div className="px-4 py-3 flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors text-sm shrink-0"
            >
              <ArrowLeft size={15} /> Screener
            </Link>
            <div className="flex items-center gap-3">
              <TrendingUp size={22} className="text-emerald-400 shrink-0" />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold leading-tight">{ticker}</h1>
                  <a
                    href={`https://www.google.com/finance/quote/${ticker}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="View on Google Finance"
                    className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-white border border-blue-700 hover:border-blue-400 hover:bg-blue-700/40 rounded px-1.5 py-0.5 transition-colors"
                  >
                    <ExternalLink size={10} />
                    Google
                  </a>
                </div>
                <p className="text-slate-400 text-xs">{data.companyName ?? COMPANY_NAMES[ticker]}</p>
              </div>
            </div>
            <div className="ml-auto text-right">
              <p className="text-xl font-bold">${fmtPrice(data.currentPrice)}</p>
              <p className={`text-sm ${changeUp ? 'text-emerald-400' : 'text-red-400'}`}>
                {changeUp ? '+' : ''}{data.change.toFixed(2)}&nbsp;
                ({changeUp ? '+' : ''}{data.changePercent.toFixed(2)}%)
              </p>
            </div>
          </div>
          {/* Quick stats row — P/E, 52W range, Dividend */}
          {data.fundamentals && (
            <div className="px-4 pb-2.5 flex flex-wrap gap-x-5 gap-y-1 border-t border-slate-700/60 pt-2">
              {data.fundamentals.trailingPE != null && (
                <span className="text-xs text-slate-400">
                  P/E&nbsp;<span className="text-white font-semibold">{data.fundamentals.trailingPE.toFixed(1)}×</span>
                </span>
              )}
              {data.fundamentals.fiftyTwoWeekHigh != null && data.fundamentals.fiftyTwoWeekLow != null && (
                <span className="text-xs text-slate-400">
                  52W&nbsp;
                  <span className="text-red-400 font-semibold">${fmtPrice(data.fundamentals.fiftyTwoWeekLow)}</span>
                  <span className="text-slate-500 mx-1">–</span>
                  <span className="text-emerald-400 font-semibold">${fmtPrice(data.fundamentals.fiftyTwoWeekHigh)}</span>
                </span>
              )}
              {data.fundamentals.dividendYield != null && data.fundamentals.dividendYield > 0 && (
                <span className="text-xs text-slate-400">
                  Div&nbsp;<span className="text-amber-400 font-semibold">{(data.fundamentals.dividendYield * 100).toFixed(2)}%</span>
                </span>
              )}
            </div>
          )}
        </header>

        <main className="px-4 py-6 space-y-6">
          {/* Range Selector + Chart Overlays */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wide mr-1">Range:</span>
            {DATE_RANGES.map((r) => (
              <button
                key={r.label}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  range.label === r.label
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white border border-gray-300 text-gray-600 hover:border-blue-400 hover:text-blue-600'
                }`}
              >
                {r.label}
              </button>
            ))}
            {isWeekly && (
              <span className="ml-1 text-xs text-blue-500 bg-blue-50 border border-blue-100 px-2 py-1 rounded">
                Weekly candles
              </span>
            )}
            {/* ── Overlay toggles ── */}
            <span className="text-xs text-gray-300 ml-3 mr-1 hidden sm:inline">|</span>
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wide mr-1 hidden sm:inline">Overlays:</span>
            <button
              onClick={toggleBB}
              title="Bollinger Bands (20, ±2σ)"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                showBB
                  ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                  : 'bg-white border-gray-300 text-gray-600 hover:border-violet-400 hover:text-violet-600'
              }`}
            >
              BB
            </button>
            <span className="ml-auto text-xs text-gray-400 italic hidden md:block">
              Hover legend labels for descriptions
            </span>
          </div>

          {/* Indicator Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                  : ind.macdHistogram > 0 ? 'Above signal' : 'Below signal'
              }
              color={ind.macdHistogram > 0 ? 'text-emerald-600' : 'text-red-500'}
            />
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

          {/* Volume Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center gap-4 mb-4">
              <h3 className="text-sm font-semibold text-gray-700">Volume</h3>
              <span className="flex items-center gap-1.5 text-xs text-gray-400">
                <span className="inline-block w-5 border-t-2 border-dashed border-red-400" />
                Vol SMA(20) — 20-period avg
              </span>
            </div>
            <ResponsiveContainer width="100%" height={130}>
              <ComposedChart data={data.chartData} margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                <XAxis dataKey="date" tickFormatter={tickDate} tick={{ fontSize: 9 }} interval="preserveStartEnd" />
                <YAxis tickFormatter={fmtVol} tick={{ fontSize: 9 }} width={45} />
                <Tooltip formatter={volFormatter} labelFormatter={(l) => `📅 ${l}`} {...tooltipStyle} />
                <Bar  dataKey="volume"   fill="#94a3b8" name="Volume"       radius={[1, 1, 0, 0]} />
                <Line dataKey="volSma20" stroke="#ef4444" name="Vol SMA(20)"
                      dot={false} strokeWidth={1.5} strokeDasharray="5 3"
                      connectNulls={false} type="monotone" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Price + Moving Averages Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-4">
              <h3 className="text-sm font-semibold text-gray-700">
                Price &amp; Moving Averages
                <span className="text-gray-400 font-normal ml-2 text-xs">
                  ({data.chartData.length} {isWeekly ? 'weeks' : 'days'})
                </span>
              </h3>
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
                <Line type="monotone" dataKey="close"  stroke="#2563eb" dot={false} name="Close"  strokeWidth={2}   connectNulls={false} />
                <Line type="monotone" dataKey="ema20"  stroke="#10b981" dot={false} name="EMA20"  strokeWidth={1.2} connectNulls={false} strokeDasharray="4 3" />
                <Line type="monotone" dataKey="sma50"  stroke="#f59e0b" dot={false} name="SMA50"  strokeWidth={1.5} connectNulls={false} />
                <Line type="monotone" dataKey="sma200" stroke="#ef4444" dot={false} name="SMA200" strokeWidth={1.5} connectNulls={false} />
                {/* Bollinger Bands — shown only when toggled on */}
                {showBB && <>
                  <Line type="monotone" dataKey="bbUpper"  stroke="#7c3aed" dot={false} name="BB Upper"  strokeWidth={1}   connectNulls={false} strokeDasharray="5 3" />
                  <Line type="monotone" dataKey="bbMiddle" stroke="#a78bfa" dot={false} name="BB Middle" strokeWidth={1}   connectNulls={false} strokeDasharray="2 2" />
                  <Line type="monotone" dataKey="bbLower"  stroke="#7c3aed" dot={false} name="BB Lower"  strokeWidth={1}   connectNulls={false} strokeDasharray="5 3" />
                </>}
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* RSI Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">RSI (14)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={data.chartData} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tickFormatter={tickDate} tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis domain={[0, 100]} ticks={[0, 30, 50, 70, 100]} tick={{ fontSize: 10 }} width={35} />
                <Tooltip formatter={rsiFormatter} labelFormatter={(l) => `📅 ${l}`} {...tooltipStyle} />
                <Legend content={<ChartLegend />} />
                <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="5 3"
                  label={{ value: 'Overbought 70', position: 'insideTopRight', fontSize: 10, fill: '#ef4444' }} />
                <ReferenceLine y={30} stroke="#10b981" strokeDasharray="5 3"
                  label={{ value: 'Oversold 30', position: 'insideBottomRight', fontSize: 10, fill: '#10b981' }} />
                <ReferenceLine y={50} stroke="#d1d5db" strokeDasharray="2 2" />
                <Line type="monotone" dataKey="rsi" stroke="#8b5cf6" dot={false}
                      name="RSI(14)" strokeWidth={2} connectNulls={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* MACD Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">MACD (12, 26, 9)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={data.chartData} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tickFormatter={tickDate} tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10 }} width={50} />
                <Tooltip formatter={macdFormatter} labelFormatter={(l) => `📅 ${l}`} {...tooltipStyle} />
                <Legend content={<ChartLegend />} />
                <ReferenceLine y={0} stroke="#6b7280" />
                <Bar  dataKey="macdHistogram" name="Histogram" fill="#94a3b8" radius={[1, 1, 0, 0]} />
                <Line type="monotone" dataKey="macd"       stroke="#2563eb" dot={false} name="MACD"   strokeWidth={2}   connectNulls={false} />
                <Line type="monotone" dataKey="macdSignal" stroke="#ef4444" dot={false} name="Signal" strokeWidth={1.5} connectNulls={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Key Statistics */}
          {data.fundamentals ? (
            <FundamentalsSection f={data.fundamentals} />
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 text-center text-sm text-gray-400">
              Key statistics not available for this ticker (e.g. ETFs may not have P/E or dividend data).
            </div>
          )}

          {/* Latest Indicator Values */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Latest Indicator Values</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-0 text-sm">
              {(
                [
                  ['RSI(14)',        ind.rsi],
                  ['MACD Line',      ind.macd.toFixed(4)],
                  ['MACD Signal',    ind.macdSignal.toFixed(4)],
                  ['MACD Histogram', ind.macdHistogram.toFixed(4)],
                  ['EMA(20)',        `$${ind.ema20.toFixed(2)}`],
                  ['SMA(50)',        `$${ind.sma50.toFixed(2)}`],
                  ['SMA(200)',       ind.sma200 ? `$${ind.sma200.toFixed(2)}` : 'N/A'],
                  ['Volume Ratio',   `${ind.volumeRatio.toFixed(2)}×`],
                ] as [string, string | number][]
              ).map(([label, value]) => (
                <div key={label} className="flex justify-between border-b border-gray-100 py-1.5">
                  <span className="text-gray-400 text-xs">{label}</span>
                  <span className="font-medium text-gray-800 text-xs">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </main>

        <footer className="text-center text-xs text-gray-400 py-6 border-t mt-4">
          Data via Yahoo Finance · Not financial advice · For educational use only
        </footer>
      </div>
    </div>
  )
}
