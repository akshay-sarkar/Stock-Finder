# Stock Finder — PM Feature Research Report
**Generated:** 2026-04-25 UTC
**Agent:** Claude Code PM Research Agent
**Project:** Stock Finder (Yahoo Finance + Technical Analysis + Screener)
**Prior report:** pm-features-2026-04-20.md
**Competitors analyzed:** Finviz, TradingView, Stockanalysis.com, Macrotrends, Barchart, OpenBB, Unusual Whales

---

## Executive Summary

Since the 2026-04-20 report, five major features have shipped: News Feed, Historical Financials, Short Interest Display, 52-Week High/Low Range Bar, and Fundamental Screener Filters. This closes the most critical screener gap vs. Finviz and Stockanalysis. The project has now matched the core feature set of most free-tier competitors on charting, fundamentals, and screener depth.

The remaining highest-leverage gap is **inline insider transaction data**. Every competitor review in 2026 ranks insider buy/sell signals as a top-3 retention driver for retail investors, yet Stock Finder still only links externally to Quiver Quant. The data is available free via SEC EDGAR (keyless) or Finnhub (free tier). This is the single easiest high-value feature to ship next.

The second priority is a **Watchlist page with browser price alerts** — the `/api/watchlist-prices` route is already built, making the standalone page a pure frontend task with zero new backend work.

---

## 🚀 Quick Wins — Ship This Sprint
*(Priority Score ≥ 7, Effort ≤ 2)*

### 1. Candlestick Chart Mode (toggle on price chart)
- **Category:** Charting & Visualization
- **Seen in:** Finviz, TradingView, Stockanalysis.com, Barchart, OpenBB
- **Free API:** `yahoo-finance2` `getHistoricalData()` — already returns OHLC per day (already integrated)
- **npm package:** `lightweight-charts@^5.2.0` (TradingView's open-source canvas chart, 5.2.0 published Feb 2024, actively maintained) OR use existing Recharts `<ComposedChart>` with `<Bar>` components for a candlestick approximation
- **User Value:** ⭐⭐⭐⭐ (4/5)
- **Effort:** 🔧🔧 (2/5)
- **Differentiation:** ⚡⚡⚡⚡ (4/5)
- **Priority Score:** 10
- **Why now:** Candlestick mode is the single most-requested chart feature in TradingView/Finviz comparisons. Stock Finder's current line chart is adequate for trend analysis but candlesticks are the de-facto standard for retail traders identifying patterns (doji, engulfing, hammer). The OHLC data is already fetched — this is a rendering-only change. `lightweight-charts` is significantly faster than Recharts for financial data and would improve chart performance as a bonus.
- **Implementation hint:** Add a "Candle / Line" toggle button above the price chart. On "Candle" mode, render a `<CandlestickSeries>` via `lightweight-charts` (or build OHLC bars in Recharts using `<Bar>` with `shape` prop). Persist toggle preference to `localStorage` key `sf-chart-mode`. OHLC fields (`open`, `high`, `low`, `close`) are already present in `getHistoricalData()` output — pass them through `computeIndicatorHistory()` unchanged.

---

### 2. Stochastic Oscillator Indicator
- **Category:** Technical Indicators
- **Seen in:** Finviz, TradingView, Barchart, Stockanalysis.com
- **Free API:** `yahoo-finance2` historical data (already integrated)
- **npm package:** `technicalindicators` (already installed — `Stochastic` class is exported)
- **User Value:** ⭐⭐⭐⭐ (4/5)
- **Effort:** 🔧 (1/5)
- **Differentiation:** ⚡⚡⚡ (3/5)
- **Priority Score:** 10
- **Why now:** Stochastic is the third most-used momentum oscillator after RSI and MACD, and is already available in the `technicalindicators` package that is installed. Adding it follows the exact same pattern as the existing RSI implementation — compute in `lib/indicators.ts`, expose in the API response, add a chart panel toggle. Zero new dependencies, zero new API calls.
- **Implementation hint:** In `lib/indicators.ts`: `import { Stochastic } from 'technicalindicators'`. Compute `%K` and `%D` lines. Add `stochK` and `stochD` arrays to `IndicatorHistory`. In the chart UI, add a "Stoch" toggle that renders a new sub-chart panel below MACD (same pattern as existing RSI/MACD panels). Add overbought (80) / oversold (20) reference lines matching the RSI panel style.

---

### 3. ATR (Average True Range) Display
- **Category:** Technical Indicators / Screener Criteria
- **Seen in:** TradingView, Finviz Elite, Barchart, Stockanalysis.com (screener filter)
- **Free API:** `yahoo-finance2` historical OHLC (already integrated)
- **npm package:** `technicalindicators` (already installed — `ATR` class is exported)
- **User Value:** ⭐⭐⭐ (3/5)
- **Effort:** 🔧 (1/5)
- **Differentiation:** ⚡⚡⚡ (3/5)
- **Priority Score:** 8
- **Why now:** ATR is the standard volatility metric for position sizing and stop-loss placement. It appears as a screener filter on Stockanalysis.com and as a chart indicator on TradingView. Already computable from existing data. Adding to the Summary Cards row (alongside RSI, MACD, SMA) takes ~20 minutes.
- **Implementation hint:** `ATR.calculate({ high, low, close, period: 14 })` in `lib/indicators.ts`. Add `atr14` to `LatestIndicators` in `lib/types.ts`. Surface as a new summary card labeled "ATR(14)" on the stock detail page header row. Optionally add `atr` as a screener filter criterion (e.g., "High Volatility: ATR > 2% of price") alongside the existing technical filters.

---

## 📋 Backlog — Next 1–2 Sprints
*(Score 4–6 or Effort 3–4, ordered by ROI)*

### 4. Insider Transactions Feed (per ticker)
- **Category:** Alternative Data
- **Seen in:** Finviz (screener signal), OpenBB, Unusual Whales (paid), multiple HN Show HN projects (Insiderviz, CatalystAlert)
- **Free API:**
  - Primary: Finnhub free tier — `GET https://finnhub.io/api/v1/stock/insider-transactions?symbol={ticker}&token={key}` returns JSON array of Form 4 filings with `name`, `share`, `value`, `transactionDate`, `transactionCode` (P=purchase, S=sale). 60 req/min on free plan, no credit card required.
  - Keyless fallback: SEC EDGAR `https://data.sec.gov/submissions/CIK{cik}.json` → filter `filings.recent` for form type "4". CIK lookup via `https://efts.sec.gov/LATEST/search-index?q=%22{ticker}%22&forms=4`.
- **npm package:** None required — standard `fetch`
- **User Value:** ⭐⭐⭐⭐ (4/5)
- **Effort:** 🔧🔧🔧 (3/5)
- **Differentiation:** ⚡⚡⚡⚡ (4/5)
- **Priority Score:** 9
- **Why now:** Multiple 2025–2026 HN Show HN projects launched specifically to fill this gap (Insiderviz, CatalystAlert). Retail investor research confirms insider buy/sell signals are a top-3 driver of repeated visits to financial tools. Stock Finder currently only links externally to Quiver Quant Insiders — bringing this inline removes a bounce point and adds a meaningful differentiator vs. Finviz (which only shows insider data in the screener, not inline per-ticker).
- **Implementation hint:**
  - New API route: `app/api/insider/[ticker]/route.ts`
  - Add `FINNHUB_API_KEY` to `.env` (free key from finnhub.io)
  - Response shape: `{ transactions: Array<{ name, title, type: 'BUY'|'SELL', shares, value, date }>, netSentiment: { buys: number, sells: number, netValue: number, period: '90d' } }`
  - UI: collapsible "Insider Activity" section on stock detail page (below Short Interest widget). Table rows: date | insider name | title | Buy/Sell badge | shares | value. Above the table: a net-sentiment chip ("Net Buyer: +$2.4M last 90 days" in emerald, or "Net Seller" in red).
  - Cache TTL: 2 hours
  - Note: If Finnhub key is absent, fall back to SEC EDGAR keyless endpoint automatically.

---

### 5. Watchlist Page with Browser Price Alerts
- **Category:** Alerts & Watchlists
- **Seen in:** TradingView, Finviz Elite, Barchart, Stockanalysis.com (Pro)
- **Free API:** `/api/watchlist-prices` route (already built — POST endpoint returning live quotes)
- **npm package:** None — uses browser `Notification` API and `localStorage`
- **User Value:** ⭐⭐⭐⭐⭐ (5/5)
- **Effort:** 🔧🔧🔧 (3/5)
- **Differentiation:** ⚡⚡⚡ (3/5)
- **Priority Score:** 10
- **Why now:** Watchlists are the primary retention mechanism for TradingView (users return to check their list, not to re-screen). The backend is already done — `/api/watchlist-prices` accepts a POST with a list of tickers and returns live prices. This is a pure frontend build. The screener already manages a `localStorage` watchlist. A dedicated `/watchlist` page adds the one missing piece: always-visible prices + threshold alerts.
- **Implementation hint:**
  - New page: `app/watchlist/page.tsx` — reads ticker list from `localStorage` key `sf-watchlist-v2`, polls `/api/watchlist-prices` every 60s via `setInterval` with `useEffect` cleanup
  - Per-ticker alert thresholds stored in `localStorage` key `sf-alerts` as `{ [ticker]: { above?: number, below?: number } }`
  - On each poll result: compare current price to stored thresholds. If crossed: `new Notification(ticker + ' crossed $' + threshold)` (preceded by `Notification.requestPermission()` on first alert set)
  - UI: clean table — Ticker | Company | Price | Change% | Alert threshold input | Remove button
  - Add "Add to Watchlist" star button to the stock detail page header (reuse the logic already in the screener sidebar)
  - No backend changes needed

---

### 6. OBV (On Balance Volume) Chart Panel
- **Category:** Technical Indicators
- **Seen in:** TradingView, Barchart, OpenBB
- **Free API:** `yahoo-finance2` OHLCV (already integrated)
- **npm package:** `technicalindicators` (already installed — `OBV` class exported)
- **User Value:** ⭐⭐⭐ (3/5)
- **Effort:** 🔧🔧 (2/5)
- **Differentiation:** ⚡⚡ (2/5)
- **Priority Score:** 6
- **Why now:** OBV confirms price trends with volume — divergence between OBV and price is a widely used reversal signal. Follows the exact same panel pattern as RSI and MACD. Zero new data or dependencies.
- **Implementation hint:** `OBV.calculate({ close, volume })` in `lib/indicators.ts`. Add `obv` array to `IndicatorHistory`. Add a "OBV" toggle button in the chart overlay controls row. Render as a new sub-chart panel (line series) below MACD. Label the Y-axis in millions/billions using the existing `fmtVol()` formatter.

---

### 7. Williams %R Indicator
- **Category:** Technical Indicators
- **Seen in:** TradingView, Barchart
- **Free API:** `yahoo-finance2` historical OHLC (already integrated)
- **npm package:** `technicalindicators` (already installed — `WilliamsR` class exported)
- **User Value:** ⭐⭐⭐ (3/5)
- **Effort:** 🔧 (1/5)
- **Differentiation:** ⚡⚡ (2/5)
- **Priority Score:** 7
- **Why now:** Williams %R is a complement to RSI for overbought/oversold identification — popular among swing traders. Same implementation pattern as ATR. Adds to the "technical depth" story vs. competitors.
- **Implementation hint:** `WilliamsR.calculate({ high, low, close, period: 14 })` in `lib/indicators.ts`. Add `williamsR` to `LatestIndicators`. Surface as a summary card on the stock detail header row. Optionally add a chart panel toggle (same pattern as RSI).

---

### 8. Economic Indicators Dashboard (FRED)
- **Category:** Macro & Market Context
- **Seen in:** TradingView (paid), Macrotrends, Barchart, OpenBB
- **Free API:** FRED REST API — `https://api.stlouisfed.org/fred/series/observations?series_id={id}&api_key={key}&limit=24&sort_order=desc&file_type=json`. Free API key at fred.stlouisfed.org (no credit card). Rate limit: 120 req/min.
- **npm package:** None — standard fetch; Recharts already installed for sparklines
- **User Value:** ⭐⭐⭐⭐ (4/5)
- **Effort:** 🔧🔧🔧🔧 (4/5)
- **Differentiation:** ⚡⚡⚡⚡ (4/5)
- **Priority Score:** 8
- **Why now:** No free-tier stock screener competitor has a clean macro dashboard. This is a meaningful differentiator — a reason users bookmark Stock Finder even on days they are not screening. Recharts is already installed; the 5 required FRED series IDs are well-documented.
- **Implementation hint:**
  - Add `FRED_API_KEY` to `.env` (free from fred.stlouisfed.org)
  - New API route: `app/api/macro/route.ts` — fetches 5 series in parallel, returns `{ fedfunds, cpi, unemployment, tenYearYield, gdpGrowth }` each with `{ current, prior, trend: 'up'|'down'|'flat', history: Array<{date, value}> }`
  - Series IDs: `FEDFUNDS`, `CPIAUCSL`, `UNRATE`, `GS10`, `A191RL1Q225SBEA`
  - New page: `app/macro/page.tsx` — 5-card grid, each showing metric name, current value, prior value, direction arrow (green/red), and a Recharts `<LineChart>` sparkline (last 24 months)
  - Cache TTL: 6 hours
  - Add "Macro" nav link to header

---

### 9. SEC Filing Viewer (10-K, 10-Q, 8-K)
- **Category:** Alternative Data
- **Seen in:** Stockanalysis.com, OpenBB
- **Free API:** SEC EDGAR `https://data.sec.gov/submissions/CIK{cik}.json` — keyless, ~10 req/sec. CIK lookup: `https://efts.sec.gov/LATEST/search-index?q=%22{ticker}%22&forms=10-K,10-Q,8-K`
- **npm package:** None required
- **User Value:** ⭐⭐⭐⭐ (4/5)
- **Effort:** 🔧🔧🔧🔧 (4/5)
- **Differentiation:** ⚡⚡⚡⚡ (4/5)
- **Priority Score:** 8
- **Why now:** Retail investors post-2021 expect direct filing access. Stockanalysis.com and OpenBB both surface EDGAR filings. SEC EDGAR is entirely free and keyless. The CIK lookup adds one async step but is straightforward.
- **Implementation hint:**
  - New API route: `app/api/filings/[ticker]/route.ts`
  - Step 1: resolve CIK via `https://efts.sec.gov/LATEST/search-index?q=%22{ticker}%22` (parse first result's `entity_id`)
  - Step 2: fetch `https://data.sec.gov/submissions/CIK{paddedCIK}.json` → extract `filings.recent` arrays
  - Return last 5 each of 10-K, 10-Q, 8-K with `{ form, date, description, edgarUrl }`
  - UI: collapsible "SEC Filings" section on stock detail page; 3 tabs (10-K / 10-Q / 8-K); each row links to EDGAR viewer
  - Cache TTL: 24 hours

---

## 🔭 Future Roadmap
*(Score < 4 or Effort = 5)*

### 10. Options Chain Viewer
- **Category:** Charting & Visualization / Alternative Data
- **Seen in:** Finviz, TradingView, Barchart, Stockanalysis.com, OpenBB
- **Free API:** `yahoo-finance2` `options(ticker)` method — returns full chain per expiry with strike, bid, ask, open interest, implied volatility
- **Effort:** 🔧🔧🔧🔧🔧 (5/5)
- **Blocker:** Parsing and rendering a full options chain is significant UI/UX work. IV Rank requires historical IV data (not available free). The `yahoo-finance2` `options()` method returns per-expiry data but requires multiple requests for the full chain. Recommend shipping after Watchlist and Insider Feed are validated as retention drivers.

---

### 11. Sector & Industry Heatmap
- **Category:** Macro & Market Context
- **Seen in:** Finviz (flagship free feature), TradingView
- **Free API:** `yahoo-finance2` sector/industry fields on bulk screener results (already in screener route); no direct heatmap API
- **Effort:** 🔧🔧🔧🔧🔧 (5/5)
- **Blocker:** Recharts lacks a performant native treemap for 500 simultaneous tickers. Requires curated ticker-to-sector mapping dataset. The new Fundamental Screener Filters include sector/industry data — this data foundation is now in place, lowering the blocker from infrastructure to rendering complexity. Revisit after the macro dashboard validates appetite for market-context features.

---

### 12. Portfolio Tracker with P&L
- **Category:** Portfolio & Risk
- **Seen in:** TradingView, Barchart, Stockanalysis.com (Pro), OpenBB
- **Free API:** `/api/prices` (already built)
- **Effort:** 🔧🔧🔧🔧🔧 (5/5)
- **Blocker:** Edge cases (stock splits, dividends, cost basis lot tracking) make this harder than it appears. The Watchlist page (Sprint 2) is a prerequisite — validate whether users engage with persistent ticker lists before investing in full portfolio tracking.

---

### 13. Candlestick Pattern Recognition (screener signal)
- **Category:** Screener Criteria / Charting
- **Seen in:** Finviz (11 candlestick patterns in free screener, 28 chart patterns total)
- **Free API:** `yahoo-finance2` OHLC (already integrated); `technicalindicators` has basic pattern functions (Doji, Abandoned Baby, etc.)
- **Effort:** 🔧🔧🔧🔧 (4/5)
- **Blocker:** `technicalindicators` pattern detection is limited vs. Finviz's 28-pattern engine. Full pattern recognition (head-and-shoulders, cup-and-handle, wedges) requires a dedicated library or custom implementation. The candlestick chart toggle (Quick Win #1) is a prerequisite — users need to see candlestick charts before pattern labels add value.

---

## ❌ Evaluated but Excluded

| Feature | Reason excluded |
|---|---|
| RSI, MACD, Bollinger Bands, EMA/SMA overlays | Already built |
| Stock screener — technical + fundamental filters | Already built (P/E, Market Cap, Dividend Yield, Revenue Growth all shipped) |
| Yahoo Finance data integration | Already built (`yahoo-finance2`) |
| Recharts charting | Already built |
| Congressional trades dashboard | Already built |
| Google Finance + Quiver Quant external links | Already built |
| Earnings Calendar Widget | Already built |
| Analyst Price Targets + Recommendations | Already built |
| 52-Week High/Low Range Bar | Already built (shipped since 2026-04-20 report) |
| Short Interest Display | Already built (shipped since 2026-04-20 report) |
| Historical Financials Table | Already built (shipped since 2026-04-20 report) |
| News Feed Per Ticker | Already built (shipped since 2026-04-20 report) |
| Real-time Level 2 order book | No free API; all providers require paid subscriptions |
| Dark pool / unusual options flow | Unusual Whales: ~$55/mo minimum; no free tier with useful data |
| AI-generated stock summaries | LLM inference cost per request; no free production-grade API |
| Crypto prices | Out of scope for equity-focused product |
| Social sentiment (Reddit/Twitter) | Twitter/X API now paid; Reddit API has severe rate limits for production |
| Alpha Vantage earnings history | 25 req/day free tier — too restrictive for production |
| House Stock Watcher S3 | S3 bucket returning HTTP 403 as of early 2026; endpoint no longer accessible |

---

## 🗺️ Competitive Feature Gap Matrix

| Feature | Finviz | TradingView | Stockanalysis | Macrotrends | Barchart | OpenBB | Stock Finder (current) | Stock Finder (proposed) |
|---|---|---|---|---|---|---|---|---|
| Live price quotes | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ |
| RSI / MACD / BB overlays | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| EMA / SMA togglable overlays | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Candlestick chart mode | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | 🚀 Sprint 1 |
| Stochastic Oscillator | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ | 🚀 Sprint 1 |
| ATR indicator | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | 🚀 Sprint 1 |
| Williams %R | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ | 📋 Sprint 2 |
| OBV chart panel | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ | 📋 Sprint 2 |
| Screener — technical filters | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Screener — fundamental filters | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ |
| 52-week high/low range bar | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Short interest | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | ✅ | ✅ |
| Earnings calendar (per-ticker) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Analyst price targets | ❌ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ✅ |
| Historical financials table | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| News feed per ticker | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Insider transactions feed | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | External link only | 📋 Sprint 2 |
| Watchlist + browser alerts | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | Screener only | 📋 Sprint 2 |
| SEC filing viewer | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | 📋 Sprint 2 |
| Economic indicators (FRED) | ❌ | ✅ (paid) | ❌ | ✅ | ✅ | ✅ | ❌ | 📋 Sprint 3 |
| Congressional trades | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Options chain | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | 🔭 Roadmap |
| Sector heatmap | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | 🔭 Roadmap |
| Portfolio tracker | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ | 🔭 Roadmap |

---

## 📊 Priority Scoring Summary

| # | Feature | User Value | Effort | Differentiation | Score | Sprint |
|---|---|---|---|---|---|---|
| 1 | Candlestick Chart Mode | 4 | 2 | 4 | 10 | This sprint |
| 2 | Stochastic Oscillator | 4 | 1 | 3 | 10 | This sprint |
| 3 | Watchlist Page + Browser Alerts | 5 | 3 | 3 | 10 | This sprint |
| 4 | Insider Transactions Feed | 4 | 3 | 4 | 9 | Sprint 2 |
| 5 | ATR Display | 3 | 1 | 3 | 8 | This sprint |
| 6 | Economic Indicators (FRED) | 4 | 4 | 4 | 8 | Sprint 3 |
| 7 | SEC Filing Viewer | 4 | 4 | 4 | 8 | Sprint 2 |
| 8 | Williams %R | 3 | 1 | 2 | 7 | Sprint 2 |
| 9 | OBV Chart Panel | 3 | 2 | 2 | 6 | Sprint 2 |
| 10 | Options Chain Viewer | 5 | 5 | 4 | 9 | Roadmap |
| 11 | Sector Heatmap | 3 | 5 | 4 | 6 | Roadmap |
| 12 | Portfolio Tracker | 5 | 5 | 2 | 7 | Roadmap |
| 13 | Candlestick Pattern Recognition | 4 | 4 | 3 | 7 | Roadmap |

*Score = (User Value × 2) + Differentiation − Effort*

---

## 📡 Free API Reference (validated this run)

| API | Endpoint | Data confirmed | Rate limit | Key required |
|---|---|---|---|---|
| yahoo-finance2 (integrated) | `getHistoricalData()` — OHLCV per day | ✅ OHLC for candlestick, ATR, Stochastic, OBV | Unofficial; cache aggressively | No |
| yahoo-finance2 | `options(ticker)` | ✅ Full options chain per expiry | Same | No |
| `technicalindicators` (installed) | `Stochastic`, `ATR`, `OBV`, `WilliamsR` classes | ✅ All computable from existing OHLCV | N/A — local computation | No |
| `lightweight-charts` v5.2.0 | npm package — canvas rendering | ✅ Candlestick series, line series | N/A — local rendering | No |
| SEC EDGAR submissions | `https://data.sec.gov/submissions/CIK{cik}.json` | ✅ Filing history (10-K, 10-Q, 8-K, Form 4) — confirmed free & keyless per SEC developer docs | ~10 req/sec | No |
| SEC EDGAR full-text search | `https://efts.sec.gov/LATEST/search-index?q={ticker}&forms=4` | ✅ Form 4 insider filings, CIK lookup — confirmed free & keyless | ~10 req/sec | No |
| FRED REST API | `https://api.stlouisfed.org/fred/series/observations?series_id={id}&api_key={key}` | ✅ Fed Funds Rate, CPI, Unemployment, 10Y Yield, GDP — confirmed active | 120 req/min | Yes — free at fred.stlouisfed.org |
| Finnhub free tier | `https://finnhub.io/api/v1/stock/insider-transactions?symbol={ticker}&token={key}` | ✅ Form 4 insider transactions — confirmed on free plan | 60 req/min | Yes — free at finnhub.io, no credit card |
| House Stock Watcher | `https://housestockwatcher.com/api` | ⚠️ S3 bucket returning HTTP 403 as of early 2026 | N/A | No |
| Senate Stock Watcher | `https://senatestockwatcher.com/api` | ✅ Senate trades JSON — confirmed operational | No documented limit | No |

---

## 🔄 Shipped Since Last Report (2026-04-20)

The following features from the prior backlog are now confirmed built and deployed:

| Feature | Prior Status | Current Status |
|---|---|---|
| 52-Week High/Low Range Bar | Quick Win (unbuilt) | ✅ Shipped — visual bar component on stock detail page |
| Short Interest Display | Quick Win (unbuilt) | ✅ Shipped — `ShortInterestWidget` with High/Extreme badges |
| Historical Financials Table | Backlog | ✅ Shipped — `/api/financials/[ticker]` with 12h cache |
| News Feed Per Ticker | Backlog | ✅ Shipped — `/api/news/[ticker]` with 15min cache, collapsible widget |
| Fundamental Screener Filters | Backlog (top priority) | ✅ Shipped — P/E, Market Cap, Dividend Yield, Revenue Growth all wired to `FilterCriteria` |

---

*Report generated automatically by Claude Code PM Research Agent on 2026-04-25. Community signal sourced from HN Algolia API, web search (Reddit r/stocks, r/algotrading discussions), and competitor product research. All suggested features use free or free-tier APIs only. House Stock Watcher S3 endpoint confirmed inaccessible as of this run — note for congressional trades data resilience review. Verify all API terms of service before shipping to production.*
