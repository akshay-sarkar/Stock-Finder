'use client'

import { useState, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

interface AccordionSectionProps {
  title: string
  storageKey: string
  defaultOpen?: boolean
  children: React.ReactNode
}

export function AccordionSection({ title, storageKey, defaultOpen = true, children }: AccordionSectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`sf-section-${storageKey}`)
      if (saved !== null) setOpen(saved === 'true')
    } catch {}
  }, [storageKey])

  function toggle() {
    const next = !open
    setOpen(next)
    try {
      localStorage.setItem(`sf-section-${storageKey}`, String(next))
    } catch {}
  }

  return (
    <div>
      <button
        onClick={toggle}
        className={[
          'w-full flex items-center justify-between px-4 py-2.5 bg-white border border-gray-200 shadow-sm',
          'hover:bg-gray-50 transition-colors text-sm font-semibold text-gray-700',
          open ? 'rounded-t-xl border-b-0' : 'rounded-xl',
        ].join(' ')}
      >
        {title}
        <ChevronDown
          size={15}
          className={`text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="border border-t-0 border-gray-200 rounded-b-xl overflow-x-auto">
          <div className="p-4 space-y-4 bg-slate-50">
            {children}
          </div>
        </div>
      )}
    </div>
  )
}
