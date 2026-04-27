# Design Spec: Dark Mode + Sticky Header
**Date:** 2026-04-26
**Status:** Approved
**Scope:** Manual dark mode toggle (localStorage, `dark` class on `<html>`) + sticky header on all three pages.

---

## Overview

Two independent improvements shipped together:
1. **Dark Mode** — Tailwind `class`-based, manual sun/moon toggle in every page header, persisted to `localStorage`
2. **Sticky Header** — `sticky top-0 z-50` on `<header>` in all three pages

---

## Dark Mode — Implementation Strategy

### Tailwind config
Add `darkMode: 'class'` to `tailwind.config.ts`. No other config changes.

### Hook: `lib/useDarkMode.ts` (NEW)
```typescript
import { useEffect, useState } from 'react'

export function useDarkMode() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('sf-dark-mode')
    const enabled = stored === 'true'
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

- localStorage key: `sf-dark-mode` (`'true'` / `'false'`)
- Defaults to light mode if key is absent
- Toggles `dark` class on `document.documentElement`

### Toggle Button
Each page imports `useDarkMode` and renders a button in the header:
```tsx
const { dark, toggle } = useDarkMode()
// ...
<button onClick={toggle} className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors" aria-label="Toggle dark mode">
  {dark ? <Sun size={16} /> : <Moon size={16} />}
</button>
```
- Import `Sun` and `Moon` from `lucide-react` (already a dep)
- Place in each page's header, right of existing controls

### `app/layout.tsx`
Add `suppressHydrationWarning` to `<html>` to prevent React hydration mismatch (the `dark` class is added client-side before hydration completes):
```tsx
<html lang="en" suppressHydrationWarning>
```

---

## Color Palette — Dark Mode Variants

| Element | Light | Dark |
|---|---|---|
| Body background | `bg-gray-50` | `dark:bg-gray-900` |
| Card background | `bg-white` | `dark:bg-gray-800` |
| Card border | `border-gray-200` | `dark:border-gray-700` |
| Primary text | `text-gray-900` | `dark:text-gray-100` |
| Secondary text | `text-gray-700` | `dark:text-gray-300` |
| Muted text | `text-gray-500` / `text-gray-400` | `dark:text-gray-400` / `dark:text-gray-500` |
| Table header bg | `bg-gray-50` | `dark:bg-gray-700` |
| Table row hover | `hover:bg-gray-50` | `dark:hover:bg-gray-700/50` |
| Input bg | `bg-white` | `dark:bg-gray-700` |
| Input border | `border-gray-300` | `dark:border-gray-600` |
| Input text | `text-gray-900` | `dark:text-gray-100` |
| Input placeholder | `placeholder-gray-400` | `dark:placeholder-gray-500` |
| Divider | `border-gray-200` | `dark:border-gray-700` |
| Header (`bg-navy-900`) | unchanged (already dark) | unchanged |
| Dropdown bg | `bg-white` | `dark:bg-gray-800` |
| Dropdown border | `border-gray-200` | `dark:border-gray-700` |

### Badge classes (`app/globals.css`)
```css
.badge-green { @apply badge bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300; }
.badge-red   { @apply badge bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300; }
.badge-yellow{ @apply badge bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300; }
.badge-blue  { @apply badge bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300; }
.badge-gray  { @apply badge bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300; }
```

---

## Sticky Header

In each of the three pages, find the `<header>` element and add `sticky top-0 z-50` to its className. The header already has `bg-navy-900` which provides the solid background needed for stickiness.

Pages:
- `app/page.tsx`
- `app/stock/[ticker]/page.tsx`
- `app/congress/page.tsx`

---

## Files Changed

| File | Action | Change |
|------|--------|--------|
| `tailwind.config.ts` | Modify | Add `darkMode: 'class'` |
| `lib/useDarkMode.ts` | Create | Dark mode hook |
| `app/layout.tsx` | Modify | Add `suppressHydrationWarning` to `<html>` |
| `app/globals.css` | Modify | Add `dark:` variants to badge classes |
| `app/page.tsx` | Modify | Import hook, add toggle button, add `dark:` classes throughout |
| `app/stock/[ticker]/page.tsx` | Modify | Import hook, add toggle button, add `dark:` classes throughout |
| `app/congress/page.tsx` | Modify | Import hook, add toggle button, add `dark:` classes throughout |

---

## Constraints
- No new npm dependencies
- Recharts charts: Recharts uses SVG — axis labels and tooltip backgrounds need `dark:` class-based overrides via `className` props where possible; chart container backgrounds covered by card dark variants
- `npx tsc --noEmit` must pass after all changes
- Header background (`bg-navy-900`) is already dark — no change needed in dark mode
- Sticky header must not overlap page content — pages already use `<main>` with top padding, so no layout change needed
