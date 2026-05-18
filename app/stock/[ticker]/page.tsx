import { notFound } from 'next/navigation'
import { isValidTicker } from '@/lib/validation'
import { getHistoricalData, getQuote, getQuoteSummary, getEarnings, getAnalystData, getNews } from '@/lib/yahoo'
import { computeIndicators, computeIndicatorHistory } from '@/lib/indicators'
import type { StockDetailData, EarningsData, AnalystData, NewsItem } from '@/lib/types'
import { StockPageClient } from './StockPageClient'

type Props = {
  params: { ticker: string }
}

export const revalidate = 600 // 10 minutes ISR

export default async function StockPage({ params }: Props) {
  const { ticker: rawTicker } = params
  const ticker = rawTicker.toUpperCase()

  if (!isValidTicker(ticker)) {
    notFound()
  }

  // Fetch all data in parallel — direct lib calls, no loopback HTTP
  const [data, quote, fundamentals, earnings, analyst, news] = await Promise.all([
    getHistoricalData(ticker, 320, '1d'),
    getQuote(ticker),
    getQuoteSummary(ticker).catch(() => null),
    getEarnings(ticker).catch((): EarningsData => ({
      nextEarningsDate: null, epsEstimateNext: null,
      epsEstimateLow: null, epsEstimateHigh: null, history: [],
    })),
    getAnalystData(ticker).catch((): AnalystData => ({
      targetMeanPrice: null, targetLowPrice: null, targetHighPrice: null,
      recommendationMean: null, recommendationKey: null, numberOfAnalystOpinions: null,
    })),
    getNews(ticker).catch((): NewsItem[] => []),
  ])

  if (data.length < 35) notFound()

  const ind = computeIndicators(data)
  if (!ind) notFound()

  const stockData: StockDetailData = {
    ticker,
    companyName:             quote.name,
    exchange:                quote.exchange,
    currentPrice:            quote.price,
    change:                  quote.change,
    changePercent:           quote.changePercent,
    postMarketPrice:         quote.postMarketPrice,
    postMarketChange:        quote.postMarketChange,
    postMarketChangePercent: quote.postMarketChangePercent,
    chartData:               computeIndicatorHistory(data, 100),
    latestIndicators:        ind,
    fundamentals,
  }

  return (
    <StockPageClient
      ticker={ticker}
      initialData={stockData}
      initialEarnings={earnings}
      initialAnalyst={analyst}
      initialNews={news}
      initialFinancials={null}
    />
  )
}
