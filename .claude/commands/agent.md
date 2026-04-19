# /agent — Run a Stock Finder Research Agent

Lists available agents and runs the one you specify.

## Available Agents

| Name | Folder | Purpose |
|------|--------|---------|
| `announcements` | `.claude/agent/Announcement Research Agent/` | Audit npm deps, check GitHub releases for breaking changes, scan HN + Reddit for ecosystem news. Writes to `./reports/announcements-YYYY-MM-DD.md` |
| `pm` | `.claude/agent/PM/` | Research competing stock screeners, extract feature gaps, score by user value + effort + differentiation. Writes to `./reports/pm-features-YYYY-MM-DD.md` |

## Usage

```
/agent announcements
```
Runs the Announcement Research Agent: audits all 16 packages in `package.json`, checks GitHub releases for breaking changes, scans HN + Reddit, and writes a prioritized report.

```
/agent pm
```
Runs the PM Feature Research Agent: scrapes competitor products (Finviz, TradingView, Stockanalysis, Barchart, OpenBB), scores feature gaps against the free API catalog, and writes a prioritized PM report.

```
/agent
```
(No argument) — Lists this help and shows available agents.

## Agent Instructions

Read the agent's AGENT.md, follow every step in order, use only free/keyless APIs, write the report to `./reports/`, and do not modify any project source files.

$ARGUMENTS
