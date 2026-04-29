import * as React from 'react'

export function tickDate(d: string) {
  return d?.slice(5) ?? ''
}

export const tooltipStyle = {
  contentStyle: {
    fontSize: '12px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
    padding: '8px 12px',
  },
}

export function HintTooltip({ children, hint }: { children: React.ReactNode; hint: string }) {
  const [show, setShow] = React.useState(false)

  return (
    <span
      className="relative inline-flex items-center cursor-help"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
    >
      {children}
      {show && (
        <span
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 bg-gray-900 text-white text-xs rounded-xl px-3 py-2.5 z-[9999] shadow-2xl pointer-events-none leading-relaxed"
          style={{ minWidth: '220px' }}
        >
          {hint}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-gray-900" />
        </span>
      )}
    </span>
  )
}

export interface LegendPayloadItem {
  color: string
  value: string
  type?: string
}

interface ChartLegendProps {
  payload?: LegendPayloadItem[]
  hints?: Record<string, string>
}

export function ChartLegend({ payload, hints = {} }: ChartLegendProps) {
  if (!payload?.length) return null
  return (
    <div className="flex flex-wrap gap-4 justify-center mt-2 mb-1 px-2">
      {payload.map((item) => {
        const hint = hints[item.value]
        const label = (
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block w-5 rounded-sm shrink-0"
              style={{
                height: item.type === 'rect' ? 8 : 2,
                backgroundColor: item.color,
                opacity: 0.9,
              }}
            />
            <span className="text-xs text-gray-600 border-b border-dotted border-gray-400 leading-tight">
              {item.value}
            </span>
          </span>
        )
        if (!hint) return <span key={item.value}>{label}</span>
        return (
          <HintTooltip key={item.value} hint={hint}>
            {label}
          </HintTooltip>
        )
      })}
    </div>
  )
}