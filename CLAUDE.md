# Stock Finder — Project Context

## Stack
- **Framework:** Next.js 14 App Router (TypeScript)
- **Data:** Yahoo Finance unofficial API via `yahoo-finance2`
- **Charts:** Recharts
- **Indicators:** `technicalindicators` (RSI, MACD, Bollinger Bands)
- **Styling:** Tailwind CSS + Lucide React icons
- **Congressional data:** House/Senate Stock Watcher S3 JSON (free, no key)

## Key Directories
```
app/                        # Next.js App Router pages + API routes
  page.tsx                  # Home screener
  stock/[ticker]/page.tsx   # Ticker detail page
  congress/page.tsx         # Congressional trades dashboard
  api/
    congressional-trades/   # House + Senate Stock Watcher enriched with YF prices
    prices/                 # Yahoo Finance live quotes (POST, sidebar cache)
    screener/               # Stock screener logic with fundamentals
    earnings/[ticker]/      # Earnings calendar + EPS history (6h cache)
    analyst/[ticker]/       # Analyst price targets + recommendation (4h cache)
lib/
  cache.ts                  # In-memory TTL cache (default 10 min, congress 5 min)
  rateLimit.ts              # Sliding-window rate limiter (20 req/min per IP) + daily budget
  types.ts                  # Shared interfaces (StockFundamentals, EarningsData, AnalystData, etc.)
  yahoo.ts                  # Yahoo Finance wrapper — getQuote, getHistoricalData, getQuoteSummary,
                            #   getEarnings, getAnalystData
.claude/
  agent/                    # Research agents (invoke with /agent)
    Announcement Research Agent/
    PM/
    Code Writer/            # Haiku — implements features from specs
    Code Reviewer/          # Haiku — reviews code quality, security, consistency
  commands/                 # Custom slash commands
```

## Ticker Detail Page — Widgets
| Widget | Data Source | Cache TTL |
|--------|-------------|-----------|
| Summary Cards (RSI, MACD, SMA, Vol) | `/api/stock/[ticker]` | 10 min |
| Analyst Ratings + Price Targets | `/api/analyst/[ticker]` | 4h |
| Charts (Volume, Price/MA, RSI, MACD) | `/api/stock/[ticker]` | 10 min |
| Key Statistics (fundamentals) | `/api/stock/[ticker]` | 10 min |
| Short Interest | `/api/stock/[ticker]` | 10 min |
| Earnings Calendar | `/api/earnings/[ticker]` | 6h |

## Architecture Decisions
- **Cache:** `cacheSet(key, value, ttlMs?)` — optional TTL override per call
- **Rate limit:** 20 req/min per IP on congressional-trades route
- **No paid APIs.** All data sources are free/keyless.
- **Nav dropdowns** use CSS `group-hover` — no JS state, works across all header states
- **Chart overlay toggles** (EMA20, SMA50, SMA200, BB) persisted to `localStorage`
- **Screener columns** (Company, P/E, Market Cap, Dividend) show/hide persisted to `localStorage`
- **QoQ growth metrics** sourced from `incomeStatementHistoryQuarterly` module (silently omitted if unavailable)

## Screener Filters
| Row | Filters |
|-----|---------|
| Technical | RSI, MACD, Moving Average, Volume |
| Fundamentals | P/E range, Market Cap tier, Dividend Yield, Revenue Growth |

## External Links in UI
| Link | URL |
|------|-----|
| Google Finance | `https://www.google.com/finance/quote/{ticker}:{exchange}` |
| Quiver Quant (per ticker) | `https://www.quiverquant.com/stock/{ticker}` |
| Capitol Trades | `https://www.capitoltrades.com/trades` |
| Quiver Congress | `https://www.quiverquant.com/congresstrading/` |
| Insider Trading | `https://www.quiverquant.com/insiders/` |
| Capitol Buzz | `https://www.capitoltrades.com/buzz` |
| Capitol Articles | `https://www.capitoltrades.com/articles` |

## Agents
Use `/agent` to list and invoke research agents stored in `.claude/agent/`.

| Agent | Purpose |
|-------|---------|
| `announcements` | Audit deps, check for breaking changes, ecosystem news |
| `pm` | Competitive analysis, feature prioritization, free API catalog |
| `code-writer` | Implement features (Haiku) — needs clear spec + acceptance criteria |
| `code-reviewer` | Review code quality, security, consistency (Haiku, read-only) |

## Commands
- `npm run dev` — start dev server
- `npm run build` — production build
- `npx tsc --noEmit` — type check
