import { useEffect, useState } from 'react'

export function useDarkMode() {
  const [dark, setDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('sf-dark-mode') === 'true'
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

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
