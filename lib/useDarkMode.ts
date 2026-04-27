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
