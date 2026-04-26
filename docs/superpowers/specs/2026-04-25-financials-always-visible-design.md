# Design Spec: Historical Financials Always Visible
**Date:** 2026-04-25
**Status:** Approved
**Scope:** Remove expand/collapse toggle from Historical Financials card. One file change only.

---

## Change

**Current:** Historical Financials card has a collapse button; content hidden by default (`showFinancials` state starts `false`).

**New:** Content always visible. No toggle button. No `showFinancials` state.

## Implementation

**File:** `app/stock/[ticker]/page.tsx`

1. Delete `const [showFinancials, setShowFinancials] = useState(false)` state declaration.
2. Inside the Financials card div (inside the 2-col grid), remove the `<button>` block entirely:
   ```tsx
   <button
     onClick={() => setShowFinancials(v => !v)}
     className="w-full flex items-center justify-between text-sm font-semibold text-gray-700"
   >
     <span>Historical Financials</span>
     <span className="text-gray-400 text-xs font-normal">{showFinancials ? '▲ collapse' : '▶ expand'}</span>
   </button>
   ```
3. Remove the `{showFinancials && (...)}` wrapper — render `<FinancialsWidget data={financials} />` (with `mt-3` div) directly and unconditionally inside the card div.

## Constraints
- `showNews` / News collapse toggle: untouched
- `FinancialsWidget` component definition: untouched
- `npx tsc --noEmit` must pass after change
