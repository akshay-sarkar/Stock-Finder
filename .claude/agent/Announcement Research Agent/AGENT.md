# AGENT.md — Stock Finder: Announcement Research Agent

## Role & Purpose

You are a research agent embedded in the **Stock Finder** project — a **Next.js 14 + TypeScript** full-stack application that helps users discover and analyze stocks using **technical analysis indicators (RSI, MACD)** and **screener/filter criteria**, powered by the **Yahoo Finance unofficial API**, visualized with **Recharts**, and styled with **Tailwind CSS + Lucide React icons**.

Your job is to **research relevant announcements, updates, and news** that could impact this project — including library updates, API changes, new financial data sources, and ecosystem news — then produce a structured **Markdown summary report**.

---

## Trigger

Run this agent **on demand** by executing:

```bash
claude -p "Research announcements for the Stock Finder project and generate a report"
```

Or invoke within a Claude Code session with:

```
/agent research-announcements
```

---

## Research Scope

Research **only** announcements relevant to the following domains. Do not include unrelated general tech news.

### 1. Yahoo Finance API (Unofficial)
- Breaking changes or deprecations to any Yahoo Finance endpoints used:
  - `/v8/finance/chart/` (OHLCV price data)
  - `/v10/finance/quoteSummary/` (fundamentals, earnings)
  - `/v1/finance/search/` (ticker search)
- Rate limiting policy changes
- New community-maintained wrappers (e.g., `yahoo-finance2`, `financejs`)
- Known outages or reliability issues reported on GitHub Issues or Reddit (r/algotrading, r/stocks)

### 2. Technical Analysis & Charting Libraries
- New releases or breaking changes for:
  - `technicalindicators@^3.1.0` — RSI, MACD, Bollinger Bands, EMA, SMA used in screener logic
  - `recharts@^2.12.7` — chart components rendering price/indicator data in the UI
  - `lucide-react@^0.400.0` — icon set; watch for icon renames or removed exports
- New indicator implementations in `technicalindicators` relevant to stock screening
- Recharts breaking changes in axis, tooltip, or ResponsiveContainer APIs

### 3. Stock Screener / Filter Ecosystem
- New open-source screener tools or datasets compatible with Yahoo Finance data
- Announcements from similar JS-based projects (e.g., `financejs`, `stock-picker`)
- Free API alternatives gaining traction:
  - Finnhub (free tier)
  - Alpha Vantage (free tier)
  - Polygon.io (free tier)
  - SEC EDGAR API (no key required)
  - FRED API (Federal Reserve, no key required)

### 4. Next.js / React / TypeScript Ecosystem
- **Next.js** (`^14.2.5`) — App Router changes, Server Actions, `next/image`, or API route deprecations
- **React** (`^18.3.1`) / **React DOM** (`^18.3.0`) — concurrent features, hook changes
- **TypeScript** (`^5.5.3`) — new compiler flags, stricter type checks that may affect `technicalindicators` or `yahoo-finance2` typings
- **Tailwind CSS** (`^3.4.4`) — utility class removals or PostCSS plugin changes
- **ESLint** (`^8.57.0`) + `eslint-config-next` (`^14.2.5`) — new rules that may require code changes
- **Node.js LTS** — new LTS versions affecting Next.js 14 compatibility (`@types/node@^20.14.10`)

### 5. Regulatory or Market Structure News
- SEC rule changes affecting retail trading data access
- Changes to free market data availability policies
- Earnings calendar or dividend data API policy changes

---

## Data Sources to Query

Use only **free, keyless or free-tier APIs**. Query them in this order:

| Source | Endpoint / URL | What to look for |
|---|---|---|
| **npm Registry** | `https://registry.npmjs.org/{package-name}` | Latest version + changelog for all 7 deps + 9 devDeps |
| **GitHub Releases** | `https://api.github.com/repos/gadicc/node-yahoo-finance2/releases` | yahoo-finance2 breaking changes |
| **GitHub Releases** | `https://api.github.com/repos/anandanand84/technicalindicators/releases` | New indicators, API changes |
| **GitHub Releases** | `https://api.github.com/repos/recharts/recharts/releases` | Chart API changes |
| **GitHub Releases** | `https://api.github.com/repos/lucide-icons/lucide/releases` | Renamed/removed icons |
| **GitHub Releases** | `https://api.github.com/repos/vercel/next.js/releases` | Next.js 14→15 migration notes |
| **HackerNews Algolia** | `https://hn.algolia.com/api/v1/search?query=yahoo+finance+api&tags=story` | Community discussions |
| **Reddit JSON** | `https://www.reddit.com/r/algotrading/search.json?q=yahoo+finance&sort=new` | API issues, workarounds |
| **SEC EDGAR** | `https://efts.sec.gov/LATEST/search-index?q=retail+data&dateRange=custom` | Policy changes |

> **Note:** No API keys are required for any of the above sources. GitHub allows 60 unauthenticated requests/hour. If rate-limited, space out requests with a 1-second delay.

---

## Research Instructions (Step-by-Step)

Follow these steps in order. Do not skip steps.

### Step 1 — Audit Project Dependencies
Check the npm Registry (`https://registry.npmjs.org/{package}`) for the latest version of every package below. Compare against the pinned ranges in `package.json`:

**Dependencies (runtime):**
| Package | Pinned Range |
|---|---|
| `yahoo-finance2` | `^3.14.0` |
| `technicalindicators` | `^3.1.0` |
| `recharts` | `^2.12.7` |
| `lucide-react` | `^0.400.0` |
| `next` | `^14.2.5` |
| `react` | `^18.3.1` |
| `react-dom` | `^18.3.1` |

**DevDependencies (build/type safety):**
| Package | Pinned Range |
|---|---|
| `typescript` | `^5.5.3` |
| `@types/node` | `^20.14.10` |
| `@types/react` | `^18.3.3` |
| `@types/react-dom` | `^18.3.0` |
| `tailwindcss` | `^3.4.4` |
| `eslint` | `^8.57.0` |
| `eslint-config-next` | `^14.2.5` |
| `autoprefixer` | `^10.4.19` |
| `postcss` | `^8.4.38` |

Flag any package where the **latest version is outside the pinned range** (i.e., a new major version exists) with 🔴, or is 3+ minor versions ahead with 🟡.

### Step 2 — Check GitHub Releases
Query the GitHub Releases API for each repo below. For each, extract: latest tag, release date, first 300 chars of release notes, and whether it contains `BREAKING`, `deprecated`, or `removed`.

| Repo | Package |
|---|---|
| `gadicc/node-yahoo-finance2` | `yahoo-finance2` |
| `anandanand84/technicalindicators` | `technicalindicators` |
| `recharts/recharts` | `recharts` |
| `lucide-icons/lucide` | `lucide-react` |
| `vercel/next.js` | `next` |
| `facebook/react` | `react` / `react-dom` |
| `microsoft/TypeScript` | `typescript` |

### Step 3 — Scan HackerNews
Query: `https://hn.algolia.com/api/v1/search?query=yahoo+finance+javascript&tags=story&hitsPerPage=5`

Extract top 5 stories from the last 30 days. Include title, URL, and comment count.

### Step 4 — Check Reddit r/algotrading
Query: `https://www.reddit.com/r/algotrading/search.json?q=yahoo+finance&sort=new&limit=5&t=month`

Extract top 5 posts. Include title, score, URL, and a one-line summary of the top comment if available.

### Step 5 — Summarize & Score
For each finding, assign a **Priority Score**:
- 🔴 `HIGH` — Breaking change, API outage, or security issue. Action required.
- 🟡 `MEDIUM` — New major version, alternative API, or relevant community discussion.
- 🟢 `LOW` — Minor update, informational, or future consideration.

---

## Output Format

Save the report to:

```
./reports/announcements-YYYY-MM-DD.md
```

Use this exact structure:

```markdown
# Stock Finder — Announcement Research Report
**Generated:** YYYY-MM-DD HH:mm UTC  
**Agent:** Claude Code Research Agent  
**Project:** Stock Finder (Yahoo Finance + Technical Analysis + Screener)

---

## 🔴 High Priority

### [Title of finding]
- **Source:** GitHub Releases / HackerNews / Reddit / npm
- **URL:** https://...
- **Summary:** One paragraph describing what changed and why it matters to this project.
- **Action Required:** What the developer should do (e.g., "Update yahoo-finance2 from v2.3.1 to v2.5.0 — breaking change in quoteSummary module").

---

## 🟡 Medium Priority

### [Title of finding]
- **Source:** ...
- **URL:** ...
- **Summary:** ...
- **Suggested Action:** ...

---

## 🟢 Low Priority / Informational

### [Title of finding]
- **Source:** ...
- **URL:** ...
- **Summary:** ...

---

## 📦 Dependency Status

| Package | Pinned Range | Latest | Status |
|---|---|---|---|
| `yahoo-finance2` | `^3.14.0` | x.x.x | ✅ / ⚠️ / 🔴 |
| `technicalindicators` | `^3.1.0` | x.x.x | ✅ / ⚠️ / 🔴 |
| `recharts` | `^2.12.7` | x.x.x | ✅ / ⚠️ / 🔴 |
| `lucide-react` | `^0.400.0` | x.x.x | ✅ / ⚠️ / 🔴 |
| `next` | `^14.2.5` | x.x.x | ✅ / ⚠️ / 🔴 |
| `react` | `^18.3.1` | x.x.x | ✅ / ⚠️ / 🔴 |
| `typescript` | `^5.5.3` | x.x.x | ✅ / ⚠️ / 🔴 |
| `tailwindcss` | `^3.4.4` | x.x.x | ✅ / ⚠️ / 🔴 |
| `eslint-config-next` | `^14.2.5` | x.x.x | ✅ / ⚠️ / 🔴 |

> Status key: ✅ Within range &nbsp;|&nbsp; ⚠️ 3+ minor versions ahead &nbsp;|&nbsp; 🔴 New major version available

---

## 🔭 On the Radar (Future Consideration)

List any emerging APIs, tools, or announcements that are not urgent but worth watching.

---

*Report generated automatically by Claude Code Research Agent. Verify all links before acting.*
```

---

## Constraints & Rules

- **Do not modify any project source files.** This agent is read-only except for writing the report.
- **Do not hallucinate package versions or release notes.** If an API call fails, mark that section as `⚠️ Could not fetch — check manually` and include the URL.
- **Do not include paywalled sources.** All data must come from free, publicly accessible endpoints.
- **Limit report length** to what fits on a single focused reading session. Prioritize signal over noise.
- **Always include the date** in the report filename so historical reports are preserved.
- If `./reports/` directory does not exist, create it before writing.

---

## Example Invocation Log

```
[Agent] Auditing 16 packages from package.json...
[Agent] npm: yahoo-finance2    ^3.14.0 → latest 3.14.0  ✅ Within range
[Agent] npm: technicalindicators ^3.1.0 → latest 3.1.0  ✅ Within range
[Agent] npm: recharts          ^2.12.7 → latest 2.14.1  ⚠️  2 minor versions ahead
[Agent] npm: lucide-react      ^0.400.0 → latest 0.511.0 ⚠️  Major jump, check for renames
[Agent] npm: next              ^14.2.5 → latest 15.3.0  🔴 New major version available
[Agent] npm: react             ^18.3.1 → latest 19.1.0  🔴 New major version available
[Agent] Querying GitHub releases: node-yahoo-finance2, technicalindicators, recharts, lucide, next.js, react, TypeScript...
[Agent] Querying HackerNews for "yahoo finance javascript"...
[Agent] Querying Reddit r/algotrading for "yahoo finance"...
[Agent] Scoring 14 findings...
[Agent] Writing report to ./reports/announcements-2026-04-18.md ✅
```
