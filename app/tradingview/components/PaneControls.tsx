'use client'

export interface PaneConfig {
  id: string
  source: 'stock' | 'crypto'
  symbol: string
  interval: string
  showRSI: boolean
  showMACD: boolean
  showWR: boolean
  showBB: boolean
  showVP: boolean
  showFVG: boolean
}

const STOCK_INTERVALS = ['1m', '5m', '15m', '1h', '1d', '1mo']
const CRYPTO_INTERVALS = ['1m', '5m', '15m', '1h', '4h', '1d']

const INDICATORS: { label: string; key: keyof PaneConfig }[] = [
  { label: 'RSI',  key: 'showRSI'  },
  { label: 'MACD', key: 'showMACD' },
  { label: 'WR',   key: 'showWR'   },
  { label: 'BB',   key: 'showBB'   },
  { label: 'VP',   key: 'showVP'   },
  { label: 'FVG',  key: 'showFVG'  },
]

interface Props {
  config: PaneConfig
  onChange: (patch: Partial<PaneConfig>) => void
}

export function PaneControls({ config, onChange }: Props) {
  const intervals = config.source === 'crypto' ? CRYPTO_INTERVALS : STOCK_INTERVALS

  return (
    <div className="flex items-center gap-1 px-2 py-1 bg-slate-800 border-b border-slate-700 text-xs flex-wrap shrink-0">
      <div className="flex rounded overflow-hidden border border-slate-600">
        {(['stock', 'crypto'] as const).map(s => (
          <button
            key={s}
            onClick={() => onChange({ source: s, symbol: s === 'crypto' ? 'BTC' : 'SPY', interval: s === 'crypto' ? '1m' : '1d' })}
            className={`px-2 py-0.5 text-xs ${config.source === s ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            {s === 'stock' ? 'Stock' : 'Crypto'}
          </button>
        ))}
      </div>

      <input
        type="text"
        value={config.symbol}
        onChange={e => onChange({ symbol: e.target.value.toUpperCase() })}
        onBlur={e => { if (!e.target.value) onChange({ symbol: config.source === 'crypto' ? 'BTC' : 'SPY' }) }}
        className="w-16 bg-slate-700 text-white border border-slate-600 rounded px-1 py-0.5 text-xs"
        placeholder="Symbol"
      />

      <select
        value={config.interval}
        onChange={e => onChange({ interval: e.target.value })}
        className="bg-slate-700 text-white border border-slate-600 rounded px-1 py-0.5 text-xs"
      >
        {intervals.map(i => <option key={i} value={i}>{i}</option>)}
      </select>

      <div className="w-px h-3 bg-slate-600 mx-0.5" />

      {INDICATORS.map(({ label, key }) => (
        <button
          key={key}
          onClick={() => onChange({ [key]: !config[key] } as Partial<PaneConfig>)}
          className={`px-1.5 py-0.5 rounded text-xs transition-colors ${
            config[key] ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
