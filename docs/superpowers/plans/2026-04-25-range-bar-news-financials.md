# Range Bar + News Feed + Historical Financials Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a 52-week range bar to the stock page header, a collapsible news feed, and a collapsible historical financials table — all using free, keyless yahoo-finance2 data.

**Architecture:** Three independent UI additions to `app/stock/[ticker]/page.tsx`. The range bar is a pure component using already-fetched data. News and financials each get their own API route following the existing `earnings`/`analyst` pattern (isValidTicker guard → cache check → yahoo fetch → cache set → JSON). Both new sections are collapsed by default with a toggle button.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, yahoo-finance2 v3, in-memory TTL cache

---

## Task 1: Add Types

**Files:**
- Modify: `lib/types.ts`

- [ ] **Step 1: Add NewsItem, FinancialsRow, FinancialsData to lib/types.ts**

Open `lib/types.ts` and append after the existing `AnalystData` interface:

```typescript
export interface NewsItem {
  title: string
  link: string
  publisher: string
  publishedAt: number  // unix timestamp (seconds)
}

export interface FinancialsRow {
  period: string           // "FY2024" or "Q3 2024"
  revenue: number | null
  grossProfit: number | null
  operatingIncome: number | null
  netIncome: number | null
  revenueGrowth: number | null       // fractional: 0.12 = +12%
  grossProfitGrowth: number | null
  operatingIncomeGrowth: number | null
  netIncomeGrowth: number | null
}

export interface FinancialsData {
  annual: FinancialsRow[]    // up to 4 fiscal years, newest first
  quarterly: FinancialsRow[] // up to 8 quarters, newest first
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/types.ts
git commit -m "feat: add NewsItem, FinancialsRow, FinancialsData types"
```

---

## Task 2: 52-Week High/Low Range Bar

**Files:**
- Modify: `app/stock/[ticker]/page.tsx`

- [ ] **Step 1: Add RangeBar component**

In `app/stock/[ticker]/page.tsx`, add this component after the `FundRow` component definition (around line 223):

```typescript
// ─── 52-Week Range Bar ────────────────────────────────────────────────────────
function RangeBar({ low, high, current }: { low: number; high: number; current: number }) {
  const pct = Math.max(0, Math.min(100, ((current - low) / (high - low)) * 100))
  return (
    <span className="flex items-center gap-1.5 text-xs text-slate-400">
      <span className="text-red-400 font-semibold">${fmtPrice(low)}</span>
      <span className="relative w-20 h-1.5 rounded-full overflow-visible shrink-0"
        style={{ background: 'linear-gradient(to right, #ef4444, #10b981)' }}>
        <span
          className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white border-2 border-slate-600 shadow"
          style={{ left: `calc(${pct}% - 5px)` }}
        />
      </span>
      <span className="text-emerald-400 font-semibold">${fmtPrice(high)}</span>
      <span className="text-slate-500">({pct.toFixed(0)}%)</span>
    </span>
  )
}
```

- [ ] **Step 2: Replace text 52W range in header with RangeBar**

In the header quick-stats row (search for `fiftyTwoWeekHigh` in the main return), replace:

```tsx
{data.fundamentals.fiftyTwoWeekHigh != null && data.fundamentals.fiftyTwoWeekLow != null && (
  <span className="text-xs text-slate-400">
    52W&nbsp;
    <span className="text-red-400 font-semibold">${fmtPrice(data.fundamentals.fiftyTwoWeekLow)}</span>
    <span className="text-slate-500 mx-1">–</span>
    <span className="text-emerald-400 font-semibold">${fmtPrice(data.fundamentals.fiftyTwoWeekHigh)}</span>
  </span>
)}
```

with:

```tsx
{data.fundamentals.fiftyTwoWeekHigh != null && data.fundamentals.fiftyTwoWeekLow != null && (
  <RangeBar
    low={data.fundamentals.fiftyTwoWeekLow}
    high={data.fundamentals.fiftyTwoWeekHigh}
    current={data.currentPrice}
  />
)}
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 4: Verify visually**

Start dev server (`npm run dev`), open `/stock/AAPL`. The header quick-stats row should show a gradient bar with a white dot marker between the red low and green high prices. The percentage should reflect where the current price sits in the 52-week range.

- [ ] **Step 5: Commit**

```bash
git add app/stock/\[ticker\]/page.tsx
git commit -m "feat: add 52-week high/low range bar to stock page header"
```

---

## Task 3: News API Route

**Files:**
- Modify: `lib/yahoo.ts`
- Create: `app/api/news/[ticker]/route.ts`

- [ ] **Step 1: Add getNews function to lib/yahoo.ts**

In `lib/yahoo.ts`, add this import at the top (after the existing type imports):

```typescript
import type { OHLCVBar, StockFundamentals, EarningsData, EarningsHistoryEntry, AnalystData, NewsItem } from './types'
```

Then append `getNews` after `getAnalystData`:

```typescript
/**
 * Fetches recent news headlines for a ticker via yahoo-finance2 search.
 * Returns up to 8 items. Gracefully returns [] if unavailable.
 */
export async function getNews(ticker: string): Promise<NewsItem[]> {
  const result: any = await (yahooFinance as any).search(ticker, { newsCount: 8 }).catch(() => null)
  if (!result?.news?.length) return []
  return result.news
    .filter((n: any) => n.title && n.link)
    .map((n: any): NewsItem => ({
      title: n.title,
      link: n.link,
      publisher: n.publisher ?? '',
      publishedAt: n.providerPublishTime ?? 0,
    }))
}
```

- [ ] **Step 2: Create app/api/news/[ticker]/route.ts**

```typescript
import { NextResponse } from 'next/server'
import { isValidTicker } from '@/lib/validation'
import { cacheGet, cacheSet } from '@/lib/cache'
import { getNews } from '@/lib/yahoo'

const TTL = 15 * 60 * 1000 // 15 minutes

export async function GET(
  _req: Request,
  { params }: { params: { ticker: string } }
) {
  const ticker = params.ticker.toUpperCase()
  if (!isValidTicker(ticker)) {
    return NextResponse.json({ error: 'Invalid ticker' }, { status: 400 })
  }

  const cacheKey = `news:${ticker}`
  const cached = cacheGet(cacheKey)
  if (cached) return NextResponse.json(cached)

  try {
    const items = await getNews(ticker)
    const payload = { items }
    cacheSet(cacheKey, payload, TTL)
    return NextResponse.json(payload)
  } catch (err) {
    console.error(`[news/${ticker}]`, err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'Failed to load news' }, { status: 500 })
  }
}
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 4: Verify API**

Start dev server and run:
```bash
curl "http://localhost:3000/api/news/AAPL"
```
Expected: `{ "items": [ { "title": "...", "link": "...", "publisher": "...", "publishedAt": 1234567890 }, ... ] }`

- [ ] **Step 5: Commit**

```bash
git add lib/yahoo.ts app/api/news
git commit -m "feat: add news API route with 15-min cache"
```

---

## Task 4: News Widget in Stock Page

**Files:**
- Modify: `app/stock/[ticker]/page.tsx`

- [ ] **Step 1: Add NewsWidget component**

Add after the `EarningsWidget` component definition (around line 473):

```typescript
// ─── News Widget ──────────────────────────────────────────────────────────────
function NewsWidget({ items }: { items: NewsItem[] }) {
  if (!items.length) return null

  function timeAgo(ts: number): string {
    const diff = Math.floor(Date.now() / 1000) - ts
    if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  return (
    <div className="divide-y divide-gray-50">
      {items.map((item, i) => (
        <a
          key={i}
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-start gap-3 py-2.5 hover:bg-gray-50 rounded transition-colors px-1 -mx-1"
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-800 leading-snug line-clamp-2">{item.title}</p>
            <div className="flex items-center gap-2 mt-0.5">
              {item.publisher && (
                <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-medium">
                  {item.publisher}
                </span>
              )}
              {item.publishedAt > 0 && (
                <span className="text-[10px] text-gray-400">{timeAgo(item.publishedAt)}</span>
              )}
            </div>
          </div>
          <ExternalLink size={12} className="text-gray-300 shrink-0 mt-1" />
        </a>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Add news state and fetch to StockPage**

In the `StockPage` component, add after the existing `analyst` state declarations:

```typescript
const [news, setNews] = useState<NewsItem[] | null>(null)
const [showNews, setShowNews] = useState(false)
```

Add a new `useEffect` after the analyst fetch effect:

```typescript
useEffect(() => {
  if (!ticker || !isValidTicker(ticker)) return
  fetch(`/api/news/${ticker}`)
    .then(r => r.json())
    .then(d => { if (!d.error) setNews(d.items) })
    .catch(() => {})
}, [ticker])
```

- [ ] **Step 3: Add import for NewsItem type**

Ensure `NewsItem` is imported at the top of the file:

```typescript
import type { StockDetailData, StockFundamentals, EarningsData, AnalystData, NewsItem } from '@/lib/types'
```

- [ ] **Step 4: Add collapsed News section to page render**

In the `<main>` section, add after `{earnings && <EarningsWidget data={earnings} />}`:

```tsx
{/* News Feed — collapsed by default */}
{news && news.length > 0 && (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
    <button
      onClick={() => setShowNews(v => !v)}
      className="w-full flex items-center justify-between text-sm font-semibold text-gray-700"
    >
      <span>Recent News</span>
      <span className="text-gray-400 text-xs font-normal">{showNews ? '▲ collapse' : '▶ expand'}</span>
    </button>
    {showNews && (
      <div className="mt-3">
        <NewsWidget items={news} />
      </div>
    )}
  </div>
)}
```

- [ ] **Step 5: Type-check**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 6: Verify visually**

Open `/stock/AAPL`. Scroll to the bottom of the page. A "Recent News ▶ expand" card should appear after the Earnings widget. Clicking it should reveal a list of headlines with publisher badges and time-ago labels. Each headline should open in a new tab.

- [ ] **Step 7: Commit**

```bash
git add app/stock/\[ticker\]/page.tsx
git commit -m "feat: add collapsible news feed to stock detail page"
```

---

## Task 5: Financials API Route

**Files:**
- Modify: `lib/yahoo.ts`
- Create: `app/api/financials/[ticker]/route.ts`

- [ ] **Step 1: Add getFinancials function to lib/yahoo.ts**

Update the import at the top of `lib/yahoo.ts` (replacing the one updated in Task 3):

```typescript
import type { OHLCVBar, StockFundamentals, EarningsData, EarningsHistoryEntry, AnalystData, NewsItem, FinancialsRow, FinancialsData } from './types'
```

Append `getFinancials` after `getNews`:

```typescript
/**
 * Fetches annual (4 years) and quarterly (8 quarters) income statement data.
 * Returns { annual: [], quarterly: [] } gracefully if modules unavailable.
 */
export async function getFinancials(ticker: string): Promise<FinancialsData> {
  const result = await yahooFinance.quoteSummary(ticker, {
    modules: ['incomeStatementHistory', 'incomeStatementHistoryQuarterly'],
  }, { validateResult: false }).catch(() => null)

  function toLabel(date: any, type: 'annual' | 'quarterly'): string {
    const d = date instanceof Date ? date : new Date(date)
    if (type === 'annual') return `FY${d.getFullYear()}`
    const q = Math.ceil((d.getMonth() + 1) / 3)
    return `Q${q} ${d.getFullYear()}`
  }

  function growth(current: number | null, prior: number | null): number | null {
    if (current == null || prior == null || prior === 0) return null
    return (current - prior) / Math.abs(prior)
  }

  function mapRows(entries: any[], type: 'annual' | 'quarterly'): FinancialsRow[] {
    return entries.map((e: any, i: number): FinancialsRow => {
      const prev = entries[i + 1] ?? null
      const rev  = e.totalRevenue    ?? null
      const gp   = e.grossProfit     ?? null
      const oi   = e.operatingIncome ?? null
      const ni   = e.netIncome       ?? null
      return {
        period:                toLabel(e.endDate, type),
        revenue:               rev,
        grossProfit:           gp,
        operatingIncome:       oi,
        netIncome:             ni,
        revenueGrowth:         growth(rev, prev?.totalRevenue    ?? null),
        grossProfitGrowth:     growth(gp,  prev?.grossProfit     ?? null),
        operatingIncomeGrowth: growth(oi,  prev?.operatingIncome ?? null),
        netIncomeGrowth:       growth(ni,  prev?.netIncome       ?? null),
      }
    })
  }

  const annualEntries: any[]    = result?.incomeStatementHistory?.incomeStatementHistory ?? []
  const quarterlyEntries: any[] = result?.incomeStatementHistoryQuarterly?.incomeStatementHistory ?? []

  return {
    annual:    mapRows(annualEntries.slice(0, 4),    'annual'),
    quarterly: mapRows(quarterlyEntries.slice(0, 8), 'quarterly'),
  }
}
```

- [ ] **Step 2: Create app/api/financials/[ticker]/route.ts**

```typescript
import { NextResponse } from 'next/server'
import { isValidTicker } from '@/lib/validation'
import { cacheGet, cacheSet } from '@/lib/cache'
import { getFinancials } from '@/lib/yahoo'

const TTL = 12 * 60 * 60 * 1000 // 12 hours

export async function GET(
  _req: Request,
  { params }: { params: { ticker: string } }
) {
  const ticker = params.ticker.toUpperCase()
  if (!isValidTicker(ticker)) {
    return NextResponse.json({ error: 'Invalid ticker' }, { status: 400 })
  }

  const cacheKey = `financials:${ticker}`
  const cached = cacheGet(cacheKey)
  if (cached) return NextResponse.json(cached)

  try {
    const data = await getFinancials(ticker)
    cacheSet(cacheKey, data, TTL)
    return NextResponse.json(data)
  } catch (err) {
    console.error(`[financials/${ticker}]`, err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'Failed to load financials' }, { status: 500 })
  }
}
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 4: Verify API**

```bash
curl "http://localhost:3000/api/financials/AAPL"
```
Expected: `{ "annual": [ { "period": "FY2024", "revenue": 391035000000, ... }, ... ], "quarterly": [ ... ] }`

- [ ] **Step 5: Commit**

```bash
git add lib/yahoo.ts app/api/financials
git commit -m "feat: add financials API route with 12h cache"
```

---

## Task 6: Historical Financials Widget in Stock Page

**Files:**
- Modify: `app/stock/[ticker]/page.tsx`

- [ ] **Step 1: Add FinancialsWidget component**

Add after the `NewsWidget` component definition:

```typescript
// ─── Historical Financials Widget ─────────────────────────────────────────────
function FinancialsWidget({ data }: { data: FinancialsData }) {
  const [view, setView] = useState<'annual' | 'quarterly'>('annual')
  const rows = view === 'annual' ? data.annual : data.quarterly

  if (!rows.length) return null

  const metrics: { key: keyof FinancialsRow; growthKey: keyof FinancialsRow; label: string }[] = [
    { key: 'revenue',        growthKey: 'revenueGrowth',         label: 'Revenue'           },
    { key: 'grossProfit',    growthKey: 'grossProfitGrowth',     label: 'Gross Profit'      },
    { key: 'operatingIncome',growthKey: 'operatingIncomeGrowth', label: 'Operating Income'  },
    { key: 'netIncome',      growthKey: 'netIncomeGrowth',       label: 'Net Income'        },
  ]

  function fmtGrowth(n: number | null) {
    if (n == null) return null
    const positive = n >= 0
    const text = `${n >= 0 ? '+' : ''}${(n * 100).toFixed(1)}%`
    return (
      <span className={`text-[10px] font-semibold ml-1 ${positive ? 'text-emerald-600' : 'text-red-500'}`}>
        {positive ? '▲' : '▼'} {text}
      </span>
    )
  }

  return (
    <div>
      {/* Tab toggle */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs font-medium">
          <button
            onClick={() => setView('annual')}
            className={`px-3 py-1 transition-colors ${view === 'annual' ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
          >
            Annual
          </button>
          <button
            onClick={() => setView('quarterly')}
            className={`px-3 py-1 border-l border-gray-200 transition-colors ${view === 'quarterly' ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
          >
            Quarterly
          </button>
        </div>
        <span className="text-[11px] text-gray-400 italic">
          {view === 'annual' ? 'Last 4 fiscal years' : 'Last 8 quarters'}, newest first
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left text-gray-400 font-medium pb-1.5 pr-4 w-36">Metric</th>
              {rows.map(r => (
                <th key={r.period} className="text-right text-gray-400 font-medium pb-1.5 pr-3 whitespace-nowrap">
                  {r.period}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {metrics.map(({ key, growthKey, label }) => (
              <tr key={key} className="border-b border-gray-50 last:border-0">
                <td className="py-2 pr-4 text-gray-500 font-medium">{label}</td>
                {rows.map(r => {
                  const val = r[key] as number | null
                  const growth = r[growthKey] as number | null
                  return (
                    <td key={r.period} className="py-2 pr-3 text-right text-gray-800 font-semibold whitespace-nowrap">
                      {val != null ? fmtCap(val) : '—'}
                      {fmtGrowth(growth)}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Add FinancialsData to the import at top of page.tsx**

```typescript
import type { StockDetailData, StockFundamentals, EarningsData, AnalystData, NewsItem, FinancialsData } from '@/lib/types'
```

- [ ] **Step 3: Add financials state and fetch to StockPage**

After the `news` state declarations, add:

```typescript
const [financials, setFinancials] = useState<FinancialsData | null>(null)
const [showFinancials, setShowFinancials] = useState(false)
```

Add a new `useEffect` after the news fetch effect:

```typescript
useEffect(() => {
  if (!ticker || !isValidTicker(ticker)) return
  fetch(`/api/financials/${ticker}`)
    .then(r => r.json())
    .then(d => { if (!d.error) setFinancials(d) })
    .catch(() => {})
}, [ticker])
```

- [ ] **Step 4: Add collapsed Financials section to page render**

In the `<main>` section, add after `{data.fundamentals ? <FundamentalsSection f={data.fundamentals} /> : ...}` and before `{data.fundamentals && <ShortInterestWidget .../>}`:

```tsx
{/* Historical Financials — collapsed by default */}
{financials && (financials.annual.length > 0 || financials.quarterly.length > 0) && (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
    <button
      onClick={() => setShowFinancials(v => !v)}
      className="w-full flex items-center justify-between text-sm font-semibold text-gray-700"
    >
      <span>Historical Financials</span>
      <span className="text-gray-400 text-xs font-normal">{showFinancials ? '▲ collapse' : '▶ expand'}</span>
    </button>
    {showFinancials && (
      <div className="mt-3">
        <FinancialsWidget data={financials} />
      </div>
    )}
  </div>
)}
```

- [ ] **Step 5: Type-check**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 6: Verify visually**

Open `/stock/AAPL`. After Key Statistics, a "Historical Financials ▶ expand" section should appear. Clicking it should show a table with Revenue, Gross Profit, Operating Income, Net Income columns for 4 fiscal years. The Annual/Quarterly tab toggle should switch to 8 quarters. Green ▲ / red ▼ growth badges should appear next to each value (except the oldest period which has no prior for comparison).

Test an ETF like `/stock/SPY` — the financials section should not appear (returns empty arrays).

- [ ] **Step 7: Final type-check + commit**

```bash
npx tsc --noEmit
git add app/stock/\[ticker\]/page.tsx
git commit -m "feat: add collapsible historical financials table to stock detail page"
```

---

## Final Verification Checklist

- [ ] `/stock/AAPL` header shows gradient range bar with dot marker and percentage
- [ ] Range bar position is accurate (e.g. price near 52W high → dot near right/green end)
- [ ] `/stock/AAPL` shows "Recent News ▶ expand" at bottom; expands to show headlines
- [ ] News links open in new tab
- [ ] `/stock/AAPL` shows "Historical Financials ▶ expand" after Key Statistics; expands to table
- [ ] Annual/Quarterly tab toggle works in financials
- [ ] `/stock/SPY` — financials section absent (ETF, no income statements)
- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `curl http://localhost:3000/api/news/AAPL` returns `{ items: [...] }`
- [ ] `curl http://localhost:3000/api/financials/AAPL` returns `{ annual: [...], quarterly: [...] }`
