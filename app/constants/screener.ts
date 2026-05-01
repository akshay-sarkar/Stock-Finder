export const SCAN_BATCH = parseInt(process.env.NEXT_PUBLIC_TICKER_PER_BATCH || '50', 10) || 50

export const SIGNAL_GLOSSARY = [
  { signal: 'Oversold',         color: 'bg-emerald-100 text-emerald-700',
    desc: 'RSI < 30. Fallen sharply — may be due for a bounce. Confirm with price action before entering.' },
  { signal: 'Overbought',       color: 'bg-red-100 text-red-700',
    desc: 'RSI > 70. Rallied strongly and may be stretched. Watch for momentum slowing before shorting.' },
  { signal: 'MACD Bull Cross',  color: 'bg-emerald-100 text-emerald-700',
    desc: 'MACD histogram just flipped positive — MACD crossed above Signal. Strongest when it occurs below zero.' },
  { signal: 'MACD Bear Cross',  color: 'bg-red-100 text-red-700',
    desc: 'MACD histogram just flipped negative — MACD crossed below Signal. Most significant above the zero line.' },
  { signal: 'MACD Bullish',     color: 'bg-blue-100 text-blue-700',
    desc: 'MACD is above Signal (histogram > 0) but no fresh crossover. Upward momentum present.' },
  { signal: 'MACD Bearish',     color: 'bg-gray-100 text-gray-600',
    desc: 'MACD is below Signal (histogram < 0). Downward momentum dominant. No fresh crossover.' },
  { signal: 'Golden Cross Zone',color: 'bg-emerald-100 text-emerald-700',
    desc: 'SMA50 > SMA200 — in a long-term uptrend zone. One of the most watched bullish macro signals.' },
  { signal: 'Death Cross Zone', color: 'bg-red-100 text-red-700',
    desc: 'SMA50 < SMA200 — in a long-term downtrend zone. Often confirms a bear market.' },
  { signal: 'Above SMA50',      color: 'bg-emerald-100 text-emerald-700',
    desc: 'Price is above the 50-day SMA. Medium-term trend is up. Institutions use this as a key support level.' },
  { signal: 'Below SMA50',      color: 'bg-red-100 text-red-700',
    desc: 'Price is below the 50-day SMA. Medium-term trend is down. A break below SMA50 is often bearish.' },
  { signal: 'Vol Spike',        color: 'bg-emerald-100 text-emerald-700',
    desc: "Volume > 2× 20-day avg. High volume confirms conviction behind a move — breakouts on spike volume are reliable." },
  { signal: 'Low Volume',       color: 'bg-gray-100 text-gray-600',
    desc: "Volume < 50% of 20-day avg. Low-volume moves are less reliable and often reverse." },
] as const

export const INDICATOR_QUICK_REFERENCE = [
  ['RSI',       'Relative Strength Index. <30 = Oversold, >70 = Overbought'],
  ['MACD',      'Moving Avg Convergence Divergence. Crossovers signal trend shifts'],
  ['MA Status', 'SMA50/SMA200 relationship. Golden/Death cross + price position'],
  ['Vol Ratio', "Today's volume vs 20-day avg. >2× = significant spike"],
] as const
