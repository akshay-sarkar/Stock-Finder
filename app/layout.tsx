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
