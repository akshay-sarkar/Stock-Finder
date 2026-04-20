# Stock Finder — PM Feature Research Report
**Generated:** 2026-04-20 UTC
**Agent:** Claude Code PM Research Agent
**Project:** Stock Finder (Yahoo Finance + Technical Analysis + Screener)
**Prior report:** pm-features-2026-04-18.md
**Competitors analyzed:** Finviz, TradingView, Stockanalysis.com, Macrotrends, Barchart, OpenBB

---

## Executive Summary

This report is a delta update from the 2026-04-18 PM report. Since that report, four features have shipped:

- **Earnings Calendar Widget** — per-ticker earnings date, EPS estimate range, 4-quarter history with beat/miss badge
- **Analyst Price Targets + Recommendations** — consensus gauge, low/mean/high targets, upside %
- **52-Week High/Low** — displayed in Key Statistics (text, not range bar)
- **EMA20, SMA50, SMA200 toggle overlays** on price chart

Two previously identified Quick Wins remain unbuilt:

- **52-Week High/Low Range Bar** (Score 9, Effort 1) — the data is already in `StockFundamentals`; only the visual component is missing
- **Short Interest Display** (Score 7, Effort 2) — `defaultKeyStatistics` from yahoo-finance2 exposes this; no new API integration needed

The screener filter set remains narrow (RSI, MACD, MA, Volume only). Competitors differentiate heavily on screener depth: fundamental filters (P/E range, market cap, dividend yield, revenue growth) are present on every major platform. This is the highest-leverage gap remaining.

Community research (HN discussions, fintech Show HN posts) consistently validates these themes:
1. Users leave screeners for fundamental data — historical financials and revenue tables are the primary exit point
2. Insider transaction visibility drives repeated return visits (CatalystAlert, Insiderviz, and multiple HN Show HN posts confirm demand)
3. Consolidated "death by a thousand subscriptions" is a real pain point — aggregating options flow, insider trades, and earnings in one free tool is a clear positioning opportunity

**Priority this sprint:** Fundamental screener filters first (highest differentiation vs effort), then the two remaining quick wins, then Historical Financials.

---

## Quick Wins — Ship This Sprint
*(Priority Score >= 7, Effort <= 2)*

### 1. 52-Week High/Low Range Bar
**Score: 9** | User Value: 3 | Differentiation: 3 | Effort: 1

**What:** A visual progress bar on the stock detail page showing where the current price sits within its 52-week range. Show percentage distance from the low and high at each end.

**Why:** The data (`fiftyTwoWeekHigh`, `fiftyTwoWeekLow`, `currentPrice`) is already present in `StockDetailData` and rendered as text in Key Statistics. This is purely a UI component addition — zero API changes, zero new data fetching.

**Implementation notes:**
- Position = `(currentPrice - low) / (high - low) * 100`
- Add a `<div>` range bar with a dot marker and percentage labels to the header quick-stats row or Key Statistics section
- Reuse the existing `FundRow` grid — add as a new "52W Position" row with an inline bar
- Total effort: ~30 minutes, one component

**Free API:** `yahoo-finance2` (already integrated, data already fetched)

---

### 2. Short Interest Display
**Score: 7** | User Value: 3 | Differentiation: 3 | Effort: 2

**What:** Show short % of float, short ratio (days to cover), and shares short on the stock detail page. Flag stocks with short % > 20% with a "High Short Interest" badge.

**Why:** Finviz surfaces short interest as a primary metric. Squeeze setups are among the most-searched signals for retail traders. The `defaultKeyStatistics` yahoo-finance2 module already returns `shortPercentOfFloat`, `shortRatio`, `sharesShort`, `sharesShortPriorMonth` — no new API integration is needed, only a new `quoteSummary` module call.

**Implementation notes:**
- Extend `/api/stock/[ticker]/route.ts`: add `defaultKeyStatistics` to the `quoteSummary` modules array
- Add a `ShortInterest` interface to `lib/types.ts` with fields: `shortPercentOfFloat`, `shortRatio`, `sharesShort`, `sharesShortPriorMonth`
- Add a new `ShortInterestCard` component to `stock/[ticker]/page.tsx` alongside Key Statistics
- Badge logic: short % > 20% → amber "High Short Interest"; > 30% → red "Extreme Short Interest"
- Cache TTL: 2 hours (short data updates twice monthly from FINRA, but Yahoo updates its cached value more frequently)

**Free API:** `yahoo-finance2` `defaultKeyStatistics` module (no key required)

---

## Backlog — Highest Leverage Items
*(Score 4–6, ordered by ROI)*

### 3. Fundamental Screener Filters
**Score: 8** | User Value: 5 | Differentiation: 4 | Effort: 3

**What:** Add fundamental filter dimensions to the screener: P/E range (e.g. < 15, 15–25, > 25), market cap tier (Micro < $300M, Small, Mid, Large, Mega), dividend yield (Any / Pays dividend / Yield > 3%), and revenue growth (Positive YoY / Accelerating). These are the most common screener filters on every competitor platform.

**Why:** The current screener only filters on technical signals (RSI, MACD, MA, Volume). Users who want to screen for value stocks, dividend payers, or growth companies have no path — they must use Finviz or Stockanalysis and return to Stock Finder only for charts. Closing this gap converts one-time visitors into regular screener users. All required data is already returned by the `screener` route's `getHistoricalData` call, but `buildScreenerRow` and `applyFilters` do not yet include fundamentals.

**Gap vs competitors:**
- Finviz: P/E, Forward P/E, Market Cap, Dividend Yield, Profit Margin, Debt/Equity — all filterable
- Stockanalysis: Market Cap, P/E, Revenue Growth, Profit Margin
- Barchart: Market Cap, P/E, Dividend Yield, Beta

**Implementation notes:**
- Extend `ScreenerRow` in `lib/types.ts` to include: `marketCap`, `trailingPE`, `dividendYield`, `revenueGrowth`
- Extend `FilterCriteria` to include: `marketCap: 'any' | 'micro' | 'small' | 'mid' | 'large' | 'mega'`, `pe: 'any' | 'under15' | '15to25' | 'over25' | 'negative'`, `dividend: 'any' | 'payers' | 'yield3plus'`, `revenueGrowth: 'any' | 'positive' | 'negative'`
- In `/api/screener/route.ts`: fetch `quoteSummary` for each ticker with modules `['summaryDetail', 'defaultKeyStatistics']` alongside the existing OHLCV fetch; add to `TickerSnapshot`
- In `lib/screener.ts`: extend `buildScreenerRow` and `applyFilters` to apply fundamental criteria
- In `app/page.tsx`: add a second row of filter dropdowns for fundamental filters; keep technical and fundamental filters visually grouped
- Performance note: `quoteSummary` calls add ~100–200ms per ticker on cache miss; batch screener is already async parallel, so marginal cost is absorbed. Cache TTL remains 10 minutes.

**Free API:** `yahoo-finance2` `summaryDetail` + `defaultKeyStatistics` modules (already dependency, no key)

---

### 4. Historical Financials Table (Annual + Quarterly)
**Score: 6** | User Value: 5 | Differentiation: 3 | Effort: 4

**What:** A structured table on the stock detail page showing 5 years annual and 8 quarters of: Revenue, Gross Profit, Operating Income, Net Income, EPS — with YoY growth percentages per row. Add a tab toggle between Annual and Quarterly views.

**Why:** Macrotrends and Stockanalysis are destination sites specifically because they show historical income statements. Users performing fundamental analysis always need more than TTM figures. This data is the single biggest content gap on the stock detail page today. Community research confirmed this: HN's "Base.report" and "Finboard" projects both launched to fill this exact need.

**Implementation notes:**
- `quoteSummary(ticker, { modules: ['incomeStatementHistory', 'incomeStatementHistoryQuarterly'] })` returns arrays of `{ totalRevenue, grossProfit, operatingIncome, netIncome, endDate }`
- New API route: `/api/financials/[ticker]/route.ts` — returns `{ annual: [...], quarterly: [...] }` with pre-computed YoY growth
- UI: "Financials" collapsible section on stock detail page below Key Statistics, using `<table>` with sticky header column for metric labels; tab toggle for Annual/Quarterly
- Numbers formatted with `fmtCap()` helper already in scope; growth rates colored green/red
- Cache TTL: 12 hours

**Free API:** `yahoo-finance2` (already integrated)

---

### 5. Insider Transactions Feed (per ticker)
**Score: 6** | User Value: 4 | Differentiation: 3 | Effort: 3

**What:** Show recent Form 4 insider transactions for the viewed ticker: insider name, title, Buy/Sell badge, shares, price, date. Aggregate net buying/selling over 90 days as a sentiment signal (e.g. "Net buyer: +$2.4M in 90 days").

**Why:** Multiple HN Show HN projects (Insiderviz, CatalystAlert, "Track Insider CEO Stock Purchases") confirm high retail demand for insider signal aggregation. Finviz has an insider screen. Stock Finder currently links externally to Quiver Quant Insiders — this is an opportunity to bring that data inline. SEC EDGAR Form 4 data is free and keyless; Finnhub free tier also provides a clean JSON endpoint.

**Implementation notes:**
- Primary: Finnhub free tier `GET /stock/insider-transactions?symbol={ticker}` — returns JSON array with `name`, `share`, `value`, `transactionDate`, `transactionCode` (P=purchase, S=sale)
- Fallback / keyless alternative: SEC EDGAR `https://data.sec.gov/submissions/CIK{cik}.json` + filter for form type "4"
- New API route: `/api/insider/[ticker]/route.ts`
- CIK resolution: `https://efts.sec.gov/LATEST/search-index?q=%22{ticker}%22&forms=4&dateRange=custom&startdt={90daysago}` (keyless)
- UI: collapsible table on stock detail page; Buy = emerald badge, Sell = red badge; aggregate net sentiment chip
- Requires free Finnhub API key in `.env` as `FINNHUB_API_KEY` (60 req/min free tier)
- Cache TTL: 2 hours

**Free API:** Finnhub free tier (60 req/min, no credit card) — or SEC EDGAR (keyless, ~10 req/sec)

---

### 6. SEC Filing Viewer (10-K, 10-Q, 8-K)
**Score: 6** | User Value: 4 | Differentiation: 4 | Effort: 4

**What:** A collapsible section on the stock detail page listing recent SEC filings — form type, filing date, description, and direct EDGAR link. Minimum viable: 5 most recent filings per form type. Stretch: parse and surface the revenue/net income line from 10-K XBRL data.

**Why:** OpenBB and Stockanalysis both surface EDGAR filings. Source filing access is increasingly expected by retail investors post-meme-stock era. The SEC EDGAR API is entirely free and keyless.

**Implementation notes:**
- CIK lookup: `https://efts.sec.gov/LATEST/search-index?q=%22{ticker}%22&forms=10-K,10-Q,8-K`
- Filing list: `https://data.sec.gov/submissions/CIK{padded_cik}.json` → `filings.recent` object
- New API route: `/api/filings/[ticker]/route.ts`
- UI: collapsible "SEC Filings" section, 3 tabs (10-K / 10-Q / 8-K), each showing last 5 filings with date and EDGAR external link
- Cache TTL: 24 hours (filings are infrequent)

**Free API:** SEC EDGAR `https://data.sec.gov/` — no key required, rate limit ~10 req/sec

---

### 7. Economic Indicators Dashboard (FRED)
**Score: 5** | User Value: 4 | Differentiation: 4 | Effort: 4

**What:** A dedicated `/macro` page showing US macro indicators with sparkline trend charts: Fed Funds Rate, CPI YoY, Unemployment Rate, 10Y Treasury Yield, GDP Growth. Each card shows current value, prior period, and direction arrow.

**Why:** No competitor in the "free stock screener" tier has a clean macro dashboard. TradingView has one behind a paywall. This is a meaningful differentiator and gives Stock Finder a reason to be bookmarked even on days users are not screening. FRED API is free with a trivially-obtained key.

**Implementation notes:**
- FRED API: `https://api.stlouisfed.org/fred/series/observations?series_id={id}&api_key={key}&limit=24&sort_order=desc&file_type=json`
- Series IDs: `FEDFUNDS` (Fed Rate), `CPIAUCSL` (CPI), `UNRATE` (Unemployment), `GS10` (10Y Yield), `A191RL1Q225SBEA` (GDP Growth)
- Add `FRED_API_KEY` to `.env`; new API route `/api/macro/route.ts`
- UI: 5-card grid on `/macro` page, each card with a Recharts `<LineChart>` sparkline (Recharts already a dependency)
- Cache TTL: 6 hours (macro data is never intraday)

**Free API:** FRED `https://api.stlouisfed.org/fred/` — free key at fred.stlouisfed.org, 120 req/min

---

### 8. News Feed Per Ticker
**Score: 4** | User Value: 4 | Differentiation: 2 | Effort: 4

**What:** A feed of 5–10 recent news headlines for the viewed ticker: title, source, time-ago label, and external link. Refreshed every 15 minutes.

**Why:** Barchart and TradingView surface news inline. Users currently bounce to Google Finance or Seeking Alpha for headlines. Keeping them on Stock Finder increases session duration. `yahoo-finance2` `search()` already returns news — this is mostly a UI build.

**Implementation notes:**
- `search(ticker, { newsCount: 10 })` from `yahoo-finance2` → `news[]` with `title`, `publisher`, `link`, `providerPublishTime`
- New API route: `/api/news/[ticker]/route.ts`
- UI: collapsible "Recent News" section on stock detail page below Earnings widget; list of headline rows with publisher badge and "X min ago" timestamp
- Cache TTL: 15 minutes

**Free API:** `yahoo-finance2` `search()` (already integrated)

---

### 9. Watchlist with Browser Price Alerts
**Score: 5** | User Value: 5 | Differentiation: 2 | Effort: 4

**What:** Persist a watchlist to `localStorage` (already partially implemented in the screener as `sf-watchlist-v2`). Add a dedicated `/watchlist` page with live prices and one-click threshold alerts using the browser Notification API.

**Why:** TradingView's watchlist is its primary retention mechanism. The screener already has watchlist management (add/remove/import/export tickers) and a sidebar on the stock detail page. The missing pieces are: a standalone `/watchlist` page, price polling on an interval, and alert threshold storage. No backend changes needed.

**Implementation notes:**
- New page: `app/watchlist/page.tsx` — polls `/api/prices` every 60s via `setInterval`
- Alert thresholds stored as `sf-alerts` in `localStorage`: `{ [ticker]: { above?: number, below?: number } }`
- On each poll, compare current price to threshold; trigger `new Notification(...)` if crossed (requires `Notification.requestPermission()` on first set)
- Add "Add to Watchlist" star icon button to stock detail header (reuse existing `DEFAULT_TICKERS` logic, extend to per-user localStorage list)
- The sidebar on the stock detail page already shows live prices for the default ticker list — extend to the user's custom watchlist

**Free API:** `/api/prices` (already built, uses `yahoo-finance2`)

---

## Future Roadmap
*(Score < 4 or Effort = 5)*

### 10. Options Chain Viewer
**Score: 3** | User Value: 5 | Differentiation: 4 | Effort: 5

**What:** Full options chain (calls and puts) for nearest expiry: strike, bid/ask, open interest, IV, delta. Basic IV rank metric. Community research confirms high demand (HN: "rebuilt 9 options trading SaaS and made it free" — options flow + unusual activity scanner ranked top feature requests among algo traders).

**Why deferred:** Parsing and rendering a full options chain is significant UI/UX work. IV rank requires historical IV data not available from yahoo-finance2. Recommended after Historical Financials and Fundamental Screener Filters are validated.

**Free API:** `yahoo-finance2` `options()` method returns full chain per expiry

---

### 11. Sector & Industry Heatmap
**Score: 3** | User Value: 3 | Differentiation: 4 | Effort: 4

**What:** Visual treemap of S&P 500 sectors by daily performance (green/red color intensity), drillable to sub-industries. Finviz's most viral feature — screenshots shared constantly.

**Why deferred:** Recharts does not have a performant native treemap for 500 tickers. Requires a curated ticker-to-sector mapping dataset and custom rendering. Revisit after Fundamental Screener is live (same sector/industry data used by both features).

**Free API:** `yahoo-finance2` sector/industry fields on screener results; no direct heatmap API

---

### 12. Portfolio Tracker with P&L
**Score: 2** | User Value: 5 | Differentiation: 2 | Effort: 5

**What:** Input holdings (ticker, shares, cost basis) → real-time portfolio value, per-position P&L, total return. No auth; localStorage only.

**Why deferred:** Edge cases (splits, dividends, cost basis lot tracking) make this more complex than it appears. Revisit after Watchlist with Alerts is validated as a retention mechanism.

**Free API:** `/api/prices` (already built)

---

## Evaluated but Excluded

| Feature | Reason excluded |
|---|---|
| RSI, MACD, Bollinger Bands | Already built |
| Stock screener with filters | Already built |
| Yahoo Finance data integration | Already built (yahoo-finance2) |
| Recharts charting | Already built |
| Next.js 14 App Router | Already built |
| Congressional trades dashboard | Already built |
| Google Finance + Quiver Quant external links | Already built |
| Earnings Calendar Widget | Already built (shipped since last report) |
| Analyst Price Targets + Recommendations | Already built (shipped since last report) |
| 52-Week High/Low data | Already built (text display in Key Statistics) |
| EMA20, SMA50, SMA200 overlays | Already built (shipped since last report) |
| Real-time Level 2 order book | No free API; all providers require paid subscriptions |
| AI-generated stock summaries | LLM cost per request; no free inference API suitable for production |
| Dark pool / unusual options activity | No reliable free API; Unusual Whales and similar are paid-only |
| Crypto prices | Out of scope for equity-focused product |
| Social sentiment (Reddit/Twitter) | Twitter/X API now paid; Reddit API rate limits are severe for production use |
| Alpha Vantage earnings history | 25 req/day on free tier — too restrictive for production; use yahoo-finance2 instead |

---

## Competitive Feature Gap Matrix

| Feature | Finviz | TradingView | Stockanalysis | Macrotrends | Barchart | OpenBB | Stock Finder (current) | Stock Finder (proposed) |
|---|---|---|---|---|---|---|---|---|
| Live price quotes | Yes | Yes | Yes | No | Yes | Yes | Yes | Yes |
| RSI / MACD / Bollinger Bands | Yes | Yes | No | No | Yes | Yes | Yes | Yes |
| EMA / SMA overlays (togglable) | Yes | Yes | No | No | Yes | Yes | Yes | Yes |
| Stock screener — technical filters | Yes | Yes | Yes | No | Yes | Yes | Yes | Yes |
| Stock screener — fundamental filters | Yes | Yes | Yes | No | Yes | Yes | No | Sprint 1 |
| 52-week high/low range bar | Yes | Yes | Yes | Yes | Yes | Yes | Text only | Sprint 1 |
| Short interest | Yes | No | Yes | No | Yes | No | No | Sprint 1 |
| Earnings calendar (per-ticker) | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Analyst price targets | No | Yes | Yes | No | Yes | No | Yes | Yes |
| Historical financials table | No | No | Yes | Yes | No | Yes | No | Sprint 1–2 |
| Insider transactions feed | Yes | No | No | No | No | Yes | External link only | Sprint 2 |
| SEC filing access | No | No | Yes | No | No | Yes | No | Sprint 2 |
| News feed per ticker | No | Yes | No | No | Yes | Yes | No | Sprint 2 |
| Watchlist / browser alerts | Yes | Yes | No | No | Yes | Yes | Screener only (no alerts page) | Sprint 2 |
| Macro/economic indicators | No | Yes (paid) | No | Yes | Yes | Yes | No | Sprint 2–3 |
| Options chain | Yes | Yes | Yes | No | Yes | Yes | No | Roadmap |
| Sector heatmap | Yes | No | No | No | No | No | No | Roadmap |
| Congressional trades | No | No | No | No | No | No | Yes | Yes |
| Portfolio tracker | No | Yes | No | No | Yes | Yes | No | Roadmap |

---

## Priority Scoring Summary

| # | Feature | User Value | Effort | Differentiation | Score | Sprint |
|---|---|---|---|---|---|---|
| 1 | 52-Week High/Low Range Bar | 3 | 1 | 3 | 8 | This sprint |
| 2 | Fundamental Screener Filters | 5 | 3 | 4 | 11 | This sprint |
| 3 | Short Interest Display | 3 | 2 | 3 | 7 | This sprint |
| 4 | Historical Financials Table | 5 | 4 | 3 | 9 | Sprint 2 |
| 5 | Insider Transactions Feed | 4 | 3 | 3 | 8 | Sprint 2 |
| 6 | SEC Filing Viewer | 4 | 4 | 4 | 8 | Sprint 2 |
| 7 | Watchlist + Browser Alerts | 5 | 4 | 2 | 8 | Sprint 2 |
| 8 | News Feed Per Ticker | 4 | 4 | 2 | 6 | Sprint 2 |
| 9 | Economic Indicators (FRED) | 4 | 4 | 4 | 8 | Sprint 3 |
| 10 | Options Chain Viewer | 5 | 5 | 4 | 9 | Roadmap |
| 11 | Sector Heatmap | 3 | 4 | 4 | 6 | Roadmap |
| 12 | Portfolio Tracker | 5 | 5 | 2 | 7 | Roadmap |

*Score = (User Value × 2) + Differentiation − Effort*

---

## Free API Reference (validated this run)

| API | Endpoint | Data available | Rate limit | Key required |
|---|---|---|---|---|
| yahoo-finance2 (integrated) | `quoteSummary()`: `calendarEvents`, `earningsTrend`, `financialData`, `recommendationTrend`, `defaultKeyStatistics`, `incomeStatementHistory`, `incomeStatementHistoryQuarterly`, `summaryDetail` | Earnings, price targets, short interest, analyst ratings, income statements, market cap, P/E, dividend yield | Unofficial; no hard limit; cache aggressively | No |
| yahoo-finance2 search | `search(ticker, { newsCount: 10 })` | News headlines, publisher, timestamp, link | Same as above | No |
| yahoo-finance2 options | `options(ticker)` | Full options chain per expiry, IV | Same as above | No |
| SEC EDGAR submissions | `https://data.sec.gov/submissions/CIK{cik}.json` | Filing history (10-K, 10-Q, 8-K) with dates and accession numbers | ~10 req/sec | No |
| SEC EDGAR full-text search | `https://efts.sec.gov/LATEST/search-index?q={ticker}&forms=10-K,10-Q,8-K` | Recent filings by form type; CIK lookup | ~10 req/sec | No |
| FRED | `https://api.stlouisfed.org/fred/series/observations?series_id={id}&api_key={key}` | Fed Funds Rate (`FEDFUNDS`), CPI (`CPIAUCSL`), Unemployment (`UNRATE`), 10Y Yield (`GS10`), GDP Growth (`A191RL1Q225SBEA`) | 120 req/min | Yes — free at fred.stlouisfed.org |
| Finnhub free tier | `https://finnhub.io/api/v1/stock/insider-transactions?symbol={ticker}&token={key}` | Form 4 insider transactions (name, shares, value, date, type) | 60 req/min | Yes — free at finnhub.io (no credit card) |

---

*Report generated by Claude Code PM Research Agent on 2026-04-20. Community signal sourced from HN Algolia API (finviz, stock screener, insider trading, options flow queries). All competitor feature assessments based on public product research as of report date. Free API rate limits subject to change by providers.*
