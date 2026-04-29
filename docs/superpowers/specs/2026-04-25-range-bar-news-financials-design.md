# Design Spec: 52-Week Range Bar + News Feed + Historical Financials
**Date:** 2026-04-25
**Status:** Approved
**Scope:** Three additive features on the stock ticker detail page (`/stock/[ticker]`)

---

## Overview

Three independent features shipped in priority order:
1. **52-Week High/Low Range Bar** — visual bar in header (zero new API calls)
2. **News Feed** — collapsed section, new `/api/news/[ticker]` route (15-min cache)
3. **Historical Financials Table** — collapsed section, new `/api/financials/[ticker]` route (12h cache)

All data sources are free and keyless (`yahoo-finance2`).

---

## Feature 1: 52-Week High/Low Range Bar

### Placement
Replace the plain text 52W range (`$low – $high`) in the header quick-stats row with a compact visual bar.

### Visual Layout
```
52W  $142.00 ──────●──────── $237.00   68%
```
- Thin horizontal bar, gradient: red (left/low) → green (right/high)
- White dot marker at `(currentPrice - low) / (high - low) * 100%` from the left
- Percentage label to the right showing position in range
- Low/high dollar values flanking the bar

### Component
Inline `RangeBar` component in `app/stock/[ticker]/page.tsx`:
```typescript
function RangeBar({ low, high, current }: { low: number; high: number; current: number }) {
  const pct = Math.max(0, Math.min(100, ((current - low) / (high - low)) * 100))
  // renders gradient bar + dot + labels
}
```

### Data
All fields already fetched — `data.fundamentals.fiftyTwoWeekLow`, `fiftyTwoWeekHigh`, `data.currentPrice`.
**Zero new API calls or cache changes.**

### Placement in JSX
Replaces the `52W $low – $high` span in the header quick-stats row (line ~1004–1011 of `page.tsx`).

---

## Feature 2: News Feed Per Ticker

### Placement
Collapsed section at the bottom of the main content, after `EarningsWidget`, before `Latest Indicator Values`.

### UX
- Default state: collapsed. Header button "Recent News ▸" toggles open.
- Expanded: list of up to 8 headlines
- Each row: headline title (external link, opens new tab), publisher badge, time-ago label (`"X min ago"` / `"X hr ago"` / `"X days ago"`)
- No pagination

### API Route
**File:** `app/api/news/[ticker]/route.ts`

```typescript
GET /api/news/:ticker
Response: { items: NewsItem[] }

interface NewsItem {
  title: string
  link: string
  publisher: string
  publishedAt: number  // unix timestamp
}
```

- Calls `yahooFinance.search(ticker, { newsCount: 8 })`
- Maps `result.news[]` → `{ title, link, publisher, providerPublishTime }`
- Cache key: `news:${ticker}`, TTL: 15 minutes (`15 * 60 * 1000`)
- Follows standard route pattern: `isValidTicker` guard → cache check → fetch → cache set → return JSON
- Error: `{ error: 'Failed to load news' }` with status 500

### State in StockPage
```typescript
const [news, setNews] = useState<NewsItem[] | null>(null)
const [showNews, setShowNews] = useState(false)

// fetch on mount (same pattern as earnings/analyst)
useEffect(() => {
  if (!ticker) return
  fetch(`/api/news/${ticker}`)
    .then(r => r.json())
    .then(d => { if (!d.error) setNews(d.items) })
    .catch(() => {})
}, [ticker])
```

### Types
Add `NewsItem` interface to `lib/types.ts`.

---

## Feature 3: Historical Financials Table

### Placement
Collapsed section immediately after `FundamentalsSection` (Key Statistics), before `ShortInterestWidget`.

### UX
- Default state: collapsed. Header button "Historical Financials ▸" toggles open.
- Expanded: Annual / Quarterly tab toggle (default: Annual)
- Table layout: metrics as rows, time periods as columns
- **Annual:** 4 most recent fiscal years, newest left
- **Quarterly:** 8 most recent quarters, newest left
- **Rows:** Revenue, Gross Profit, Net Income, EPS (Basic)
- Each cell: formatted value + growth badge (▲ green / ▼ red %) vs prior period
- Numbers formatted with `fmtCap()` for Revenue/Profit/Income; `$X.XX` for EPS

### Growth Calculation
- Annual: YoY % = `(current - prior) / |prior| * 100`
- Quarterly: QoQ % = `(current - prior) / |prior| * 100`
- Null if prior period is 0 or null

### API Route
**File:** `app/api/financials/[ticker]/route.ts`

```typescript
GET /api/financials/:ticker
Response: {
  annual: FinancialsRow[]    // 4 entries, newest first
  quarterly: FinancialsRow[] // 8 entries, newest first
}

interface FinancialsRow {
  period: string        // "FY2024" or "Q3 2024"
  revenue: number | null
  grossProfit: number | null
  netIncome: number | null
  eps: number | null
  revenueGrowth: number | null      // fractional, e.g. 0.12 = +12%
  grossProfitGrowth: number | null
  netIncomeGrowth: number | null
  epsGrowth: number | null
}
```

- Calls `quoteSummary(ticker, { modules: ['incomeStatementHistory', 'incomeStatementHistoryQuarterly'] }, { validateResult: false }).catch(() => null)`
- Maps `incomeStatementHistory.incomeStatementHistory` → annual rows (up to 4)
- Maps `incomeStatementHistoryQuarterly.incomeStatementHistory` → quarterly rows (up to 8)
- Growth computed server-side before caching
- Cache key: `financials:${ticker}`, TTL: 12 hours (`12 * 60 * 1000`)
- Returns `{ annual: [], quarterly: [] }` (empty arrays) if module unavailable

### Types
Add `FinancialsRow` and `FinancialsData` interfaces to `lib/types.ts`:
```typescript
export interface FinancialsRow { ... }
export interface FinancialsData {
  annual: FinancialsRow[]
  quarterly: FinancialsRow[]
}
```

### State in StockPage
```typescript
const [financials, setFinancials] = useState<FinancialsData | null>(null)

useEffect(() => {
  if (!ticker) return
  fetch(`/api/financials/${ticker}`)
    .then(r => r.json())
    .then(d => { if (!d.error) setFinancials(d) })
    .catch(() => {})
}, [ticker])
```

---

## Page Order (after all three features)

1. Header (range bar in quick-stats row)
2. Range selector + overlay toggles
3. Summary stat cards (RSI, MACD, Analyst)
4. Volume chart
5. Price & Moving Averages chart
6. RSI chart
7. MACD chart
8. Key Statistics — `FundamentalsSection` (expanded)
9. **Historical Financials** — collapsed by default ← NEW
10. Short Interest widget
11. Earnings widget
12. **News Feed** — collapsed by default ← NEW
13. Latest Indicator Values

---

## Constraints
- No new npm packages
- All `p-4` card padding (matches recent spacing reduction)
- Section toggle state is local (`useState`) — not persisted to localStorage
- TypeScript strict: all new types in `lib/types.ts`, all routes pass `npx tsc --noEmit`
- Error messages safe for client exposure (no stack traces)

---

## Out of Scope
- Insider Transactions Feed (planned next sprint)
- Chart rendering of historical financials (table only for now)
- News search / filtering
- News images or article previews
