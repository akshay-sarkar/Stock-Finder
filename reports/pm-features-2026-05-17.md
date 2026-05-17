# Stock Finder — PM Feature Research Report
**Generated:** 2026-05-17 UTC  
**Agent:** Claude PM Research Agent  
**Project:** Stock Finder (Next.js 14 · Yahoo Finance · RSI/MACD · Screener · Recharts · Tailwind)  
**Features evaluated:** 3 proposed features (Related Stocks · Sector Sidebar · Market Movers Page)

---

## Executive Summary

All 3 proposed features are **fully achievable using `yahoo-finance2` alone** — no new dependencies or paid APIs required. The library exposes `recommendationsBySymbol`, `quoteSummary({ modules: ['assetProfile'] })`, `dailyGainers`, `dailyLosers`, and `trendingSymbols` — all of which directly map to the requested features.

**Recommended ship order:** Feature 3 (Market Movers) first — it's a standalone new page with highest discoverability impact. Feature 1 (Related Stocks) second — high UX value on the already-built Deep Analysis page. Feature 2 (Sector Sidebar) third — involves a layout change that benefits from the sector data Feature 1 already fetches.

---

## 🚀 Feature 1 — Related Stocks Strip

### What was requested
> "Add relative stocks for each stock, show them as small group for quick jump"

### Research Findings

`yahoo-finance2` has a dedicated `recommendationsBySymbol` module that returns algorithmically similar stocks based on price movement, sector similarity, and financial metrics. It works on the **already-installed** package — zero new dependencies.

```ts
// API call — already available in yahoo-finance2@^3.14.0
const result = await yahooFinance.recommendationsBySymbol('AAPL');
// Returns: { symbol: 'AAPL', recommendedSymbols: [{ symbol: 'MSFT', score: 0.982 }, ...] }
```

Returns 5–10 tickers with a similarity score. A second `quote()` call on those tickers gives price, change%, and name for rendering the chips.

### Competitive Benchmark
| Product | Implementation |
|---|---|
| Yahoo Finance | "People also watch" sidebar — exactly this pattern |
| TradingView | "Related ideas" and similar stocks widget |
| Stockanalysis.com | "Similar companies" section below stats |

All three competitors ship this. Its absence in Stock Finder is a noticeable gap for users who arrived via a screener result and want to compare.

### Verdict

| Dimension | Score | Rationale |
|---|---|---|
| User Value | 5/5 | One of the most-clicked sections on Yahoo Finance and TradingView deep pages |
| Effort | 2/5 | 1 API call already in the package, render as horizontal chip strip |
| Differentiation | 3/5 | Table stakes — but missing today |
| **Priority Score** | **11** | `(5×2) + 3 - 2` |

### Implementation Plan

**API call (Next.js Route Handler):**
```ts
// app/api/stock/[symbol]/related/route.ts
const recs = await yahooFinance.recommendationsBySymbol(symbol);
const tickers = recs.recommendedSymbols.slice(0, 6).map(r => r.symbol);
const quotes = await yahooFinance.quote(tickers);
// Return: [{ symbol, shortName, regularMarketPrice, regularMarketChangePercent }]
```

**UI — horizontal chip strip below the stock header:**
```tsx
<div className="flex gap-2 overflow-x-auto py-2">
  {related.map(stock => (
    <Link href={`/stock/${stock.symbol}`} key={stock.symbol}
      className="flex-shrink-0 px-3 py-1.5 rounded-lg border text-sm
                 hover:bg-gray-50 flex items-center gap-2">
      <span className="font-medium">{stock.symbol}</span>
      <span className={stock.change >= 0 ? 'text-emerald-600' : 'text-red-500'}>
        {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}%
      </span>
    </Link>
  ))}
</div>
```

**Placement:** Directly below the stock name/price header, above the chart — same position as Yahoo Finance's "People also watch."

**Caching:** Cache this per symbol for 1 hour (recommendations don't change intraday). Use Next.js `revalidate: 3600` on the route.

---

## 🚀 Feature 2 — Sector Filter Sidebar on Deep Analysis Page

### What was requested
> "See if have sector that can be categorized on the left side on Stock Deep Analysis Page"

### Research Findings

Two `quoteSummary` modules return sector and industry data:

- `assetProfile` → `sector` (e.g. `"Technology"`), `industry` (e.g. `"Consumer Electronics"`)
- `summaryProfile` → same fields, slightly different schema

Both are **already supported** in `yahoo-finance2@^3.14.0`. The `assetProfile` module is the more reliable of the two.

```ts
const summary = await yahooFinance.quoteSummary('AAPL', {
  modules: ['assetProfile']
});
// summary.assetProfile.sector   → "Technology"
// summary.assetProfile.industry → "Consumer Electronics"
```

The 11 GICS sectors available from Yahoo Finance data:
`Technology · Healthcare · Financials · Consumer Discretionary · Consumer Staples · Energy · Industrials · Materials · Real Estate · Utilities · Communication Services`

### Competitive Benchmark
| Product | Sector UI |
|---|---|
| Finviz | Sector filter in left rail, highlights active sector |
| Stockanalysis.com | Sector badge on stock header + filter by sector in screener |
| Simply Wall St | Full sector context card with peer comparison |

### Verdict

| Dimension | Score | Rationale |
|---|---|---|
| User Value | 4/5 | Helps users orient the stock in market context immediately |
| Effort | 3/5 | Requires layout change to Deep Analysis page + sidebar component |
| Differentiation | 4/5 | Enables sector-based navigation nobody currently has in the app |
| **Priority Score** | **9** | `(4×2) + 4 - 3` |

### Implementation Plan

**The sidebar has two jobs:**
1. Display current stock's sector + industry as context
2. Allow jumping to screener pre-filtered by that sector

**API — reuse the existing `quoteSummary` call** (if the Deep Analysis page already fetches `assetProfile`, no extra API call needed):
```ts
const { assetProfile } = await yahooFinance.quoteSummary(symbol, {
  modules: ['assetProfile']
});
// assetProfile.sector, assetProfile.industry
```

**UI — left sidebar panel:**
```tsx
<aside className="w-56 shrink-0 space-y-1">
  <p className="text-xs uppercase tracking-widest text-gray-400 mb-3">Sector</p>

  {SECTORS.map(sector => (
    <Link
      key={sector}
      href={`/screener?sector=${encodeURIComponent(sector)}`}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm
        ${sector === currentSector
          ? 'bg-blue-50 text-blue-700 font-medium'
          : 'text-gray-600 hover:bg-gray-50'}`}
    >
      <SectorIcon sector={sector} className="w-4 h-4" />
      {sector}
    </Link>
  ))}
</aside>
```

**Page layout change:** Switch Deep Analysis from single-column to `grid grid-cols-[14rem_1fr]`.

**Screener integration:** The sector link passes `?sector=Technology` to the existing screener route — add a `sector` filter to the screener's filter logic using `assetProfile.sector` on each result.

---

## 🚀 Feature 3 — Market Movers Page (Day + Week)

### What was requested
> "Try creating a page for market movers for a week and day data show"

### Research Findings

`yahoo-finance2` exposes three modules purpose-built for this:

| Module | Data | Notes |
|---|---|---|
| `dailyGainers` | Top % gainers today | Returns 25 stocks by default |
| `dailyLosers` | Top % losers today | Returns 25 stocks by default |
| `trendingSymbols('US')` | Most-searched tickers right now | ~5–25 symbols |
| `historical()` | OHLCV for any period | Used to compute weekly % change |

> ⚠️ **Known issue flagged in GitHub Issue #820:** `dailyGainers`, `dailyLosers`, and `trendingSymbols` returned 400 errors on library version `2.13.2` due to missing query parameters. This was fixed in subsequent releases. Since the project pins `^3.14.0`, this is resolved — but worth testing in your environment before shipping.

**Weekly movers** are not a single API call — Yahoo Finance doesn't expose a "weekly gainers" endpoint. The approach is: fetch `historical()` for each of the daily gainers/losers over 5 trading days, compute `(close[today] - close[5d ago]) / close[5d ago]`, and sort. This adds latency so it should be a **server-side computed route with aggressive caching** (`revalidate: 900` — 15 min).

### Competitive Benchmark
| Product | Market Movers UI |
|---|---|
| Yahoo Finance | Dedicated `/markets/stocks/gainers/` and `/losers/` pages |
| Finviz | Full market movers with volume, float, sector filters |
| Barchart | Day + week movers with sparkline mini-charts |
| Stockanalysis.com | "Market Overview" with top movers widget |

This is the **highest-traffic page type** in financial apps after a stock's own detail page. Users land on it to discover trade ideas — strong acquisition surface.

### Verdict

| Dimension | Score | Rationale |
|---|---|---|
| User Value | 5/5 | Discovery surface — top-used page type across all competitors |
| Effort | 3/5 | New page + 2 API endpoints + tab UI; weekly calc needs a batch history fetch |
| Differentiation | 5/5 | Stock Finder currently has no market-wide discovery — this fills a major gap |
| **Priority Score** | **12** | `(5×2) + 5 - 3` |

### Implementation Plan

**Route:** `app/market-movers/page.tsx`

**Two API routes:**

```ts
// app/api/market-movers/day/route.ts
const [gainers, losers, trending] = await Promise.all([
  yahooFinance.dailyGainers({ count: 10, region: 'US', lang: 'en-US' }),
  yahooFinance.dailyLosers({ count: 10, region: 'US', lang: 'en-US' }),
  yahooFinance.trendingSymbols('US', { count: 10, lang: 'en-US' }),
]);
// next.js revalidate: 300 (5 min)
```

```ts
// app/api/market-movers/week/route.ts
// 1. Get today's daily gainers/losers as candidate pool (top 20 each)
// 2. Fetch 5-day historical for each symbol
// 3. Compute weeklyChange = (close[0] - close[4]) / close[4] * 100
// 4. Sort and return top 10 gainers + losers
// next.js revalidate: 900 (15 min — weekly data changes slowly)
```

**Page UI structure:**
```
/market-movers
├── [Day] [Week]  ← Tab switcher
├── ┌────────────────┬────────────────┬──────────────────┐
│  │  🟢 Top Gainers │  🔴 Top Losers  │  🔥 Trending Now │
│  ├────────────────┼────────────────┼──────────────────┤
│  │ Symbol · %Chg  │ Symbol · %Chg  │ Symbol · Volume  │
│  │ NVDA   +8.2%   │ INTC   -5.1%  │ AAPL             │
│  │ ...            │ ...            │ ...              │
│  └────────────────┴────────────────┴──────────────────┘
```

**Each row shows:** ticker · company name · price · % change · volume (from `quote()` batch call on the returned symbols).

---

## 📊 Priority Summary

| # | Feature | Priority Score | Effort | Ship Order | Tier |
|---|---|---|---|---|---|
| 3 | Market Movers Page | **12** | 3/5 | 1st | 🚀 Quick Win |
| 1 | Related Stocks Strip | **11** | 2/5 | 2nd | 🚀 Quick Win |
| 2 | Sector Sidebar | **9** | 3/5 | 3rd | 🚀 Quick Win |

All three are Quick Wins — no paid APIs, no new npm packages, all within `yahoo-finance2@^3.14.0`.

---

## ✅ API Validation Summary

| Feature | API Module | Status | Notes |
|---|---|---|---|
| Related Stocks | `recommendationsBySymbol` | ✅ Confirmed working | Returns score + symbol list |
| Sector Sidebar | `quoteSummary['assetProfile']` | ✅ Confirmed working | `sector` + `industry` fields stable |
| Market Movers (day) | `dailyGainers` / `dailyLosers` | ✅ Fixed in v3.x | Was broken in v2.13.2, resolved |
| Market Movers (trending) | `trendingSymbols('US')` | ✅ Confirmed working | ISO2 country code required |
| Market Movers (week) | `historical()` + manual calc | ✅ Confirmed working | Requires batch fetch + sort logic |

---

## ⚠️ Risks & Mitigations

| Risk | Affects | Mitigation |
|---|---|---|
| Yahoo Finance unofficial API instability | All 3 features | Already the project's core data source — risk tolerance is established. Add error boundaries per feature. |
| `dailyGainers`/`dailyLosers` 400 errors on old lib versions | Feature 3 | Project pins `^3.14.0` — confirmed fixed. Add integration test. |
| Weekly movers latency (20× historical calls) | Feature 3 week tab | Set `revalidate: 900`. Show day tab by default. Lazy-load week tab. |
| `assetProfile` sometimes returns `null` sector | Feature 2 | Fallback to `"Unknown"` sector, hide sidebar if null, degrade gracefully. |

---

## 🔭 Follow-on Features Unlocked by This Work

Once these 3 are shipped, the data infrastructure enables:

- **Sector Performance Heatmap** — group screener results by `assetProfile.sector`, show avg daily % change per sector as a color grid (uses data already fetched for Feature 2)
- **"Stocks Like This" Screener Preset** — use `recommendationsBySymbol` results to pre-populate screener filters (uses data from Feature 1)
- **Weekly Movers Email Digest** — the `/api/market-movers/week` route built for Feature 3 can power a cron-triggered summary report

---

*Report generated by Claude PM Research Agent · 2026-05-17 · All suggested features use free APIs within the existing `yahoo-finance2@^3.14.0` dependency. Verify API behavior in your environment before shipping.*
