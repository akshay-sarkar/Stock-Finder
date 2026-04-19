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
    prices/                 # Yahoo Finance live quotes
    screener/               # Stock screener logic
lib/
  cache.ts                  # In-memory TTL cache (default 10 min, congress 5 min)
  rateLimit.ts              # Sliding-window rate limiter (20 req/min per IP) + daily budget
  types.ts                  # Shared interfaces (CongressionalTrade, etc.)
.claude/
  agent/                    # Research agents (invoke with /agent)
  commands/                 # Custom slash commands
```

## Architecture Decisions
- **Cache:** `cacheSet(key, value, ttlMs?)` — optional TTL override per call
- **Rate limit:** 20 req/min per IP on congressional-trades route
- **No paid APIs.** All data sources are free/keyless.
- **Nav dropdowns** use CSS `group-hover` — no JS state, works across all header states

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
| Announcement Research | Audit deps, check for breaking changes, ecosystem news |
| PM Feature Research | Competitive analysis, feature prioritization, free API catalog |

## Commands
- `npm run dev` — start dev server
- `npm run build` — production build
- `npx tsc --noEmit` — type check
