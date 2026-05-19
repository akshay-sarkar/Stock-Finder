import type { ReactNode } from 'react'

export const metadata = { title: 'Trading Dashboard' }

export default function TradingViewLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-screen bg-slate-950 flex flex-col overflow-hidden">
      {children}
    </div>
  )
}
