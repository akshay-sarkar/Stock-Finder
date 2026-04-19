# Stock Finder — PM Feature Research Report
**Generated:** 2026-04-18 UTC
**Agent:** Claude Code PM Research Agent
**Project:** Stock Finder (Yahoo Finance + Technical Analysis + Screener)
**Competitors analyzed:** Finviz, TradingView, Stockanalysis.com, Macrotrends, Barchart, OpenBB

---

## Executive Summary

Stock Finder is a solid foundation with live quotes, technical indicators (RSI, MACD, Bollinger Bands), a stock screener, and a congressional trades dashboard. The primary gaps versus competitors are: earnings/fundamental data depth (Stockanalysis, Macrotrends lead here), insider trading visualization (Finviz), watchlist/portfolio tracking (TradingView), news feed integration (Barchart), and SEC filing access (OpenBB). All recommended features below are achievable with free/keyless APIs already validated in the ecosystem. Priority scoring uses the formula: **Score = (User Value × 2) + Differentiation − Effort**, where User Value (1–5), Differentiation (1–5), and Effort (1–5) are estimated based on competitor research and implementation complexity.

Key takeaways:
- **4 quick wins** can be shipped this sprint with minimal effort and high user impact.
- **6 backlog items** represent medium-complexity features that close the biggest competitive gaps.
- **3 roadmap items** are exploratory or infrastructure-heavy features worth revisiting in Q3.

---

## Quick Wins — Ship This Sprint
*(Priority Score >= 7, Effort <= 2)*

### 1. Earnings Calendar Widget (per-ticker + global)
**Score: 10** | User Value: 4 | Differentiation: 4 | Effort: 2

**What:** Show upcoming and recent earnings dates on the ticker detail page (e.g., "Next earnings: May 2, 2026 — Est. EPS: $1.42"). Add a global /earnings page listing all S&P 500 earnings in the next 7 days.

**Why:** Finviz, Stockanalysis, and Barchart all surface earnings dates prominently. This is one of the most-requested data points for retail traders. Yahoo Finance unofficial API (`yahoo-finance2`) already exposes `earningsDate`, `epsActual`, `epsEstimate`, and `revenueEstimate` fields on the `quoteSummary` call — zero new API integration required.

**Implementation notes:**
- `quoteSummary(ticker, { modules: ['calendarEvents', 'earningsTrend'] })` returns earnings date + EPS estimates
- Display on stock detail page below the price header
- Global earnings page: loop over a curated watchlist or screener results, cache aggressively (TTL 6h)
- UI: simple table sorted by date, badge for "beat / miss / in-line" on past earnings

**Free API:** `yahoo-finance2` (already integrated)

---

### 2. Analyst Price Targets + Recommendation Summary
**Score: 9** | User Value: 4 | Differentiation: 3 | Effort: 2

**What:** Show the consensus analyst recommendation (Strong Buy / Buy / Hold / Sell) and the average, low, and high 12-month price targets on the ticker detail page.

**Why:** TradingView and Stockanalysis both display this. It gives retail traders a fast sentiment signal without reading reports. The data is already available in `yahoo-finance2` via `recommendationTrend` and `financialData` modules.

**Implementation notes:**
- `quoteSummary(ticker, { modules: ['financialData', 'recommendationTrend'] })` returns `targetMeanPrice`, `targetLowPrice`, `targetHighPrice`, `recommendationMean`, `recommendationKey`
- Render as a horizontal gauge (Strong Sell → Strong Buy) + three price target labels
- Cache TTL: 4 hours (analyst targets don't move intraday)

**Free API:** `yahoo-finance2` (already integrated)

---

### 3. 52-Week High/Low Range Bar
**Score: 9** | User Value: 3 | Differentiation: 3 | Effort: 1

**What:** Display a visual range bar on the ticker detail page showing where the current price sits relative to its 52-week high and low, with percentage distance labels.

**Why:** Finviz and Barchart show this prominently. It is one of the fastest ways for a trader to gauge valuation and momentum relative to recent history. Yahoo Finance returns `fiftyTwoWeekLow` and `fiftyTwoWeekHigh` in the standard quote response already fetched by the `/api/prices` route.

**Implementation notes:**
- No new API call needed — fields are already returned by `yahoo-finance2` `quote()`
- UI: simple progress bar component, percentage distance from high and low labeled at each end
- Add to the metrics strip below the price header on the stock detail page

**Free API:** `yahoo-finance2` (already integrated)

---

### 4. Short Interest Display
**Score: 7** | User Value: 3 | Differentiation: 3 | Effort: 2

**What:** Show short interest percentage of float, short ratio (days to cover), and change since last report on the ticker detail page.

**Why:** Finviz surfaces short interest as a first-class metric. It is a key signal for squeeze setups and bearish conviction. Available via `yahoo-finance2` `defaultKeyStatistics` module.

**Implementation notes:**
- `quoteSummary(ticker, { modules: ['defaultKeyStatistics'] })` returns `shortPercentOfFloat`, `shortRatio`, `sharesShort`, `sharesShortPreviousMonthDate`
- Display as a small stats card alongside market cap and P/E
- Badge alert if short % > 20% (high short interest flag)

**Free API:** `yahoo-finance2` (already integrated)

---

## Backlog — Next 1–2 Sprints
*(Score 4–6)*

### 5. SEC Filing Viewer (10-K, 10-Q, 8-K)
**Score: 6** | User Value: 4 | Differentiation: 4 | Effort: 4

**What:** Link to or inline-display recent SEC filings for the viewed ticker — at minimum 10-K, 10-Q, and 8-K with filing date and a direct EDGAR link. Stretch: parse and surface key metrics from the filing (revenue, net income, EPS) as structured data.

**Why:** OpenBB and Stockanalysis both surface EDGAR filings. Retail investors increasingly want direct access to source filings. The SEC EDGAR full-text search API is free and keyless.

**Implementation notes:**
- Endpoint: `https://data.sec.gov/submissions/CIK{cik}.json` — returns filing history
- CIK lookup: `https://efts.sec.gov/LATEST/search-index?q=%22{ticker}%22&dateRange=custom&startdt=2020-01-01&forms=10-K`
- Alternative simpler approach: `https://efts.sec.gov/LATEST/search-index?q=%22{ticker}%22&forms=10-K,10-Q,8-K` for recent filings list
- New API route: `/api/sec-filings?ticker=AAPL` — fetches CIK, then last 5 filings per type
- UI: collapsible table on stock detail page, filing type badge + date + external EDGAR link
- Cache TTL: 24 hours (filings are infrequent)

**Free API:** SEC EDGAR (`https://data.sec.gov/` — no key required, rate limit ~10 req/sec)

---

### 6. Insider Transactions Feed (per ticker)
**Score: 6** | User Value: 4 | Differentiation: 3 | Effort: 3

**What:** Show recent Form 4 insider buy/sell transactions for the viewed ticker — insider name, title, transaction type, shares, price, and date. Aggregate net buying/selling over 30/90 days as a sentiment signal.

**Why:** Finviz has an insider trading screen. Quiver Quant (already linked externally) shows this data. Surfacing it inline removes a click and increases engagement. SEC EDGAR Form 4 filings are freely available. Finnhub free tier also provides this endpoint.

**Implementation notes:**
- Finnhub free tier: `https://finnhub.io/api/v1/stock/insider-transactions?symbol={ticker}&token={key}` — 60 req/min on free tier
- Alternative (keyless): parse SEC EDGAR Form 4 XBRL data from `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK={cik}&type=4&dateb=&owner=include&count=20`
- Recommend Finnhub (simpler JSON) — free tier key required but trivially obtained
- UI: table on stock detail page, color-coded Buy (green) / Sell (red), aggregate net sentiment badge
- Cache TTL: 2 hours

**Free API:** Finnhub free tier (60 req/min, no credit card) or SEC EDGAR Form 4

---

### 7. Historical Financials Table (Annual + Quarterly)
**Score: 6** | User Value: 5 | Differentiation: 3 | Effort: 4

**What:** Display a structured table of historical revenue, gross profit, operating income, net income, and EPS — 5 years annual and 8 quarters trailing. Add simple YoY and QoQ growth percentages per row.

**Why:** Macrotrends and Stockanalysis are go-to destinations specifically for historical financials. This is the single biggest content gap in Stock Finder today. Users who want fundamental analysis have to leave the app.

**Implementation notes:**
- `quoteSummary(ticker, { modules: ['incomeStatementHistory', 'incomeStatementHistoryQuarterly', 'earningsHistory'] })` from `yahoo-finance2`
- Parse `incomeStatementHistory.incomeStatementHistory[]` — each object contains `totalRevenue`, `grossProfit`, `operatingIncome`, `netIncome`, `ebit`
- Compute YoY growth inline during API response processing
- New page section or tab: "Financials" tab on stock detail page alongside the chart
- Cache TTL: 12 hours

**Free API:** `yahoo-finance2` (already integrated)

---

### 8. Economic Indicators Dashboard (FRED)
**Score: 5** | User Value: 4 | Differentiation: 4 | Effort: 4

**What:** A dedicated `/macro` page displaying key US macro indicators with sparkline trend charts: Fed Funds Rate, CPI YoY, Unemployment Rate, 10Y Treasury Yield, GDP Growth Rate. Each indicator shows current value, prior period, and direction arrow.

**Why:** TradingView's economic calendar and Barchart's market overview surface macro context. No competitor in the "free stock screener" category has a clean macro dashboard. This differentiates Stock Finder meaningfully. FRED API is free with a key (easily obtained).

**Implementation notes:**
- FRED API: `https://api.stlouisfed.org/fred/series/observations?series_id={id}&api_key={key}&limit=24&sort_order=desc&file_type=json`
- Series IDs: `FEDFUNDS`, `CPIAUCSL`, `UNRATE`, `GS10`, `A191RL1Q225SBEA`
- Free tier: 120 req/min, no credit card — key obtained at fred.stlouisfed.org in 30 seconds
- Store FRED key in `.env` as `FRED_API_KEY`
- New API route: `/api/macro` returning all 5 series with last 24 data points each
- UI: card grid using Recharts `<LineChart>` sparklines (already a project dependency)
- Cache TTL: 6 hours (macro data is not intraday)

**Free API:** FRED (`https://api.stlouisfed.org/fred/` — free key, 120 req/min)

---

### 9. Watchlist with Price Alerts (localStorage)
**Score: 5** | User Value: 5 | Differentiation: 2 | Effort: 4

**What:** Allow users to add tickers to a persistent watchlist (localStorage, no auth required). Display a watchlist sidebar or page with current prices, daily change, and simple threshold alerts (browser notifications when price crosses a user-set level).

**Why:** TradingView's watchlist is a core retention feature. Users who create a watchlist return daily. localStorage keeps this zero-infrastructure — no backend changes, no auth.

**Implementation notes:**
- Store watchlist as JSON array in `localStorage` key `sf_watchlist`
- Watchlist page polls `/api/prices?tickers={csv}` on a 60-second interval using `setInterval`
- Price alerts: store alert thresholds in localStorage, check on each poll, trigger `Notification` API (browser push, no server needed)
- Add "Add to Watchlist" button (star icon via Lucide `Star`) on stock detail header
- New page: `/watchlist` — table view of all tracked tickers

**Free API:** `/api/prices` (already built, uses `yahoo-finance2`)

---

### 10. News Feed Per Ticker
**Score: 4** | User Value: 4 | Differentiation: 2 | Effort: 4

**What:** Display a feed of recent news headlines for the viewed ticker — title, source, time ago, and external link. Show 5–10 items, refreshed every 15 minutes.

**Why:** Barchart and TradingView both show news inline. Users bounce to Google Finance or Seeking Alpha for news — keeping them on Stock Finder increases session time. Yahoo Finance news is available via `yahoo-finance2`.

**Implementation notes:**
- `search(ticker, { newsCount: 10 })` from `yahoo-finance2` returns `news[]` with `title`, `publisher`, `link`, `providerPublishTime`
- Alternatively, `quoteSummary(ticker, { modules: ['summaryDetail'] })` can be augmented with the `search` call
- New API route: `/api/news?ticker=AAPL`
- UI: simple list component on stock detail page below the chart, "Open in new tab" links
- Cache TTL: 15 minutes

**Free API:** `yahoo-finance2` (already integrated)

---

## Future Roadmap
*(Score < 4 or Effort = 5)*

### 11. Options Chain Viewer
**Score: 3** | User Value: 5 | Differentiation: 4 | Effort: 5

**What:** Display the full options chain (calls and puts) for the nearest expiry, with strike, bid/ask, OI, implied volatility, and delta. Add a basic IV rank metric.

**Why:** TradingView and Barchart have full options chains. This is a heavily requested feature among retail options traders. However, parsing and rendering a full options chain is significant UI/UX work, and IV calculations require careful handling. Recommended for Q3 after core fundamentals are complete.

**Free API:** `yahoo-finance2` `options()` method — returns full chain per expiry

---

### 12. Portfolio Tracker with P&L
**Score: 2** | User Value: 5 | Differentiation: 2 | Effort: 5

**What:** Let users input their holdings (ticker, shares, cost basis) and see real-time portfolio value, per-position P&L, and total return. No auth required if stored in localStorage.

**Why:** Every major platform offers this. The feature itself is not differentiating, but it dramatically increases retention. The complexity is in edge cases: splits, dividends, cost basis tracking. Recommend revisiting after watchlist (item 9) is validated.

**Free API:** `/api/prices` (already built)

---

### 13. Sector & Industry Heatmap
**Score: 3** | User Value: 3 | Differentiation: 4 | Effort: 4

**What:** A visual treemap of S&P 500 sectors showing daily performance as color intensity (green/red), with drill-down to sub-industries. Similar to Finviz's signature heatmap.

**Why:** Finviz's heatmap is its most viral feature — traders share screenshots constantly. However, building a quality treemap requires a curated ticker-to-sector mapping dataset and a performant rendering strategy. Recharts does not have a native treemap that scales to 500 tickers gracefully. Requires either a pre-built sector dataset or scraping Yahoo Finance sector summary pages.

**Free API:** `yahoo-finance2` sector/industry fields on screener results; no direct heatmap API exists

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
| Real-time Level 2 order book | No free API exists; all providers require paid subscriptions |
| AI-generated stock summaries | Adds LLM cost per request; no free inference API suitable for production use |
| Dividend history calendar | Lower priority; Yahoo Finance provides data but user demand is lower than earnings/financials |
| Dark pool / unusual options activity | No reliable free API; Unusual Whales and similar services are paid-only |
| Crypto prices | Out of scope for equity-focused product; separate product decision required |
| Social sentiment (Reddit/Twitter) | Twitter/X API now paid; Reddit API rate limits are severe for production use |

---

## Competitive Feature Gap Matrix

| Feature | Finviz | TradingView | Stockanalysis | Macrotrends | Barchart | OpenBB | Stock Finder (current) | Stock Finder (proposed) |
|---|---|---|---|---|---|---|---|---|
| Live price quotes | Yes | Yes | Yes | No | Yes | Yes | Yes | Yes |
| RSI / MACD / Bollinger Bands | Yes | Yes | No | No | Yes | Yes | Yes | Yes |
| Stock screener | Yes | Yes | Yes | No | Yes | Yes | Yes | Yes |
| 52-week high/low range bar | Yes | Yes | Yes | Yes | Yes | Yes | No | Sprint 1 |
| Analyst price targets | No | Yes | Yes | No | Yes | No | No | Sprint 1 |
| Earnings calendar | Yes | Yes | Yes | Yes | Yes | Yes | No | Sprint 1 |
| Short interest | Yes | No | Yes | No | Yes | No | No | Sprint 1 |
| Historical financials table | No | No | Yes | Yes | No | Yes | No | Sprint 2 |
| SEC filing access | No | No | Yes | No | No | Yes | No | Sprint 2 |
| Insider transactions | Yes | No | No | No | No | Yes | No | Sprint 2 |
| News feed per ticker | No | Yes | No | No | Yes | Yes | No | Sprint 2 |
| Watchlist / alerts | Yes | Yes | No | No | Yes | Yes | No | Sprint 2 |
| Macro/economic indicators | No | Yes | No | Yes | Yes | Yes | No | Sprint 2–3 |
| Options chain | Yes | Yes | Yes | No | Yes | Yes | No | Roadmap |
| Sector heatmap | Yes | No | No | No | No | No | No | Roadmap |
| Congressional trades | No | No | No | No | No | No | Yes | Yes |
| Portfolio tracker | No | Yes | No | No | Yes | Yes | No | Roadmap |

---

## Free API Reference (validated this run)

| API | Endpoint used | Data confirmed | Rate limit |
|---|---|---|---|
| yahoo-finance2 (already integrated) | `quoteSummary()` modules: `calendarEvents`, `earningsTrend`, `financialData`, `recommendationTrend`, `defaultKeyStatistics`, `incomeStatementHistory`, `incomeStatementHistoryQuarterly` | Earnings dates, price targets, short interest, analyst ratings, income statements | Unofficial; no hard published limit; cache aggressively |
| yahoo-finance2 search | `search(ticker, { newsCount: 10 })` | News headlines, publisher, timestamp, link | Same as above |
| yahoo-finance2 options | `options(ticker)` | Full options chain per expiry | Same as above |
| SEC EDGAR submissions | `https://data.sec.gov/submissions/CIK{cik}.json` | Filing history (10-K, 10-Q, 8-K) with dates and accession numbers | ~10 req/sec, no key required |
| SEC EDGAR full-text search | `https://efts.sec.gov/LATEST/search-index?q={ticker}&forms=10-K,10-Q,8-K` | Recent filings by form type | ~10 req/sec, no key required |
| FRED (Federal Reserve) | `https://api.stlouisfed.org/fred/series/observations?series_id={id}&api_key={key}` | Fed Funds Rate, CPI, Unemployment, 10Y yield, GDP | 120 req/min, free key at fred.stlouisfed.org |
| Finnhub free tier | `https://finnhub.io/api/v1/stock/insider-transactions?symbol={ticker}&token={key}` | Form 4 insider transactions | 60 req/min, free key at finnhub.io |
| Alpha Vantage free tier | `https://www.alphavantage.co/query?function=EARNINGS&symbol={ticker}&apikey={key}` | Earnings history (EPS actuals vs estimates, surprise %) | 25 req/day on free tier — **too restrictive for production use; use yahoo-finance2 instead** |

---

*Report generated by Claude Code PM Research Agent on 2026-04-18. All competitor feature assessments based on public product research as of report date. Free API rate limits subject to change by providers.*
