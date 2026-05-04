import { notFound } from 'next/navigation'
import { isValidTicker } from '@/lib/validation'
import type { StockDetailData, EarningsData, AnalystData, NewsItem, FinancialsData } from '@/lib/types'
import { StockPageClient } from './StockPageClient'

type Props = {
  params: Promise<{ ticker: string }>
}

export const revalidate = 600 // 10 minutes ISR

async function fetchStockData(ticker: string): Promise<StockDetailData | null> {
  const url = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/stock/${ticker}?days=320&interval=1d&display=100`
  try {
    const res = await fetch(url, { next: { revalidate: 600 } })
    const data = await res.json()
    return data.error ? null : data
  } catch {
    return null
  }
}

async function fetchEarnings(ticker: string): Promise<EarningsData | null> {
  const url = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/earnings/${ticker}`
  try {
    const res = await fetch(url, { next: { revalidate: 21600 } })
    const data = await res.json()
    return data.error ? null : data
  } catch {
    return null
  }
}

async function fetchAnalyst(ticker: string): Promise<AnalystData | null> {
  const url = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/analyst/${ticker}`
  try {
    const res = await fetch(url, { next: { revalidate: 14400 } })
    const data = await res.json()
    return data.error ? null : data
  } catch {
    return null
  }
}

async function fetchNews(ticker: string): Promise<NewsItem[] | null> {
  const url = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/news/${ticker}`
  try {
    const res = await fetch(url, { next: { revalidate: 900 } })
    const data = await res.json()
    return data.error ? null : data.items ?? null
  } catch {
    return null
  }
}

async function fetchFinancials(ticker: string): Promise<FinancialsData | null> {
  const url = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/financials/${ticker}`
  try {
    const res = await fetch(url, { next: { revalidate: 43200 } })
    const data = await res.json()
    return data.error ? null : data
  } catch {
    return null
  }
}

export default async function StockPage({ params }: Props) {
  const { ticker: rawTicker } = await params
  const ticker = rawTicker.toUpperCase()

  if (!isValidTicker(ticker)) {
    notFound()
  }

  // Fetch all data in parallel
  const [stockData, earnings, analyst, news, financials] = await Promise.all([
    fetchStockData(ticker),
    fetchEarnings(ticker),
    fetchAnalyst(ticker),
    fetchNews(ticker),
    fetchFinancials(ticker),
  ])

  if (!stockData) {
    notFound()
  }

  return (
    <StockPageClient
      ticker={ticker}
      initialData={stockData}
      initialEarnings={earnings}
      initialAnalyst={analyst}
      initialNews={news}
      initialFinancials={financials}
    />
  )
}
