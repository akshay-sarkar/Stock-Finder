# Design Spec: UI Polish — News Date, Short Interest Header, Financials/Earnings Grid
**Date:** 2026-04-25
**Status:** Approved
**Scope:** Three UI-only changes to `app/stock/[ticker]/page.tsx`. Zero new API calls.

---

## Change 1: News — Add Absolute Date/Time

**Current:** Each news item shows relative time only (`"2h ago"`).

**New:** Show relative time + absolute date: `"2h ago · Apr 25"`.

**Implementation:**
- In `NewsWidget`, inside the `timeAgo` helper (or alongside it), add a `fmtNewsDate` helper:
  ```typescript
  function fmtNewsDate(ts: number): string {
    return new Date(ts * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
  ```
- In the JSX, replace the single timestamp span with two inline pieces:
  ```tsx
  <span className="text-[10px] text-gray-400">{timeAgo(item.publishedAt)} · {fmtNewsDate(item.publishedAt)}</span>
  ```
- Only rendered when `item.publishedAt > 0` (existing guard).

---

## Change 2: Short Interest → Header Quick-Stats Row

**Current:** `ShortInterestWidget` is a full card below Key Statistics showing Short Float %, Short Ratio, Shares Short.

**New:** Move Short Float % into the header quick-stats row, next to Dividend Yield. Remove the `ShortInterestWidget` card entirely.

**Header quick-stats row — after change:**
```
P/E  X.X×  |  [range bar]  |  Div X.XX%  |  Short X.X%  |  Updated HH:MM
```

**Implementation:**
- In the header quick-stats row JSX (inside the `{data.fundamentals && (...)}` block), add after the Dividend Yield span:
  ```tsx
  {data.fundamentals.shortPercentOfFloat != null && (
    <span className="text-xs text-slate-400">
      Short&nbsp;
      <span className={`font-semibold ${data.fundamentals.shortPercentOfFloat > 0.20 ? 'text-red-400' : 'text-white'}`}>
        {(data.fundamentals.shortPercentOfFloat * 100).toFixed(1)}%
      </span>
    </span>
  )}
  ```
- Remove the `{data.fundamentals && <ShortInterestWidget fundamentals={data.fundamentals} />}` line from the main content.
- Keep the `ShortInterestWidget` component definition in the file (no dead-code cleanup needed; it simply won't be rendered).

---

## Change 3: Financials + Earnings Side-by-Side Grid, Above News

**Current page order (relevant section):**
1. Key Statistics (full width)
2. Historical Financials (full width, collapsed)
3. Short Interest (full width card) ← removed by Change 2
4. Earnings (full width)
5. News Feed (full width, collapsed)
6. Latest Indicator Values

**New page order:**
1. Key Statistics (full width)
2. `grid grid-cols-2 gap-4` row:
   - col 1: Historical Financials (collapsed)
   - col 2: Earnings
3. News Feed (full width, collapsed)
4. Latest Indicator Values

**Implementation:**
- Wrap the Historical Financials block and the Earnings block in a single `<div className="grid grid-cols-2 gap-4">`.
- Both cards keep their existing collapse/expand behavior unchanged.
- The grid div replaces the three separate blocks (Financials, Short Interest card, Earnings) that currently appear in sequence.
- Each card must have `h-full` or `flex flex-col` to stretch to equal height within the row (optional but clean).

**Exact JSX structure:**
```tsx
{/* Financials + Earnings — 2-column grid */}
<div className="grid grid-cols-2 gap-4">
  {/* Historical Financials */}
  {financials && (financials.annual.length > 0 || financials.quarterly.length > 0) && (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      {/* existing collapse button + FinancialsWidget */}
    </div>
  )}
  {/* Earnings */}
  {earnings && <EarningsWidget data={earnings} />}
</div>

{/* News Feed */}
{news && news.length > 0 && (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
    {/* existing news section */}
  </div>
)}
```

Note: If `financials` is null/empty (e.g. ETF), skip the grid entirely and render Earnings full-width. Use a conditional:
- If `financials` has data → render the 2-col grid with both
- Otherwise → render `{earnings && <EarningsWidget data={earnings} />}` full-width as before

---

## Constraints
- All changes in `app/stock/[ticker]/page.tsx` only
- No new state, no new API calls
- `npx tsc --noEmit` must pass after changes
- Card padding stays at `p-4` (matches recent spacing reduction)
