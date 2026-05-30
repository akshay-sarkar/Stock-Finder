'use client'

const DATE_RANGES = [
  { label: '1M', fetchDays: 320, interval: '1d' as const, displayPoints: 22 },
  { label: '3M', fetchDays: 320, interval: '1d' as const, displayPoints: 65 },
  { label: '6M', fetchDays: 320, interval: '1d' as const, displayPoints: 130 },
  { label: '1Y', fetchDays: 380, interval: '1d' as const, displayPoints: 252 },
  { label: '2Y', fetchDays: 740, interval: '1d' as const, displayPoints: 504 },
  { label: '5Y', fetchDays: 1830, interval: '1wk' as const, displayPoints: 260 },
] as const
type Range = (typeof DATE_RANGES)[number]

interface RangeSelectorProps {
  range: Range
  onRangeChange: (range: Range) => void
  showEMA9: boolean
  onToggleEMA9: () => void
  showEMA20: boolean
  onToggleEMA20: () => void
  showSMA20: boolean
  onToggleSMA20: () => void
  showSMA50: boolean
  onToggleSMA50: () => void
  showSMA200: boolean
  onToggleSMA200: () => void
  showBB: boolean
  onToggleBB: () => void
  onToggleAllOverlays: () => void
}

export function RangeSelector({
  range,
  onRangeChange,
  showEMA9,
  onToggleEMA9,
  showEMA20,
  onToggleEMA20,
  showSMA20,
  onToggleSMA20,
  showSMA50,
  onToggleSMA50,
  showSMA200,
  onToggleSMA200,
  showBB,
  onToggleBB,
  onToggleAllOverlays,
}: RangeSelectorProps) {
  const isWeekly = range.interval === '1wk'
  const allOverlaysOn = showEMA9 && showEMA20 && showSMA20 && showSMA50 && showSMA200 && showBB
  const anyOverlaysOn = showEMA9 || showEMA20 || showSMA20 || showSMA50 || showSMA200 || showBB

  return (
    <div className="flex flex-col gap-2">
      {/* Row 1: Range selectors */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-gray-400 font-medium uppercase tracking-wide mr-1">Range:</span>
        {DATE_RANGES.map((r) => (
          <button
            key={r.label}
            onClick={() => onRangeChange(r)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              range.label === r.label
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white border border-gray-300 text-gray-600 hover:border-blue-400 hover:text-blue-600'
            }`}
          >
            {r.label}
          </button>
        ))}
        {isWeekly && (
          <span className="ml-1 text-xs text-blue-500 bg-blue-50 border border-blue-100 px-2 py-1 rounded">
            Weekly candles
          </span>
        )}
        <span className="ml-auto text-xs text-gray-400 italic hidden md:block">
          Hover legend labels for descriptions
        </span>
      </div>

      {/* Row 2: Overlay toggles */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-gray-400 font-medium uppercase tracking-wide mr-1">Overlays:</span>
        <button
          onClick={onToggleEMA9}
          title="Exponential Moving Average (9 periods)"
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
            showEMA9
              ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
              : 'bg-white border-gray-300 text-gray-600 hover:border-purple-400 hover:text-purple-600'
          }`}
        >
          EMA9
        </button>
        <button
          onClick={onToggleEMA20}
          title="Exponential Moving Average (20 periods)"
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
            showEMA20
              ? 'bg-green-600 text-white border-green-600 shadow-sm'
              : 'bg-white border-gray-300 text-gray-600 hover:border-green-400 hover:text-green-600'
          }`}
        >
          EMA20
        </button>
        <button
          onClick={onToggleSMA20}
          title="Simple Moving Average (20 periods)"
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
            showSMA20
              ? 'bg-cyan-600 text-white border-cyan-600 shadow-sm'
              : 'bg-white border-gray-300 text-gray-600 hover:border-cyan-400 hover:text-cyan-600'
          }`}
        >
          SMA20
        </button>
        <button
          onClick={onToggleSMA50}
          title="Simple Moving Average (50 periods)"
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
            showSMA50
              ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
              : 'bg-white border-gray-300 text-gray-600 hover:border-amber-400 hover:text-amber-600'
          }`}
        >
          SMA50
        </button>
        <button
          onClick={onToggleSMA200}
          title="Simple Moving Average (200 periods)"
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
            showSMA200
              ? 'bg-red-600 text-white border-red-600 shadow-sm'
              : 'bg-white border-gray-300 text-gray-600 hover:border-red-400 hover:text-red-600'
          }`}
        >
          SMA200
        </button>
        <button
          onClick={onToggleBB}
          title="Bollinger Bands (20, ±2σ)"
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
            showBB
              ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
              : 'bg-white border-gray-300 text-gray-600 hover:border-violet-400 hover:text-violet-600'
          }`}
        >
          BB
        </button>
        <button
          onClick={onToggleAllOverlays}
          title={allOverlaysOn ? 'Disable all overlays' : 'Enable all overlays'}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ml-2 ${
            allOverlaysOn
              ? 'bg-slate-700 text-white border-slate-700 shadow-sm'
              : anyOverlaysOn
                ? 'bg-slate-100 text-slate-700 border-slate-300 hover:border-slate-400'
                : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
          }`}
        >
          {allOverlaysOn ? 'All On' : anyOverlaysOn ? 'Mixed' : 'All Off'}
        </button>
      </div>
    </div>
  )
}

export { DATE_RANGES, type Range }
