'use client'

import { useState, useEffect, useCallback } from 'react'

/**
 * Hydration-safe boolean state backed by localStorage.
 * Initializes to defaultValue on both SSR and first client render,
 * then syncs from localStorage after mount — no hydration mismatch.
 */
export function useLocalStorageBool(
  key: string,
  defaultValue: boolean
): [boolean, () => void, (v: boolean) => void] {
  const [value, setValue] = useState(defaultValue)

  useEffect(() => {
    const stored = localStorage.getItem(key)
    if (stored !== null) setValue(stored === 'true')
  }, [key])

  const toggle = useCallback(() => {
    setValue(prev => {
      const next = !prev
      localStorage.setItem(key, String(next))
      return next
    })
  }, [key])

  const set = useCallback((v: boolean) => {
    setValue(v)
    localStorage.setItem(key, String(v))
  }, [key])

  return [value, toggle, set]
}
