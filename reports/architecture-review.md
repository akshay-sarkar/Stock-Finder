# StockFinder — Architectural Review
*Generated: 2026-05-18*

---

## Executive Summary

StockFinder is a well-organized Next.js 14 App Router application. Foundational decisions — module-scoped TTL cache, `Promise.allSettled` for resilient fan-out, validation helpers, and graceful Yahoo Finance fallbacks — are solid. However there are systemic issues that erode performance and correctness:

1. **Server-to-self HTTP fetches** in `app/stock/[ticker]/page.tsx` cause the server to call its own API routes via loopback, bypassing the in-memory cache and adding marshalling/HTTP overhead. Largest avoidable cost on the detail page.
2. **Per-request `new YahooFinanceClass()` instantiation** in 5 route files instead of the singleton in `lib/yahoo.ts` — duplicate state, no shared notice suppression.
3. **Cache key `screener:${ticker}` is shape-overloaded** — written as rich `TickerSnapshot` by the screener route and as thin `ScreenerSnapshot` by the prices route. Type-unsafe and a latent bug.
4. **`StockPageClient` has 13 useState calls** including 6 boolean overlay flags with near-identical boilerplate — candidate for a single custom hook.
5. **Market-movers endpoints use hardcoded ticker lists** described as "demo" in the code comment but shipped to users.
6. **`export const revalidate`** on POST route handlers (`screener`, `prices`) has zero effect — applies only to fetch-cached GETs.

---

## API Layer Analysis

### `/api/stock/[ticker]` — `app/api/stock/[ticker]/route.ts`
- Cache key includes `fetchDays`, `interval`, `displayPoints` — good granularity.
- Three parallel Yahoo calls (`getHistoricalData`, `getQuote`, `getQuoteSummary`) appropriately fanned out.
- **Issue**: `getQuoteSummary` already has internal `try/catch` returning null; the outer `.catch(() => null)` on line 39 is redundant.
- **Issue**: 404 condition `data.length < 35` is tied to MACD's 26+9 lookback but the client error message gives no actionable info.

### `/api/prices` — `app/api/prices/route.ts`
- Two-tier strategy (cache → live batch) is well-designed.
- **Issue**: Inline `new (require('yahoo-finance2').default)()` — bypasses singleton in `lib/yahoo.ts`. Notice suppression duplicated.
- **Issue**: Writes `screener:${ticker}` with thin `ScreenerSnapshot` while screener route writes rich `TickerSnapshot` with `.ind`. Cache shape is non-deterministic. Any reader must defensively check fields.

### `/api/screener` — `app/api/screener/route.ts`
- `Promise.allSettled` for resilience — correct.
- **Latent bug**: When `screener:${ticker}` was warmed by `/api/prices`, the screener accesses `.ind` on a thin snapshot — silent crash or undefined behavior. Depends on which route populated the key first.
- **Issue**: `export const revalidate = 0` on a POST handler has no effect.

### `/api/analyst/[ticker]`
- Clean, 4h TTL, proper `Cache-Control`. Fine.

### `/api/earnings/[ticker]`
- Mirrors analyst shape. Fine.

### `/api/financials/[ticker]`
- 12h TTL appropriate. `cacheGet(cacheKey)` lacks type parameter — implicit `unknown`.

### `/api/news/[ticker]`
- 15m TTL fine. **Inconsistency**: wraps response in `{ items }` — all other routes return data root directly.

### `/api/congressional-trades`
- Best error handling in codebase. Rate-limited. Good.
- **Issue**: Another inline `new YahooFinanceClass()` — no `suppressNotices`, Yahoo deprecation warnings spam stdout from this route only.
- **Issue**: `enrichWithPrices` does N unique-ticker quote calls in parallel without concurrency cap. Compare with `/api/prices` which caps at 20. Risk of Yahoo throttling on cold start.
- **Opportunity**: Reuse `screener:${ticker}` cache via `cacheGet` before issuing fresh quote calls — amortizes cost with detail page hits.

### `/api/market-movers/day` & `/week`
- **Critical**: Hardcoded ticker lists. Code comment says "For demo purposes". Shipped to production users with stale data.
- **Issue**: `/week` uses deprecated `yahooFinance.historical()` — should use `chart()` like `lib/yahoo.ts`.
- Another inline `new YahooFinanceClass()` each.

### `/api/watchlist-prices`
- Accesses `screener:${ticker}` but reads only `price/changePercent` — works by accident regardless of cache shape.
- **May be dead code**: `app/stock/[ticker]/layout.tsx` POSTs to `/api/prices`, not this route.

### `/api/stock/[ticker]/related`
- For each of 8 related symbols fires `quote + quoteSummary` in parallel = up to 16 calls per detail page load. No concurrency cap.
- Yet another inline `new YahooFinanceClass()`.
- **Improvement**: One batched `quote(symbols[])` call instead of 8 individual pairs.

---

## Caching Architecture Analysis

### `lib/cache.ts`
- Pure in-memory `Map`, no size eviction — unbounded growth in long-lived processes.
- With ~375 tickers × multiple namespaces (`stock`, `screener`, `analyst`, `earnings`, `financials`, `news`, `related`) worst-case ~3000 entries — fine in practice but no LRU cap exists.
- Module scope = no cross-instance coherence on serverless (each cold start = full miss). Expected.
- Lazy expiry deletion on `cacheGet` — good.
- No introspection helpers (`cacheSize`, `cacheDump`) — hard to debug.

### TTL Reference Table

| Route | In-memory TTL | `Cache-Control s-maxage` | `revalidate` export |
|---|---|---|---|
| stock | 10 min | 600 | 600 |
| prices | 10 min | — | (POST, no effect) |
| screener | 10 min | — | 0 (POST, no effect) |
| analyst | 4 h | 14400 | 14400 |
| earnings | 6 h | 21600 | 21600 |
| financials | 12 h | 43200 | 43200 |
| news | 15 min | 900 | 900 |
| congressional | 5 min | none | none |
| market-movers/day | 5 min | 300 | 300 |
| market-movers/week | 15 min | 900 | 900 |
| related | 1 h | 3600 | 3600 |

**Issues:**
- `congressional-trades` sets no `Cache-Control` — CDN won't share across users.
- `revalidate` export on POST routes (`screener`, `prices`) is dead config.
- No native Next.js fetch-cache tags (`revalidateTag`) used anywhere — cache invalidation must be process-restart-based.

### Cache Key Collision
`screener:${ticker}` written by two routes with incompatible shapes:
- `/api/screener`: full `TickerSnapshot` (has `.ind`, `.fundamentals`)
- `/api/prices`: thin `{ price, changePercent, change }`

Consumers reading `.ind` (screener filter logic) receive `undefined` when the thin shape got there first. **Fix**: split into `quote:${ticker}` and `screener:${ticker}`.

---

## React Component Structure Analysis

### `StockPageClient.tsx` — Primary Smell
- **13 `useState` calls** — 6 are localStorage-bound boolean overlay toggles (lines 83–106) with near-identical handler shape. 30+ lines of boilerplate that collapses to one `useLocalStorageBool(key, default)` hook.
- `toggleAllOverlays` duplicates persistence logic from each individual toggle.
- `useState(() => localStorage...)` lazy initializers: SSR branch returns `false`/`true`, client hydrates with localStorage value — **hydration mismatch risk**. Prior commit "fix: hydration mismatch in sidebar expandedSectors state" shows this pattern already caused issues.
- `earnings`, `analyst`, `news` wrapped in `useState` without setters (lines 75–77). These are just props; the `useState` wrapper adds a render cycle with zero benefit.
- `setFinancialsLoading` referenced before its declaration in reading order — works via closures but misleading.

### `Sidebar.tsx`
- `groupedBySector` reduce runs on every render — needs `useMemo`.
- `filteredSidebarTickers` recomputed on every keystroke — needs `useMemo`.
- Two separate `useEffect` blocks for scroll restore + sector expansion — could merge.
- ~375 `<Link>` rows unvirtualized. Acceptable now but watch on slow devices.

### `app/stock/[ticker]/layout.tsx`
- Client component fetches all watchlist prices on mount (line 13). Sidebar shows no prices for 1 RTT on first render.
- Could be a Server Component reading from cache directly — removes a client-side fetch and JS payload.

### Chart Components (`PriceChart`, `RSIChart`, `MACDChart`, `VolumeChart`)
- All wrapped in `React.memo` — correct.
- Tooltip formatter functions recreated per render — not an issue in practice; Recharts rebinds them.

### `FundamentalsSection.tsx`
- 21 `<FundRow>` calls inline — driving from a data array would cut ~50 lines.
- `HintTooltip` uses `useState(show)` per row × ~12 rows = 12 state cells. Pure CSS `:hover` replaces this with zero JS.

### `RelatedStocksStrip.tsx`
- `RelatedStock` type (line 6) duplicated from `app/api/stock/[ticker]/related/route.ts:13`. Should live in `lib/types.ts`.

### `ScreenerClient.tsx`
- `useMemo(() => { setCurrentPage(1) }, [...])` (line 37) — **abusing `useMemo` for side effects**. Must be `useEffect`.

### `StockHeader.tsx`
- Two dropdown groups defined inline (lines 71–125). Extract a `<HeaderDropdown items={[]} />` for DRY.

### `app/market-movers/page.tsx`
- `fetchDayData` / `fetchWeekData` are identical in structure. One parameterized function handles both.

---

## Data Flow & Fetch Patterns

### Critical Anti-Pattern: Server-to-Self Fetch

`app/stock/[ticker]/page.tsx` has five functions (lines 12–65) all doing:
```ts
fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/...`, { next: { revalidate } })
```

This forces the Node runtime to:
1. Open a TCP socket to itself
2. Execute the route handler (which reads the same in-memory cache)
3. Serialize to JSON + HTTP overhead
4. Deserialize in the page

**Fix**: Import `getQuote`, `getHistoricalData`, `getEarnings`, `getAnalystData`, `getNews`, `getFinancials` + `computeIndicators` directly from `lib/yahoo.ts`. Run them in the Server Component. No HTTP involved, no marshalling. Estimated saving: 50–200ms per page load.

### Client-Side Fetch Count Per Detail Page Load

| Fetch | Where | When |
|---|---|---|
| stockData | Server (via loopback) | SSR |
| earnings | Server (via loopback) | SSR |
| analyst | Server (via loopback) | SSR |
| news | Server (via loopback) | SSR |
| financials | Client (`useEffect`) | After hydration |
| related | Client (`useEffect` in strip) | After mount |
| prices (sidebar) | Client (`useEffect` in layout) | After layout mount |

Three client-side fetches racing against hydration. `financials` (12h cache) could safely move server-side.

### Missed Parallelism
- `app/api/stock/[ticker]/related/route.ts` — one batched `quote(symbols)` call replaces 8 individual `quote+quoteSummary` pairs.
- `app/api/congressional-trades/route.ts` — `enrichWithPrices` needs a concurrency cap (chunk to 20 like `/api/prices`).

---

## `lib/yahoo.ts` Quality Review

### Strengths
- Singleton at module scope with `suppressNotices` set.
- Functions return shaped fallbacks gracefully (`getEarnings`, `getAnalystData`).
- Comments document the free/unkeyed strategy.

### Issues

**`any` used pervasively** — lines 1, 6, 30, 36–47, 98. `yahoo-finance2` ships its own types; they should be imported and used internally.

**`require()` instead of `import`** — line 6: `const YahooFinanceClass = require('yahoo-finance2').default`. Presumably a v3 workaround — verify and migrate to ESM import.

**Singleton bypassed by 5 other files** — defeats the purpose. Expose `export const yf` from this file and consume everywhere.

**No timeout / abort policy** — Yahoo Finance can hang. `AbortSignal.timeout(15_000)` is used in `congressional-trades` but nowhere in `lib/yahoo.ts`. Add a `withTimeout(promise, ms)` helper.

**`getHistoricalData` has no try/catch** — unlike `getEarnings`/`getAnalystData` which return shaped fallbacks. Any Yahoo error throws out to the caller. Inconsistent contract.

**`getNews` uses `(yahooFinance as any).search(...)`** — typing issue with yahoo-finance2 search API. Document or fix with proper cast.

**Duplicate sort-by-date logic** — `getQuoteSummary` (line 198) and `getFinancials` (line 293) both sort descending. Extract `sortByDateDesc<T extends { date: Date }>(arr: T[]): T[]` helper.

---

## Prioritized Improvements

### P0 — Correctness / Architectural Integrity

| # | Issue | Files | Impact |
|---|---|---|---|
| 1 | Eliminate server-to-self fetches | `app/stock/[ticker]/page.tsx` lines 12–65 | -5 HTTP round-trips per page load, ~50–200ms |
| 2 | Fix `screener:${ticker}` shape collision → split `quote:` / `screener:` | `prices/route.ts:51`, `screener/route.ts:51,74`, `watchlist-prices/route.ts:27` | Eliminates latent `.ind` undefined crash |
| 3 | Consolidate Yahoo singleton | 5 route files + `lib/yahoo.ts` | Single source of truth, shared suppression |
| 4 | Replace hardcoded market-movers tickers | `market-movers/day/route.ts:28-32`, `market-movers/week/route.ts:24-27` | Actual live data |

### P1 — Performance / Maintainability

| # | Issue | Files | Impact |
|---|---|---|---|
| 5 | `useLocalStorageBool` hook for overlay toggles | `StockPageClient.tsx:83–143` | -80 lines boilerplate, fixes hydration risk |
| 6 | Move sidebar prices to Server Component | `app/stock/[ticker]/layout.tsx:13` | -1 client fetch, faster sidebar |
| 7 | Concurrency caps for related + congressional | `related/route.ts:51`, `congressional-trades/route.ts:121` | Avoid Yahoo throttle |
| 8 | Fix `useMemo` misuse for side effect | `app/ScreenerClient.tsx:37` | Correctness bug |
| 9 | Add LRU/size cap to `lib/cache.ts` | `lib/cache.ts` | Unbounded memory safety |
| 10 | Standardize API response envelopes | `api/news/[ticker]/route.ts` | DX consistency |
| 11 | Add timeout/abort to `lib/yahoo.ts` calls | `lib/yahoo.ts` | Hang prevention |
| 12 | Migrate `require` to ESM `import` | `lib/yahoo.ts:6` | Typing + bundling |

### P2 — Polish

| # | Issue | Files |
|---|---|---|
| 13 | Extract `lib/format.ts` with shared formatters | `FundamentalsSection`, `FinancialsWidget`, `QuickStatsBar`, `StockHeader`, `ResultsTable`, `VolumeChart` |
| 14 | Drop dead `useState` wrappers for earnings/analyst/news | `StockPageClient.tsx:75–77` |
| 15 | Determine if `watchlist-prices` route is used or delete it | `app/api/watchlist-prices/route.ts` |
| 16 | `useMemo` for `groupedBySector` + `filteredSidebarTickers` | `Sidebar.tsx:23,32` |
| 17 | Add `Cache-Control` to congressional-trades response | `congressional-trades/route.ts:169` |
| 18 | Remove no-op `export const revalidate` from POST routes | `screener/route.ts:12`, `prices/route.ts` |
| 19 | Replace `HintTooltip` useState with CSS hover | `FundamentalsSection.tsx:31–55` |
| 20 | Move `RelatedStock` type to `lib/types.ts` | `RelatedStocksStrip.tsx:6`, `related/route.ts:13` |
| 21 | Replace deprecated `historical()` in market-movers/week | `market-movers/week/route.ts:40` |
| 22 | Extract `<HeaderDropdown>` component | `StockHeader.tsx:71–125` |
| 23 | Parameterize `fetchDayData`/`fetchWeekData` | `market-movers/page.tsx:38–67` |
| 24 | Extract `sortByDateDesc` helper | `lib/yahoo.ts:198,293` |

---

## Quick Wins (< 30 min each)

| # | Change | Location | Payoff |
|---|---|---|---|
| 1 | `useMemo` → `useEffect` for page reset | `ScreenerClient.tsx:37` | Correctness bug |
| 2 | Type `cacheGet<T>()` calls | `financials/route.ts:22`, `news/route.ts:21` | Type safety |
| 3 | Remove redundant `.catch` on `getQuoteSummary` | `stock/[ticker]/route.ts:39` | Hygiene |
| 4 | Drop empty `useState` for earnings/analyst/news | `StockPageClient.tsx:75–77` | -3 state slots |
| 5 | Remove `export const revalidate` from POST routes | `screener/route.ts:12`, `prices/route.ts` | Remove misleading config |
| 6 | `useMemo` for sidebar derivations | `Sidebar.tsx:23,32` | Reduce per-keystroke compute |
| 7 | Export `yf` singleton from `lib/yahoo.ts` and use in `/api/prices` | `lib/yahoo.ts`, `prices/route.ts:30` | First step of consolidation |
| 8 | Add `Cache-Control: s-maxage=300` to congressional-trades | `congressional-trades/route.ts:169` | CDN caching |
| 9 | Extract `lib/format.ts` with shared formatters | 6 component files | DRY |
| 10 | Replace per-row `HintTooltip` useState with CSS hover | `FundamentalsSection.tsx:31–55` | -12 state cells |
| 11 | Cap concurrency in related-route to 8 symbols | `related/route.ts:51` | Yahoo rate-limit safety |
| 12 | Combine `fetchDayData`/`fetchWeekData` into one function | `market-movers/page.tsx:38–67` | -20 lines |
