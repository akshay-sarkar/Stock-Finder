# Dark Mode + Sticky Header Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a manual dark mode toggle (sun/moon, persisted to localStorage) to all three pages, plus make every page header sticky.

**Architecture:** Tailwind `darkMode: 'class'` — toggling the `dark` class on `<html>` activates all `dark:` variants. A shared `useDarkMode` hook manages the class and localStorage. Each page imports the hook and renders a toggle button in its header.

**Tech Stack:** Next.js 14, React, TypeScript, Tailwind CSS, Lucide React icons

---

## Files

| File | Action |
|------|--------|
| `tailwind.config.ts` | Modify — add `darkMode: 'class'` |
| `lib/useDarkMode.ts` | Create — dark mode hook |
| `app/layout.tsx` | Modify — `suppressHydrationWarning` on `<html>` |
| `app/globals.css` | Modify — `dark:` variants on badge classes |
| `app/page.tsx` | Modify — toggle button, sticky header, `dark:` classes |
| `app/stock/[ticker]/page.tsx` | Modify — toggle button, sticky header (3 instances), `dark:` classes |
| `app/congress/page.tsx` | Modify — toggle button, sticky header, `dark:` classes |

---

## Color Mapping Reference (use throughout Tasks 3–5)

| Light class | Add dark variant |
|---|---|
| `bg-gray-50` (body/page bg) | `dark:bg-gray-900` |
| `bg-white` (cards) | `dark:bg-gray-800` |
| `border-gray-200` | `dark:border-gray-700` |
| `text-gray-900` | `dark:text-gray-100` |
| `text-gray-700` | `dark:text-gray-300` |
| `text-gray-600` | `dark:text-gray-400` |
| `text-gray-500` | `dark:text-gray-400` |
| `text-gray-400` | `dark:text-gray-500` |
| `bg-gray-50` (table header rows) | `dark:bg-gray-700` |
| `hover:bg-gray-50` | `dark:hover:bg-gray-700/50` |
| `bg-white` (inputs/dropdowns) | `dark:bg-gray-700` |
| `border-gray-300` (inputs) | `dark:border-gray-600` |
| `placeholder-gray-400` | `dark:placeholder-gray-500` |
| `divide-gray-200` | `dark:divide-gray-700` |

Headers (`bg-slate-900`) are already dark — no changes needed.

---

## Task 1: Foundation — Tailwind config + useDarkMode hook + layout

**Files:**
- Modify: `tailwind.config.ts`
- Create: `lib/useDarkMode.ts`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Enable Tailwind class-based dark mode**

In `tailwind.config.ts`, add `darkMode: 'class'` as the first property of the config object:

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0f172a',
          800: '#1e293b',
          700: '#334155',
        },
      },
    },
  },
  plugins: [],
}

export default config
```

- [ ] **Step 2: Create the useDarkMode hook**

Create `lib/useDarkMode.ts` with this exact content:

```typescript
import { useEffect, useState } from 'react'

export function useDarkMode() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const enabled = localStorage.getItem('sf-dark-mode') === 'true'
    setDark(enabled)
    document.documentElement.classList.toggle('dark', enabled)
  }, [])

  function toggle() {
    setDark(prev => {
      const next = !prev
      localStorage.setItem('sf-dark-mode', String(next))
      document.documentElement.classList.toggle('dark', next)
      return next
    })
  }

  return { dark, toggle }
}
```

- [ ] **Step 3: Add suppressHydrationWarning to layout**

In `app/layout.tsx`, the `<html>` tag gains a `dark` class client-side before React hydration, which causes a console warning. Suppress it:

```tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Stock Finder — Free Technical Screener',
  description: 'Screen stocks by RSI, MACD, Moving Averages, and Volume. 100% free, powered by Yahoo Finance.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}
```

- [ ] **Step 4: Type-check**

```bash
cd "/Users/akshaysarkar/Documents/Claude/Projects/Stock Finder" && npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
cd "/Users/akshaysarkar/Documents/Claude/Projects/Stock Finder"
git add tailwind.config.ts lib/useDarkMode.ts app/layout.tsx
git commit -m "feat: add useDarkMode hook and enable Tailwind class dark mode"
```

---

## Task 2: Badge Dark Variants

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Add dark variants to all badge classes**

Replace the entire `@layer components` block in `app/globals.css` with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-gray-50 text-gray-900 antialiased;
  }
}

@layer components {
  .badge {
    @apply inline-flex items-center px-2 py-0.5 rounded text-xs font-medium;
  }
  .badge-green {
    @apply badge bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300;
  }
  .badge-red {
    @apply badge bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300;
  }
  .badge-yellow {
    @apply badge bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300;
  }
  .badge-blue {
    @apply badge bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300;
  }
  .badge-gray {
    @apply badge bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300;
  }
}
```

- [ ] **Step 2: Type-check**

```bash
cd "/Users/akshaysarkar/Documents/Claude/Projects/Stock Finder" && npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd "/Users/akshaysarkar/Documents/Claude/Projects/Stock Finder"
git add app/globals.css
git commit -m "feat: add dark mode variants to badge CSS classes"
```

---

## Task 3: Home Screener Page — Dark Mode + Sticky Header

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Import useDarkMode and Sun/Moon icons**

Read `app/page.tsx`. At the top, the lucide-react import looks like:
```tsx
import {
  Search, TrendingUp, RotateCcw, ChevronUp, ChevronDown,
  Settings, ChevronRight, Plus, Download, Upload, X, Check, ListFilter, ExternalLink,
} from 'lucide-react'
```

Add `Sun, Moon` to it:
```tsx
import {
  Search, TrendingUp, RotateCcw, ChevronUp, ChevronDown,
  Settings, ChevronRight, Plus, Download, Upload, X, Check, ListFilter, ExternalLink,
  Sun, Moon,
} from 'lucide-react'
```

Also add the hook import after the existing imports:
```tsx
import { useDarkMode } from '@/lib/useDarkMode'
```

- [ ] **Step 2: Add useDarkMode to the component**

Inside the main page component function body, add near the top with other state declarations:
```tsx
const { dark, toggle } = useDarkMode()
```

- [ ] **Step 3: Add sticky + dark bg to header**

Find the header element (currently `<header className="bg-slate-900 text-white shadow-lg">`).

Change it to:
```tsx
<header className="bg-slate-900 text-white shadow-lg sticky top-0 z-50">
```

- [ ] **Step 4: Add dark mode toggle button to header**

Inside the header, find the right end of the header controls row (near the nav links / other buttons). Add the toggle button immediately before the closing `</header>` tag's inner container closes — look for a `flex items-center gap-*` row at the top right. Add:

```tsx
<button
  onClick={toggle}
  className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
  aria-label="Toggle dark mode"
>
  {dark ? <Sun size={16} /> : <Moon size={16} />}
</button>
```

- [ ] **Step 5: Add dark variants to body/page wrapper**

Find the outermost `<div>` wrapping the page content (the one with `min-h-screen` or similar). Add `dark:bg-gray-900 dark:text-gray-100` to it.

Also update `<body>` base styles indirectly — find the `<main>` or content wrapper and apply dark variants using the color mapping reference above:

- All `bg-white` → add `dark:bg-gray-800`
- All `border-gray-200` → add `dark:border-gray-700`
- All `text-gray-900` → add `dark:text-gray-100`
- All `text-gray-700` → add `dark:text-gray-300`
- All `text-gray-500` → add `dark:text-gray-400`
- All `bg-gray-50` (non-header) → add `dark:bg-gray-900` (page bg) or `dark:bg-gray-700` (table headers)
- All `hover:bg-gray-50` → add `dark:hover:bg-gray-700/50`
- All `border-gray-300` on inputs → add `dark:border-gray-600 dark:bg-gray-700`
- All `placeholder-gray-*` → add `dark:placeholder-gray-500`

- [ ] **Step 6: Type-check**

```bash
cd "/Users/akshaysarkar/Documents/Claude/Projects/Stock Finder" && npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
cd "/Users/akshaysarkar/Documents/Claude/Projects/Stock Finder"
git add "app/page.tsx"
git commit -m "feat: dark mode + sticky header on home screener page"
```

---

## Task 4: Stock Detail Page — Dark Mode + Sticky Header

**Files:**
- Modify: `app/stock/[ticker]/page.tsx`

- [ ] **Step 1: Import useDarkMode and Sun/Moon icons**

Read `app/stock/[ticker]/page.tsx`. Find the lucide-react import. Add `Sun, Moon` to it.

Add the hook import:
```tsx
import { useDarkMode } from '@/lib/useDarkMode'
```

- [ ] **Step 2: Add useDarkMode to StockPage component**

Inside the `StockPage` function, add near the top with other state:
```tsx
const { dark, toggle } = useDarkMode()
```

- [ ] **Step 3: Add sticky to all three header instances**

The stock detail page has three `<header className="bg-slate-900 text-white shadow-lg">` instances (loading state ~line 951, error state ~line 1017, main state ~line 1086). Add `sticky top-0 z-50` to all three:

```tsx
<header className="bg-slate-900 text-white shadow-lg sticky top-0 z-50">
```

- [ ] **Step 4: Add dark mode toggle button to the main header**

In the main header (the one inside the fully loaded state, ~line 1086), find the right side of the top nav row — there's a row with the ticker symbol, Google Finance link, and other controls. Add the toggle button at the end of that row:

```tsx
<button
  onClick={toggle}
  className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
  aria-label="Toggle dark mode"
>
  {dark ? <Sun size={16} /> : <Moon size={16} />}
</button>
```

Also add the toggle button to the loading and error state headers so it's always accessible.

- [ ] **Step 5: Add dark variants to page wrapper and sidebar**

Find the outermost wrapper div (has `flex` with sidebar + main). Apply:
- Wrapper: add `dark:bg-gray-900`
- Sidebar (the left panel with ticker list): `bg-white` → add `dark:bg-gray-800`, `border-gray-200` → add `dark:border-gray-700`
- Sidebar search input: add `dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-500`
- Sidebar ticker rows: `hover:bg-gray-50` → add `dark:hover:bg-gray-700/50`, text colors per the mapping table

- [ ] **Step 6: Add dark variants to main content cards**

In `<main>`, apply dark variants using the color mapping reference:

- All `bg-white rounded-xl` cards → add `dark:bg-gray-800`
- All `border-gray-200` → add `dark:border-gray-700`
- All `text-gray-900` / `text-gray-700` / `text-gray-600` / `text-gray-500` / `text-gray-400` → corresponding dark variants
- Summary stat cards (bg-white): add `dark:bg-gray-800`
- Range selector buttons: `bg-white` or `bg-gray-100` backgrounds → add `dark:bg-gray-700`
- Active range button: check current active style, add appropriate dark variant
- Table rows in FinancialsWidget/EarningsWidget: `bg-gray-50` header rows → `dark:bg-gray-700`, `hover:bg-gray-50` → `dark:hover:bg-gray-700/50`, `border-gray-200` dividers → `dark:border-gray-700`
- Key statistics grid: text colors per mapping table
- Chart containers: the chart wrappers are `bg-white` cards — covered by card rule
- Overlay toggle buttons (BB, EMA20 etc): check current style, add dark variants

- [ ] **Step 7: Type-check**

```bash
cd "/Users/akshaysarkar/Documents/Claude/Projects/Stock Finder" && npx tsc --noEmit
```
Expected: no errors. Fix any type errors before committing.

- [ ] **Step 8: Commit**

```bash
cd "/Users/akshaysarkar/Documents/Claude/Projects/Stock Finder"
git add "app/stock/[ticker]/page.tsx"
git commit -m "feat: dark mode + sticky header on stock detail page"
```

---

## Task 5: Congress Page — Dark Mode + Sticky Header

**Files:**
- Modify: `app/congress/page.tsx`

- [ ] **Step 1: Import useDarkMode and Sun/Moon icons**

Read `app/congress/page.tsx`. Find the lucide-react import. Add `Sun, Moon` to it.

Add the hook import:
```tsx
import { useDarkMode } from '@/lib/useDarkMode'
```

- [ ] **Step 2: Add useDarkMode to component**

Inside the main page component function, add:
```tsx
const { dark, toggle } = useDarkMode()
```

- [ ] **Step 3: Add sticky to header**

Find `<header className="bg-slate-900 text-white shadow-lg">` (line ~158). Change to:
```tsx
<header className="bg-slate-900 text-white shadow-lg sticky top-0 z-50">
```

- [ ] **Step 4: Add dark mode toggle button to header**

Inside the header, at the end of the top controls row, add:
```tsx
<button
  onClick={toggle}
  className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
  aria-label="Toggle dark mode"
>
  {dark ? <Sun size={16} /> : <Moon size={16} />}
</button>
```

- [ ] **Step 5: Add dark variants to page content**

Apply the color mapping reference throughout `app/congress/page.tsx`:
- Page wrapper / `min-h-screen` div: add `dark:bg-gray-900`
- Card/table containers (`bg-white`): add `dark:bg-gray-800`
- All `border-gray-200` → add `dark:border-gray-700`
- All text color classes → corresponding dark variants from the mapping table
- Table header row (`bg-gray-50`): add `dark:bg-gray-700`
- Table body rows `hover:bg-gray-50`: add `dark:hover:bg-gray-700/50`
- Filter inputs/selects: add `dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100`
- Pagination buttons: `bg-white border-gray-300` → add `dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300`
- `divide-gray-200` → add `dark:divide-gray-700`

- [ ] **Step 6: Type-check**

```bash
cd "/Users/akshaysarkar/Documents/Claude/Projects/Stock Finder" && npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
cd "/Users/akshaysarkar/Documents/Claude/Projects/Stock Finder"
git add "app/congress/page.tsx"
git commit -m "feat: dark mode + sticky header on congress page"
```

---

## Final Verification Checklist

- [ ] Toggle button (moon/sun) visible in header on all three pages
- [ ] Clicking toggle switches between light and dark
- [ ] Dark mode persists on page refresh (localStorage `sf-dark-mode`)
- [ ] All card backgrounds go dark (`bg-gray-800`)
- [ ] Text remains readable in both modes
- [ ] Badges render with dark variants in dark mode
- [ ] Header is sticky — scrolling down keeps it visible on all pages
- [ ] No React hydration warnings in browser console
- [ ] `npx tsc --noEmit` passes with zero errors
