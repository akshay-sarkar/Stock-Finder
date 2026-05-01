'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function StockError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Stock Page Error]', error.message)
  }, [error])

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Stock Data Unavailable</h2>
        <p className="text-gray-600 mb-4">We couldn't load this stock's data. Try refreshing or go back to the screener.</p>
        <details className="text-sm text-gray-500 mb-6 text-left bg-gray-50 p-3 rounded">
          <summary className="cursor-pointer font-medium">Error details</summary>
          <pre className="mt-2 whitespace-pre-wrap break-words text-xs">{error.message}</pre>
        </details>
        <div className="flex gap-3">
          <button
            onClick={() => reset()}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Retry
          </button>
          <Link
            href="/"
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Back
          </Link>
        </div>
      </div>
    </div>
  )
}
