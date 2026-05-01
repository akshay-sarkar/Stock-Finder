import { Header } from './components/Screener/Header'
import { ScreenerClient } from './ScreenerClient'
import { INDICATOR_QUICK_REFERENCE } from './constants/screener'

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <ScreenerClient />

      {/* Indicator quick-reference (static) */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-gray-500">
          {INDICATOR_QUICK_REFERENCE.map(([title, desc]) => (
            <div key={title} className="bg-white rounded-lg border border-gray-200 p-3">
              <p className="font-semibold text-gray-700 mb-0.5">{title}</p>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </div>

      <footer className="text-center text-xs text-gray-400 py-6 border-t mt-4">
        Data via Yahoo Finance · Not financial advice · For educational use only
      </footer>
    </div>
  )
}
