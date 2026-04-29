import { useEffect, useState } from 'react'

export function useDarkMode() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const enabled = localStorage.getItem('sf-dark-mode') === 'true'
    setDark(enabled)
    document.documentElement.classList.toggle('dark', enabled)
  }, [])

  function toggle() {
    // Read from DOM — source of truth — so this is correct even if called before useEffect
    const next = !document.documentElement.classList.contains('dark')
    localStorage.setItem('sf-dark-mode', String(next))
    document.documentElement.classList.toggle('dark', next)
    setDark(next)
  }

  return { dark, toggle }
}
