# Trading Dashboard — Feature Spec & Implementation Report
**Route:** `/tradingview`
**Date:** 2026-05-19
**Status:** Ready for review — not yet implemented

---

## 1. What We're Building

A full-screen, professional-grade multi-pane live trading dashboard. Unlike the existing `/stockv2/[ticker]` page (which embeds an external TradingView iframe), this page builds everything first-party using TradingView's open-source `lightweight-charts` library — giving us full control over rendering, real-time data feeds, and custom indicators.

**Core capability:** Up to 8 simultaneously live chart panes, each independently configured with its own symbol, timeframe, data source, and unlimited indicators.

---

## 2. Key Decisions & Tradeoffs

### 2.1 `lightweight-charts` vs Recharts vs TradingView iframe

| Option | Pros | Cons |
|--------|------|------|
| **lightweight-charts** (chosen) | Custom primitives, WebSocket integration, professional candlestick rendering, imperative updates (no re-renders) | Must build everything ourselves |
| Recharts (existing) | Already installed, familiar | No candlestick series, no imperative update API — every tick causes React re-render |
| TradingView iframe | Zero build cost | Can't inject custom data, can't layer custom overlays (VP/FVG), one chart per page |

**Decision: `lightweight-charts`.** It's the only option that satisfies live updates without React re-render cascades AND supports custom Canvas2D primitives.

**Package not yet installed** → `npm install lightweight-charts` required.

### 2.2 Crypto Data: Hyperliquid WebSocket

Hyperliquid (`wss://api.hyperliquid.xyz/ws`) is chosen because:
- Truly free, no API key
- Public candle subscription: any coin, any interval
- Returns OHLCV in real-time, exactly what `lightweight-charts` needs
- Browser-connectable (no CORS proxy required)

The browser opens one WebSocket per pane — not shared. This isolates pane lifecycles and prevents one pane's symbol change from disrupting another.

**Historical data** on initial load: `POST https://api.hyperliquid.xyz/info` with `{"type":"candleSnapshot","req":{"coin":"BTC","interval":"1m",...}}` — same API, REST endpoint, returns array of historical candles.

### 2.3 Stock Data: Yahoo Finance Polling

Yahoo Finance has no WebSocket. Real-time US stock data without a paid API key requires polling.

**Architecture:**
- Initial load: new `GET /api/tradingview/stock/[ticker]` route returns full OHLCV history
- Live updates: `GET /api/tradingview/stock/[ticker]/quote` polled every 15 seconds returns latest price
- On each poll: the last candle on the chart is updated in-place (`series.update()`)

This gives ~15s price refresh for stocks — acceptable given free data constraints. The existing `lib/yahoo.ts` functions (`getHistoricalData`, `getQuote`) are reused directly.

**Vercel deployment:** API routes are standard Vercel serverless functions. The browser→Hyperliquid WebSocket is direct (no Vercel relay needed). No special config required.

### 2.4 Performance: Zero Re-renders on Price Tick

The single biggest performance challenge: 8 panes × N ticks/sec = potential catastrophic re-render cascades if state is used naively.

**Solution: imperative chart updates only.**
- `chartRef`, `candleSeriesRef` are `useRef` — the chart object lives outside React
- Every price tick calls `series.update(bar)` directly — no `setState`, no re-render
- Ticker bar color flash: pure DOM class manipulation (`element.classList.add('flash-green')`) — no React state, zero re-renders
- Each `ChartPane` wrapped in `React.memo` — parent pane count changes don't re-render sibling panes
- `useMarketData` hook holds WebSocket/interval refs, never triggers parent re-renders

---

## 3. File Structure

```
app/tradingview/
├── layout.tsx                       (server — full-screen dark, no sidebar)
├── page.tsx                         (server — renders Dashboard)
├── Dashboard.tsx                    (client — pane count + grid only; dynamic imports ChartPane)
├── StockPricesContext.tsx           (client — batched stock polling context)
└── components/
    ├── ChartPane.tsx                 (client, React.memo — owns all its own state)
    ├── PaneControls.tsx             (client — source/symbol/timeframe/indicator dropdowns)
    └── IndicatorPanel.tsx           (client — RSI/MACD/WilliamsR sub-charts)

lib/tradingview/
├── useMarketData.ts                 (hook dispatcher: crypto vs stock)
├── useHyperliquidWs.ts             (Hyperliquid WebSocket lifecycle)
├── useStockData.ts                  (reads price updates from StockPricesContext)
├── indicators.ts                    (RSI, MACD, BB, Williams%R — wraps technicalindicators)
└── chartPrimitives.ts              (Volume Profile + FVG lightweight-charts primitives)

app/api/tradingview/
└── stock/[ticker]/
    └── route.ts                     (GET historical OHLCV bars — initial load only)
```

**Total new files: 13.** Per-pane quote polling route dropped (replaced by batched `POST /api/prices` reuse). No existing files modified (except `app/globals.css` for 2 CSS animation keyframes).

---

## 4. Component Breakdown

### 4.1 Dashboard.tsx

Owns **only**:
- `paneCount: 1 | 2 | 4 | 6 | 8` — persisted to `localStorage`
- An array of stable `paneId` strings — used as React `key` props only

`ChartPane` is **dynamically imported with SSR disabled** to prevent `window is not defined` crashes (`lightweight-charts` calls `document.createElement('canvas')` on load):

```tsx
import dynamic from 'next/dynamic'

const ChartPane = dynamic(
  () => import('./components/ChartPane'),
  { ssr: false, loading: () => <div className="bg-slate-900 animate-pulse rounded" /> }
)
```

Dashboard passes **no config or callback props** to `ChartPane` — each pane manages its own state. `React.memo` correctness is trivial: no changing props = no spurious re-renders.

**Grid layout:**

| Pane Count | Columns | Rows | Tailwind |
|------------|---------|------|----------|
| 1 | 1 | 1 | `grid-cols-1` |
| 2 | 2 | 1 | `grid-cols-2` |
| 4 | 2 | 2 | `grid-cols-2 grid-rows-2` |
| 6 | 3 | 2 | `grid-cols-3 grid-rows-2` |
| 8 | 4 | 2 | `grid-cols-4 grid-rows-2` |

### 4.2 ChartPane.tsx (React.memo)

**Owns all its own state** — no props from Dashboard except a stable `paneId`:
```ts
// All local to ChartPane:
source: 'crypto' | 'stock'           // useState, default 'crypto'
symbol: string                        // useState, default per paneIndex (BTC/ETH/SPY/QQQ)
interval: string                      // useState, default '1d'
indicators: IndicatorKey[]            // useState, default []
```

State persisted to `localStorage['tv-pane-{paneId}']` on every change (debounced 300ms). Restored on mount.

Lifecycle:

1. **Mount:** `createChart(containerRef.current, darkThemeOptions)` → `addCandlestickSeries()`
2. **Data load:** `useMarketData` fires `onHistoryLoaded(bars)` → `series.setData(bars)`
3. **Live tick:** `useMarketData` fires `onBar(bar)` → `series.update(bar)` + DOM flash + indicator update
4. **Unmount:** `chart.remove()` — fully cleans up canvas + event listeners

Dark theme options for `createChart`:
```ts
{
  layout: { background: { color: '#0f172a' }, textColor: '#94a3b8' },
  grid: { vertLines: { color: '#1e293b' }, horzLines: { color: '#1e293b' } },
  crosshair: { mode: CrosshairMode.Normal },
  rightPriceScale: { borderColor: '#334155' },
  timeScale: { borderColor: '#334155', timeVisible: true },
}
```

**Ticker bar** (top of each pane):
- Shows: `[SYMBOL] [PRICE] [CHANGE%]` + data source badge
- Color flash on tick: `flash-green` (price up) or `flash-red` (price down)
- Implemented via `tickerBarRef` + DOM class manipulation — NOT React state

### 4.3 PaneControls.tsx

Dropdown row at top of each pane:
- **Source:** Crypto / Stock (select)
- **Symbol:** Text input with common presets (BTC, ETH, SOL for crypto; AAPL, MSFT, TSLA for stocks)
- **Timeframe:** Crypto: 1m / 5m / 15m / 1h / 1d / 1mo — Stock: **5m** / 15m / 1h / 1d / 1mo (1m dropped — Yahoo data unreliable)
- **Indicators:** Multi-select dropdown: RSI, MACD, BB, Williams %R, Volume Profile, FVG

Changes update `ChartPane`'s own local state. No prop callback to Dashboard. `useMarketData`'s `useEffect` deps `[source, symbol, interval]` handle reconnect/refetch automatically.

### 4.4 IndicatorPanel.tsx

Creates a separate `lightweight-charts` instance for each active sub-indicator (RSI, MACD, WilliamsR). Each sub-chart:
- Shares horizontal (time) axis scroll with the main price chart via `timeScale().subscribeVisibleTimeRangeChange()`
- Has a fixed height (80px for oscillators)
- Has its own `useRef` for imperative updates

Bollinger Bands are an overlay (not a sub-chart) — 3 `addLineSeries()` calls on the main chart.

---

## 5. Indicators Deep Dive

### 5.1 Standard Indicators

All computed client-side from the full OHLCV history using the already-installed `technicalindicators` package:

| Indicator | Input | Output | Update on tick |
|-----------|-------|--------|----------------|
| RSI(14) | `close[]` | `value[]` (0–100) | Append last value (rolling window) |
| MACD(12,26,9) | `close[]` | `{MACD, signal, histogram}[]` | Append last value |
| Bollinger Bands(20,2σ) | `close[]` | `{upper, middle, lower}[]` | Append last 3 values |
| Williams %R(14) | `high[], low[], close[]` | `value[]` (-100 to 0) | Append last value |

On **initial load**: compute full indicator history, call `series.setData(indicatorBars)`.
On **each new bar**: append one new value via `series.update(indicatorBar)` — O(1), no full recompute.

**Overbought/oversold levels** rendered as static price lines:
- RSI: dashed lines at 70 (overbought) and 30 (oversold)
- Williams %R: dashed lines at -20 and -80
- MACD: zero line

### 5.2 Volume Profile

**What it shows:** For a given visible range, the distribution of volume across price levels. The "busiest price" (Point of Control) is where the most volume has traded.

**Computation (`lib/tradingview/chartPrimitives.ts`):**
```
1. Take all bars in the current visible time range
2. Divide price range [minLow, maxHigh] into 24 equal buckets
3. For each bar, assign its volume to the corresponding bucket
4. POC = bucket with max volume
5. VAH, VAL = expand from POC until 70% of total volume is covered (Value Area)
```

**Rendering:** 3 price lines (POC = amber dashed, VAH = green, VAL = red) + a custom primitive that draws horizontal volume histogram bars on the right edge of the chart. The primitive implements:
```ts
interface VolumeProfilePrimitive extends ISeriesPrimitive {
  updateAllViews(): void  // recomputes when chart scrolls
  paneViews(): ISeriesPrimitivePaneView[]
}
// paneView.renderer().draw(target) → draws bars using canvas2D
```

### 5.3 Fair Value Gaps (FVG)

**What they are:** 3-candle patterns where price moved so fast it left an unfilled gap — a region where no trading occurred, often acting as future support/resistance.

**Detection:**
```
Bullish FVG:  bars[i-2].high < bars[i].low   → gap between two candles, price moved up
Bearish FVG:  bars[i-2].low  > bars[i].high  → gap between two candles, price moved down
Filled:       a subsequent bar's range overlaps the gap → remove from display
```

**Rendering:** Custom primitive draws semi-transparent rectangles:
- Bullish: `rgba(34, 197, 94, 0.15)` (green)
- Bearish: `rgba(239, 68, 68, 0.15)` (red)

Uses `series.priceToCoordinate(price)` and `chart.timeScale().timeToCoordinate(time)` inside the primitive's `draw()` method to convert price/time to canvas pixel coordinates.

---

## 6. Data Feed Hooks

### 6.1 `useMarketData` (pluggable dispatcher)

```ts
interface MarketDataConfig {
  source: 'crypto' | 'stock'
  symbol: string
  interval: string
  onHistoryLoaded: (bars: LightweightBar[]) => void
  onBar: (bar: LightweightBar) => void
}

// To add a new broker later: add a case here
function useMarketData(config: MarketDataConfig) {
  if (config.source === 'crypto') return useHyperliquidWs(config)
  return useStockData(config)
}
```

### 6.2 `useHyperliquidWs`

```
WebSocket lifecycle:
  connect → onopen: subscribe to candle feed
  → fetch historical candles (REST) → onHistoryLoaded()
  → onmessage: parse candle update → onBar()
  → cleanup: ws.close(), clear pending promises

Subscribe message:
  {"method":"subscribe","subscription":{"type":"candle","coin":"BTC","interval":"1m"}}

Candle message format:
  {"channel":"candle","data":{"t":1700000000000,"s":"BTC","i":"1m",
   "o":"35000","c":"35100","h":"35150","l":"34950","v":"12.5"}}

Historical REST:
  POST https://api.hyperliquid.xyz/info
  {"type":"candleSnapshot","req":{"coin":"BTC","interval":"1m",
   "startTime":<ms>,"endTime":<ms>}}
```

One `useEffect` dependency array: `[symbol, interval]` — reconnects cleanly on any change.

### 6.3 `useStockData`

Per-pane polling is **replaced** by a batched context. `useStockData` now:

```
Lifecycle:
  1. Fetch history: GET /api/tradingview/stock/{symbol}?interval={interval}
     → onHistoryLoaded(bars)
  2. Register symbol with StockPricesContext on mount
     → Context fires single POST /api/prices every 15s for all active symbols
     → Context distributes results; useStockData reads its symbol's entry
     → Builds synthetic bar → onBar(syntheticBar)
  3. Unregister symbol from context on unmount / symbol change
```

**StockPricesContext** (new, in `Dashboard.tsx` subtree):
```
- Maintains Set<string> of active stock symbols (registered by each stock pane)
- setInterval(15s) → POST /api/prices { tickers: [...activeSymbols] }
  → reuses existing endpoint, already concurrency-limited + cache-aware
- Distributes { symbol → {price, changePercent} } via context value
- 8 stock panes = 1 API call per 15s (not 8)
```

---

## 7. API Routes

### `GET /api/tradingview/stock/[ticker]?interval=1d`

Reuses `getHistoricalData` from `lib/yahoo.ts`. Called **once per pane on load**, not polled.

| Interval | Yahoo param | History days | Cache TTL |
|----------|-------------|--------------|-----------|
| 5m | `5m` | 60 | 60s |
| 15m | `15m` | 60 | 60s |
| 1h | `60m` | 365 | 300s |
| 1d | `1d` | 730 | 600s |
| 1mo | `1mo` | 1825 | 600s |

Note: `1m` interval dropped for stocks — Yahoo data unreliable (7-day cap, frequent gaps, up to 15-min delay). Crypto `1m` remains via Hyperliquid WS.

Response:
```json
{
  "bars": [
    { "time": 1700000000, "open": 182.5, "high": 183.2, "low": 181.8, "close": 182.9, "volume": 52341000 },
    ...
  ]
}
```

`time` is Unix seconds (what `lightweight-charts` expects for its time scale).

### Live Stock Quotes — `POST /api/prices` (existing route, reused)

No new quote endpoint needed. `StockPricesContext` calls the existing `/api/prices` POST endpoint every 15s with all active symbols batched. Response: `{ prices: { AAPL: {price, changePercent}, ... } }
```

---

## 8. Existing Code Reused (No Changes)

| File | What's reused |
|------|---------------|
| `lib/yahoo.ts` | `getHistoricalData()` (history endpoint) |
| `app/api/prices/route.ts` | Batched live quote polling (`StockPricesContext` calls this) |
| `lib/validation.ts` | `isValidTicker()` |
| `lib/cache.ts` | `cacheGet()`, `cacheSet()` |
| `technicalindicators` (npm) | RSI, MACD, BollingerBands, WilliamsR classes |

---

## 9. What's Not Included (Deferred)

| Feature | Reason deferred |
|---------|----------------|
| Cross-pane time sync (scroll lock) | Complex multi-ref coordination; can add in v2 |
| Drawing tools (trend lines, rectangles) | `lightweight-charts` plugin API; post-MVP |
| Watchlist sidebar | Not needed for full-screen trading mode |
| Order entry / position management | Requires broker API integration |
| WebSocket for stocks | No free WS provider; Polygon.io/Alpaca are paid |
| Saving pane layouts | localStorage for pane count; full config save is v2 |

---

## 10. Architecture Review Notes (Post-Gemini)

Four issues identified and resolved before implementation:

| # | Issue | Resolution |
|---|-------|------------|
| 1 | Per-pane stock polling burns Vercel quota + Yahoo rate limits | `StockPricesContext` batches all symbols into one `POST /api/prices` per 15s |
| 2 | `React.memo` breaks when Dashboard passes `onConfigChange` (new ref each render) | Pane state localized inside `ChartPane`; Dashboard passes no config/callback props |
| 3 | `lightweight-charts` crashes SSR (`document is not defined`) | `dynamic(() => import('./ChartPane'), { ssr: false })` in Dashboard |
| 4 | VP recompute on every scroll pixel blocks main thread (60fps stutter) | `subscribeVisibleTimeRangeChange` debounced 150ms; VP frozen during active drag |

---

## 11. Resolved Decisions

| Decision | Resolution |
|----------|------------|
| Stock polling interval | **15s** — safe with batching; Yahoo IP-bans aggressive polling |
| Default 4-pane symbols | **BTC (crypto), ETH (crypto), SPY (stock), QQQ (stock)** — exercises both data sources |
| Stock timeframes | **5m minimum** — `1m` dropped (Yahoo: 7-day cap, gaps, 15-min delay) |
| Volume Profile scope | **Visible range, 150ms debounce** — recomputes after scroll settles, not during |
| Page navigation | **Off main nav initially** — accessible at `/tradingview` by URL; add nav link after validating production WebSocket/API load |

---

## 12. Estimated Complexity

| Category | Files | Complexity |
|----------|-------|------------|
| Layout + page + Dashboard | 3 | Low |
| StockPricesContext | 1 | Medium |
| ChartPane + PaneControls | 2 | Medium |
| IndicatorPanel | 1 | Medium |
| useMarketData + useHyperliquidWs + useStockData | 3 | High (WebSocket lifecycle) |
| indicators.ts | 1 | Low (wraps existing package) |
| chartPrimitives.ts (VP + FVG + debounced VP) | 1 | High (Canvas2D + scroll debounce) |
| API route (history only, 1 file) | 1 | Low |
| **Total** | **13** | |

The Volume Profile/FVG Canvas2D primitives and the Hyperliquid WebSocket lifecycle remain the most complex pieces. All architectural decisions are now resolved — ready for implementation.
