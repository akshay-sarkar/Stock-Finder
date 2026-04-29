# UI Polish — News Date, Short Interest Header, Financials/Earnings Grid

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Three UI-only changes to the stock detail page: add absolute date to news items, move Short Float % into the header quick-stats row, and place Historical Financials + Earnings side-by-side in a 2-column grid above the News Feed.

**Architecture:** All changes are in `app/stock/[ticker]/page.tsx` only. No new API calls, no new state, no new files. Changes are surgical edits to existing component JSX and the main render order.

**Tech Stack:** Next.js 14, React, TypeScript, Tailwind CSS

---

## Task 1: Add Absolute Date to News Items

**Files:**
- Modify: `app/stock/[ticker]/page.tsx` — `NewsWidget` component

- [ ] **Step 1: Read the file to locate NewsWidget**

Read `app/stock/[ticker]/page.tsx`. Find the `NewsWidget` component. It contains a `timeAgo` function and renders news items with a timestamp span that looks like:

```tsx
{item.publishedAt > 0 && (
  <span className="text-[10px] text-gray-400">{timeAgo(item.publishedAt)}</span>
)}
```

- [ ] **Step 2: Add fmtNewsDate helper and update the timestamp span**

Inside the `NewsWidget` function body, add `fmtNewsDate` right after the `timeAgo` function:

```typescript
function fmtNewsDate(ts: number): string {
  return new Date(ts * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
```

Then update the timestamp span (the one guarded by `item.publishedAt > 0`) to show both:

```tsx
{item.publishedAt > 0 && (
  <span className="text-[10px] text-gray-400">
    {timeAgo(item.publishedAt)} · {fmtNewsDate(item.publishedAt)}
  </span>
)}
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add "app/stock/[ticker]/page.tsx"
git commit -m "feat: add absolute date to news items"
```

---

## Task 2: Move Short Interest to Header + Remove Widget Card

**Files:**
- Modify: `app/stock/[ticker]/page.tsx` — header quick-stats row + main render

- [ ] **Step 1: Add Short Float % to header quick-stats row**

Read the file. Find the header quick-stats row — it's inside `{data.fundamentals && (...)}` in the `<header>` element. It currently has spans for P/E, 52W range, and Dividend Yield. Add this span AFTER the Dividend Yield span:

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

- [ ] **Step 2: Remove ShortInterestWidget from main render**

In the `<main>` section, find and delete this line:

```tsx
          {/* Short Interest Widget */}
          {data.fundamentals && <ShortInterestWidget fundamentals={data.fundamentals} />}
```

Do NOT delete the `ShortInterestWidget` component definition — only remove the render call.

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add "app/stock/[ticker]/page.tsx"
git commit -m "feat: move short interest to header, remove standalone widget card"
```

---

## Task 3: Financials + Earnings 2-Column Grid, News Below

**Files:**
- Modify: `app/stock/[ticker]/page.tsx` — main render section

- [ ] **Step 1: Read the current render order**

Read the file. In `<main>`, find the current sequence. After Key Statistics it looks like:

```tsx
          {/* Historical Financials — collapsed by default */}
          {financials && (financials.annual.length > 0 || financials.quarterly.length > 0) && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              ...
            </div>
          )}

          {/* Earnings Widget */}
          {earnings && <EarningsWidget data={earnings} />}

          {/* News Feed — collapsed by default */}
          {news && news.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              ...
            </div>
          )}
```

- [ ] **Step 2: Replace the three blocks with the new layout**

Replace the entire sequence from `{/* Historical Financials */}` through `{/* News Feed */}` (all three blocks) with:

```tsx
          {/* Financials + Earnings — 2-column grid when both present; Earnings full-width fallback */}
          {financials && (financials.annual.length > 0 || financials.quarterly.length > 0) ? (
            <div className="grid grid-cols-2 gap-4">
              {/* Historical Financials */}
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

              {/* Earnings */}
              {earnings && <EarningsWidget data={earnings} />}
            </div>
          ) : (
            /* Fallback: no financials data (ETF) — Earnings full width */
            earnings && <EarningsWidget data={earnings} />
          )}

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

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 4: Verify visually**

Start dev server (`npm run dev`). Open `/stock/AAPL`:
- After Key Statistics, a 2-column row should appear: Historical Financials on the left, Earnings on the right
- Clicking "▶ expand" on either should work independently
- News Feed appears below as full-width
- Header quick-stats row shows `Short X.X%` next to Dividend Yield
- News items show `"2h ago · Apr 25"` format

Open `/stock/SPY` (ETF):
- No financials section (empty arrays)
- Earnings section shows full-width (or absent if SPY has no earnings)
- Short interest absent from header if null

- [ ] **Step 5: Commit**

```bash
git add "app/stock/[ticker]/page.tsx"
git commit -m "feat: financials+earnings 2-col grid, news below, short interest in header"
```

---

## Final Verification Checklist

- [ ] News items show `"Xm ago · Apr 25"` (relative + absolute date)
- [ ] Header quick-stats row shows `Short X.X%` in red if > 20%, white if ≤ 20%
- [ ] `ShortInterestWidget` render call removed from main content (component definition kept)
- [ ] Historical Financials and Earnings appear side-by-side (50/50) on `/stock/AAPL`
- [ ] Earnings is full-width on an ETF (e.g. `/stock/SPY`) when no financials available
- [ ] News Feed appears below the Financials/Earnings row
- [ ] Both collapse/expand toggles work independently
- [ ] `npx tsc --noEmit` passes with zero errors
