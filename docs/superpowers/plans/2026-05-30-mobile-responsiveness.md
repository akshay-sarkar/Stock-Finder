# Mobile Responsiveness — Remaining Fixes

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the four remaining mobile layout issues on the Stock Detail page, as identified in `docs/manus/mobile-friendly/Mobile-Friendly-Improvement.md`.

**Architecture:** All changes are pure Tailwind CSS responsive-class edits — no new components, no JS, no API changes. Desktop layouts are untouched. Each task touches exactly one file and is independently shippable.

**Tech Stack:** Next.js 14 App Router, Tailwind CSS, TypeScript.

---

## Already Done (skip these)

- ✅ Mobile hamburger nav / MobileNav drawer in both headers
- ✅ Screener results mobile card view
- ✅ FilterCard scan button full-width on mobile
- ✅ Market Movers responsive grid
- ✅ FundamentalsSection `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`

---

## File Map

| File | Change |
|------|--------|
| `app/stock/[ticker]/StockPageClient.tsx` | Two `grid grid-cols-2` → `grid grid-cols-1 md:grid-cols-2` (lines 166, 215) |
| `app/stock/components/RangeSelector.tsx` | Split into two flex rows: Range row + Overlays row |
| `app/stock/components/QuickStatsBar.tsx` | Add `flex-wrap` to short interest chips; `shrink-0` on timestamp |
| `app/stock/components/RelatedStocksStrip.tsx` | `w-40` → `w-36 sm:w-40` on stock cards |

---

## Task 1: Fix StockPageClient two-column widget grids

**Why this matters:** `grid grid-cols-2 gap-4` with no responsive prefix forces a 2-column layout at all screen sizes. On a 375px phone with `px-4` padding, each column is ~163px — too narrow for `AnalystWidget` and `EarningsWidget` to render legibly.

**Files:**
- Modify: `app/stock/[ticker]/StockPageClient.tsx`

- [ ] **Step 1: Find and fix the LatestIndicatorsTable + AnalystWidget grid (line 166)**

  Find this exact line:
  ```tsx
  <div className="grid grid-cols-2 gap-4">
    <LatestIndicatorsTable data={data} />
    {analyst && <AnalystWidget data={analyst} currentPrice={data.currentPrice} ticker={ticker} />}
  </div>
  ```

  Replace the opening div:
  ```tsx
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <LatestIndicatorsTable data={data} />
    {analyst && <AnalystWidget data={analyst} currentPrice={data.currentPrice} ticker={ticker} />}
  </div>
  ```

- [ ] **Step 2: Find and fix the FinancialsWidget + EarningsWidget grid (line 215)**

  Find this exact line:
  ```tsx
  <div className="grid grid-cols-2 gap-4">
  ```
  (inside the `financials || earnings || financialsLoading` block, ~line 215)

  Replace:
  ```tsx
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  ```

- [ ] **Step 3: Type-check**

  ```bash
  npx tsc --noEmit 2>&1 | head -20
  ```
  Expected: no output (no errors).

- [ ] **Step 4: Visual verify at 375px**

  ```bash
  npm run dev
  ```
  Open `http://localhost:3000/stockv2/AAPL` in Chrome DevTools at 375px (iPhone SE). Confirm:
  - LatestIndicatorsTable takes full width, AnalystWidget stacks below it
  - FinancialsWidget takes full width, EarningsWidget stacks below it

- [ ] **Step 5: Commit**

  ```bash
  git add "app/stock/[ticker]/StockPageClient.tsx"
  git commit -m "fix(mobile): stack indicator/analyst and financials/earnings grids on mobile"
  ```

---

## Task 2: RangeSelector — two-row mobile layout

**Why this matters:** All 13 buttons (6 range + 6 overlay + 1 all-toggle) sit in one `flex flex-wrap` container. On mobile they collapse into a chaotic blob. The "Overlays:" label is `hidden sm:inline`, so mobile users see unlabeled toggle buttons with no visual grouping.

**Files:**
- Modify: `app/stock/components/RangeSelector.tsx`

- [ ] **Step 1: Replace the single-div return block with a two-row layout**

  The current `return (...)` starts with:
  ```tsx
  return (
    <div className="flex items-center gap-2 flex-wrap">
  ```

  Replace the **entire return block** with:
  ```tsx
  return (
    <div className="flex flex-col gap-2">
      {/* Row 1: Range selectors */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-gray-400 font-medium uppercase tracking-wide mr-1">Range:</span>
        {DATE_RANGES.map((r) => (
          <button
            key={r.label}
            onClick={() => onRangeChange(r)}
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
        <span className="ml-auto text-xs text-gray-400 italic hidden md:block">
          Hover legend labels for descriptions
        </span>
      </div>

      {/* Row 2: Overlay toggles */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-gray-400 font-medium uppercase tracking-wide mr-1">Overlays:</span>
        <button
          onClick={onToggleEMA9}
          title="Exponential Moving Average (9 periods)"
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
            showEMA9
              ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
              : 'bg-white border-gray-300 text-gray-600 hover:border-purple-400 hover:text-purple-600'
          }`}
        >
          EMA9
        </button>
        <button
          onClick={onToggleEMA20}
          title="Exponential Moving Average (20 periods)"
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
            showEMA20
              ? 'bg-green-600 text-white border-green-600 shadow-sm'
              : 'bg-white border-gray-300 text-gray-600 hover:border-green-400 hover:text-green-600'
          }`}
        >
          EMA20
        </button>
        <button
          onClick={onToggleSMA20}
          title="Simple Moving Average (20 periods)"
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
            showSMA20
              ? 'bg-cyan-600 text-white border-cyan-600 shadow-sm'
              : 'bg-white border-gray-300 text-gray-600 hover:border-cyan-400 hover:text-cyan-600'
          }`}
        >
          SMA20
        </button>
        <button
          onClick={onToggleSMA50}
          title="Simple Moving Average (50 periods)"
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
            showSMA50
              ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
              : 'bg-white border-gray-300 text-gray-600 hover:border-amber-400 hover:text-amber-600'
          }`}
        >
          SMA50
        </button>
        <button
          onClick={onToggleSMA200}
          title="Simple Moving Average (200 periods)"
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
            showSMA200
              ? 'bg-red-600 text-white border-red-600 shadow-sm'
              : 'bg-white border-gray-300 text-gray-600 hover:border-red-400 hover:text-red-600'
          }`}
        >
          SMA200
        </button>
        <button
          onClick={onToggleBB}
          title="Bollinger Bands (20, ±2σ)"
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
            showBB
              ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
              : 'bg-white border-gray-300 text-gray-600 hover:border-violet-400 hover:text-violet-600'
          }`}
        >
          BB
        </button>
        <button
          onClick={onToggleAllOverlays}
          title={allOverlaysOn ? 'Disable all overlays' : 'Enable all overlays'}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ml-2 ${
            allOverlaysOn
              ? 'bg-slate-700 text-white border-slate-700 shadow-sm'
              : anyOverlaysOn
                ? 'bg-slate-100 text-slate-700 border-slate-300 hover:border-slate-400'
                : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
          }`}
        >
          {allOverlaysOn ? 'All On' : anyOverlaysOn ? 'Mixed' : 'All Off'}
        </button>
      </div>
    </div>
  )
  ```

  Keep all existing variable declarations above the return (`isWeekly`, `allOverlaysOn`, `anyOverlaysOn`) — they are still used.

- [ ] **Step 2: Type-check**

  ```bash
  npx tsc --noEmit 2>&1 | head -20
  ```
  Expected: no output.

- [ ] **Step 3: Visual verify at 375px**

  Open `http://localhost:3000/stockv2/AAPL` at 375px. Confirm:
  - Row 1 shows "Range:" label followed by `1M 3M 6M 1Y 2Y 5Y` buttons
  - Row 2 shows "Overlays:" label followed by `EMA9 EMA20 SMA20 SMA50 SMA200 BB All Off` buttons
  - Both rows wrap cleanly within the screen width

- [ ] **Step 4: Commit**

  ```bash
  git add app/stock/components/RangeSelector.tsx
  git commit -m "fix(mobile): split RangeSelector into Range row and Overlays row"
  ```

---

## Task 3: QuickStatsBar — short interest chips wrap on mobile

**Why this matters:** The short interest sub-section (`Short Float`, `Ratio`, `Shares`) renders as `flex gap-2` with no `flex-wrap`. On a 375px screen these three chips can overflow horizontally. The `lastUpdated` timestamp should not compress the stats when wrapping.

**Files:**
- Modify: `app/stock/components/QuickStatsBar.tsx`

- [ ] **Step 1: Add `flex-wrap` to the short interest inner div**

  Find this line (~line 69):
  ```tsx
  <div className="flex gap-2 text-xs">
  ```
  (inside the block guarded by `fundamentals.shortPercentOfFloat != null || ...`)

  Replace with:
  ```tsx
  <div className="flex flex-wrap gap-x-2 gap-y-1 text-xs">
  ```

- [ ] **Step 2: Add `shrink-0` to the lastUpdated timestamp**

  Find this block (~line 98):
  ```tsx
  {lastUpdated && (
    <span className="text-xs text-slate-500 italic">
      Updated {lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
    </span>
  )}
  ```

  Replace:
  ```tsx
  {lastUpdated && (
    <span className="text-xs text-slate-500 italic shrink-0">
      Updated {lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
    </span>
  )}
  ```

- [ ] **Step 3: Type-check**

  ```bash
  npx tsc --noEmit 2>&1 | head -20
  ```
  Expected: no output.

- [ ] **Step 4: Visual verify at 375px with a high-short-float ticker**

  Open `http://localhost:3000/stockv2/GME` at 375px. Confirm:
  - Short Float, Ratio, and Shares chips wrap to a new line instead of overflowing
  - "Updated HH:MM" timestamp stays on screen without being clipped

- [ ] **Step 5: Commit**

  ```bash
  git add app/stock/components/QuickStatsBar.tsx
  git commit -m "fix(mobile): allow short interest chips to wrap on narrow screens"
  ```

---

## Task 4: RelatedStocksStrip — narrower cards on mobile

**Why this matters:** Each card is `w-40` (160px) fixed. On a 375px screen with 16px padding only ~2.2 cards are visible, making it unclear whether the strip is scrollable. `w-36` (144px) on mobile lets ~2.5 cards show, which provides a natural scroll affordance.

**Files:**
- Modify: `app/stock/components/RelatedStocksStrip.tsx`

- [ ] **Step 1: Locate the stock card Link element**

  Find the `<Link>` element (~line 63) that renders each related stock. Its className contains `w-40`:
  ```tsx
  className="flex flex-col gap-1.5 px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors text-xs shrink-0 w-40"
  ```

- [ ] **Step 2: Replace `w-40` with `w-36 sm:w-40`**

  ```tsx
  className="flex flex-col gap-1.5 px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors text-xs shrink-0 w-36 sm:w-40"
  ```

- [ ] **Step 3: Type-check**

  ```bash
  npx tsc --noEmit 2>&1 | head -20
  ```
  Expected: no output.

- [ ] **Step 4: Visual verify at 375px**

  Open `http://localhost:3000/stockv2/AAPL` at 375px. Confirm:
  - Cards are slightly narrower (144px vs 160px)
  - Part of the 3rd card is visible, hinting that the strip scrolls horizontally

- [ ] **Step 5: Commit**

  ```bash
  git add app/stock/components/RelatedStocksStrip.tsx
  git commit -m "fix(mobile): narrow related stock cards on mobile for scroll affordance"
  ```

---

## Self-Review

**Spec coverage (from `docs/manus/mobile-friendly/Mobile-Friendly-Improvement.md`):**
- [x] Responsive sidebar toggle → already done (MobileNav hamburger)
- [x] Header navigation collapse → already done
- [x] Related stocks adaptive display → Task 4
- [x] Table/data optimization → Task 1 (widget grids)
- [x] RangeSelector touch-friendly, organized → Task 2
- [x] QuickStatsBar overflow → Task 3
- [x] Touch target sizing → buttons already `px-3 py-1.5` (~40px tap height), acceptable

**Placeholder scan:** No TBD, TODO, or vague instructions. All steps contain exact code.

**Type consistency:** No new types. All changes are `className` string edits only.
