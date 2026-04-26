


# 📈 Stock Finder

A free, open-source technical analysis screener built with **Next.js 14**, **Yahoo Finance** (no API key required), and **Recharts**. Scan your entire watchlist, filter by RSI / MACD / Moving Averages / Volume, and drill into full interactive charts — all at zero cost.

**Live demo:** [stock-finder-mu.vercel.app](https://stock-finder-mu.vercel.app) 

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwindcss)
![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)
![License](https://img.shields.io/badge/License-MIT-green)

<img width="1282" height="979" alt="Screenshot 2026-04-14 at 12 56 14 PM" src="https://github.com/user-attachments/assets/be9c3516-4792-4035-912e-817e4ca7e8aa" />
<img width="1690" height="1198" alt="Screenshot 2026-04-14 at 12 56 31 PM" src="https://github.com/user-attachments/assets/2490cad7-90a4-4bd4-8570-478c660bfa4f" />

---

## ✨ Features

### Screener (Home Page)
- **150-ticker default watchlist** across 15+ sectors — Tech, Finance, Healthcare, Energy, ETFs, International ADRs and more
- **Technical filters** — RSI (oversold/overbought/neutral), MACD crossovers, Moving Average position, Volume spikes
- **6 Moving Average sub-filters** — Price vs SMA50, Price vs SMA200, Golden Cross, Death Cross
- **Fundamental filters** — P/E range, Market Cap tier, Dividend Yield range, Revenue Growth range
- **Batched scanning** — splits large watchlists into batches of 50, results trickle in with a live progress bar
- **Sortable results table** — click any column header (Price, Chg%, RSI, Vol Ratio, P/E, Market Cap, Dividend Yield)
- **Hideable columns** — Company Name, P/E, Market Cap, Dividend Yield toggles persisted in `localStorage`
- **Pagination** — 20 results per page with compact page navigation
- **Signal Glossary** — collapsible section explaining every signal badge in plain English
- **Session state** — filters, results, sort, and page are restored when navigating back from a stock page

### Watchlist Management
- **Add / Remove** individual tickers with search-by-name or ticker symbol
- **Import** — paste comma/space/newline-separated tickers, or upload a `.txt` / `.csv` file
- **Export** — copy to clipboard or download as `watchlist.txt`
- **Reset to defaults** — one click restores the 150-ticker default list
- Watchlist persisted in `localStorage` across sessions

### Stock Detail Page (`/stock/[TICKER]`)
- **Fixed sidebar watchlist** — jump between any ticker without going back to the screener; shows company name + live price change % for all items
- **6 date ranges** — 1M, 3M, 6M, 1Y, 2Y, 5Y (5Y auto-switches to weekly candles)
- **4 full-width charts:**
  - Volume with SMA(20) dotted reference line
  - Price + configurable overlays: EMA(20), SMA(50), SMA(200), Bollinger Bands (20, ±2σ)
  - RSI(14) with overbought/oversold reference lines
  - MACD (12, 26, 9) with histogram
- **Chart overlay toggles** — EMA20, SMA50, SMA200, BB can be individually shown/hidden (persisted in `localStorage`)
- **Hover tooltips on legend labels** — hover any legend item for a plain-English description
- **Summary cards** — RSI, MACD Histogram, SMA50/200, Volume Ratio at a glance
- **Analyst Ratings widget** — consensus recommendation gauge (Strong Buy → Sell), 12-month price targets (low/mean/high), upside % to mean target, analyst count
- **Key Statistics panel** — Valuation, Earnings & Dividends, Risk & Range, Financials with **YoY / QoQ toggle** for growth metrics
- **Short Interest widget** — Short Float %, Short Ratio, Shares Short; ⚠ badge for >20% float
- **Earnings Calendar widget** — next report date with countdown, EPS estimate range, 4-quarter beat/miss history table
- **Quick stats in header** — P/E, 52W range, Dividend Yield, Last Updated time
- **External links** — Google Finance, Quiver Quant, Congress Trades dropdown, Insider Trading, News dropdown

### Performance
- **10-minute server-side cache** — per-ticker data cached in memory; repeat scans are near-instant
- **Analyst and earnings data cached separately** — 4h and 6h TTL respectively (data changes infrequently)
- **Zero external API cost** — uses `yahoo-finance2` with no API key or rate-limit tier

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 14](https://nextjs.org) (App Router) |
| Language | TypeScript (strict mode) |
| Styling | [Tailwind CSS v3](https://tailwindcss.com) |
| Charts | [Recharts](https://recharts.org) |
| Market Data | [yahoo-finance2 v3](https://github.com/gadicc/node-yahoo-finance2) |
| Indicators | [technicalindicators](https://github.com/anandanand84/technicalindicators) |
| Deployment | [Vercel Hobby (free tier)](https://vercel.com) |
| Icons | [Lucide React](https://lucide.dev) |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm / yarn / pnpm

### Installation

```bash
# 1. Clone the repo
git clone https://github.com/your-username/stock-finder.git
cd stock-finder

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> **No `.env` file needed.** Yahoo Finance is accessed without an API key.

### Build for Production

```bash
npm run build
npm start
```

---

## 📁 Project Structure

```
stock-finder/
├── app/
│   ├── page.tsx                        # Screener (home) — filters, results table, watchlist modal
│   ├── layout.tsx                      # Root layout + global styles
│   ├── globals.css                     # Tailwind base + badge utility classes
│   ├── stock/
│   │   └── [ticker]/
│   │       └── page.tsx                # Stock detail — charts, widgets, sidebar watchlist
│   └── api/
│       ├── screener/route.ts           # POST /api/screener — batch scan with fundamentals
│       ├── stock/[ticker]/route.ts     # GET /api/stock/:ticker — chart data + indicators + fundamentals
│       ├── prices/route.ts             # POST /api/prices — sidebar price change (cache-only)
│       ├── earnings/[ticker]/route.ts  # GET /api/earnings/:ticker — next date, EPS, history (6h)
│       └── analyst/[ticker]/route.ts   # GET /api/analyst/:ticker — targets, recommendation (4h)
├── lib/
│   ├── cache.ts                        # In-memory TTL cache (default 10 min)
│   ├── indicators.ts                   # RSI, MACD, SMA, EMA, BB signal generation
│   ├── rateLimit.ts                    # Sliding-window rate limiter (20 req/min per IP)
│   ├── screener.ts                     # buildScreenerRow(), applyFilters(), FilterCriteria
│   ├── stockList.ts                    # DEFAULT_TICKERS (150), COMPANY_NAMES, SECTOR_MAP
│   ├── types.ts                        # Shared TypeScript interfaces
│   ├── validation.ts                   # isValidTicker() — server-side input guard
│   └── yahoo.ts                        # yahoo-finance2 wrapper — historical, quote, fundamentals,
│                                       #   getEarnings(), getAnalystData()
├── next.config.js
├── tailwind.config.ts
└── package.json
```

---

## 🧮 Indicators Reference

| Indicator | Parameters | What it measures |
|-----------|-----------|-----------------|
| **RSI** | 14 periods | Momentum — below 30 = oversold, above 70 = overbought |
| **MACD** | 12 / 26 / 9 | Trend momentum — crossovers signal direction shifts |
| **EMA** | 20 periods | Short-term trend, reacts faster than SMA |
| **SMA** | 20 / 50 / 200 periods | Medium and long-term trend |
| **Bollinger Bands** | 20 periods, ±2σ | Volatility envelope — price at band edges signals breakout or reversal |
| **Vol SMA** | 20 periods | Average volume baseline for spike detection |

### Signal Badges

| Badge | Meaning |
|-------|---------|
| 🟢 Oversold | RSI < 30 — potential bounce |
| 🔴 Overbought | RSI > 70 — potential pullback |
| 🟢 MACD Bull Cross | Histogram flipped positive — fresh bullish momentum |
| 🔴 MACD Bear Cross | Histogram flipped negative — fresh bearish momentum |
| 🟢 Golden Cross Zone | SMA50 > SMA200 — long-term uptrend |
| 🔴 Death Cross Zone | SMA50 < SMA200 — long-term downtrend |
| 🟢 Above SMA50 | Price above medium-term average |
| 🔴 Below SMA50 | Price below medium-term average |
| 🟢 Vol Spike | Volume > 2× 20-day average |
| ⚪ Low Volume | Volume < 50% of 20-day average |

---

## ☁️ Deploying to Vercel

The easiest way to deploy is with the [Vercel CLI](https://vercel.com/docs/cli) or by connecting your GitHub repo directly.

### Option A — GitHub Integration (recommended)

1. Push this repo to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import the repository
4. Leave all settings as default — Vercel auto-detects Next.js
5. Click **Deploy**

### Option B — CLI

```bash
npm i -g vercel
vercel
```

### Vercel Hobby Plan Limits

| Resource | Limit |
|----------|-------|
| Serverless function duration | 60 seconds |
| Requests / month | 100,000 |
| Bandwidth | 100 GB |
| Functions | Unlimited |

The screener API uses `maxDuration = 60` to stay within the free tier. With the 10-minute cache active, most requests complete in under 1 second after the first warm scan.

---

## ⚙️ Configuration

### Customising the Default Watchlist

Edit `lib/stockList.ts`:

```typescript
export const DEFAULT_TICKERS = [
  'AAPL', 'MSFT', 'GOOGL',
  // Add or remove tickers here
]

export const COMPANY_NAMES: Record<string, string> = {
  AAPL: 'Apple',
  // Add matching company names
}
```

### Cache TTL

Edit `lib/cache.ts`:

```typescript
const TTL_MS = 10 * 60 * 1000 // 10 minutes — change as needed
```

### Scan Batch Size

Edit `app/page.tsx`:

```typescript
const SCAN_BATCH = 50 // tickers per API call — keep ≤ 50 for Vercel free tier
```

---

## 🔒 Security Notes

- All ticker inputs are validated against `/^[A-Z0-9.\-]{1,8}$/` server-side
- No user data is stored — watchlist lives in the browser's `localStorage`
- No authentication required — this is a read-only public tool
- Yahoo Finance data is fetched server-side; browser never talks to Yahoo directly
- See [SECURITY.md](SECURITY.md) for the full hardening plan

---

## 🤝 Contributing

Contributions are welcome! Here are some ideas for improvements:

- [ ] Candlestick / OHLC chart view
- [ ] 52-week high/low visual range bar
- [ ] Historical Financials table (quarterly revenue/earnings trend)
- [ ] Insider Transactions feed
- [ ] Export screener results to CSV
- [ ] Dark mode
- [ ] Price alerts (browser notifications)
- [ ] Mobile-optimised sidebar
- [ ] News feed integration

### Development Workflow

```bash
# Run in dev mode with hot reload
npm run dev

# Type-check
npm run build

# Lint
npm run lint
```

Please open an issue before submitting a large PR so we can discuss the approach.

---

## ⚠️ Disclaimer

> This tool is for **educational and informational purposes only**. It is not financial advice. Do not make investment decisions based solely on the signals or data shown here. Always do your own research and consult a licensed financial advisor.
>
> Market data is provided by Yahoo Finance. Accuracy is not guaranteed. Past technical signals do not predict future performance.

---

## 📄 License

MIT © 2025 — free to use, modify, and distribute.

---

<div align="center">
  <sub>Built with ❤️ using Next.js · Yahoo Finance · Recharts · Tailwind CSS</sub>
</div>
