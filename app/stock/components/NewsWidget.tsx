'use client'

import { ExternalLink } from 'lucide-react'
import { NewsItem } from '@/lib/types'

export function NewsWidget({ items }: { items: NewsItem[] }) {
  if (!items.length) return null

  function timeAgo(ts: number): string {
    const diff = Math.floor(Date.now() / 1000) - ts
    if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  function fmtNewsDate(ts: number): string {
    return new Date(ts * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="divide-y divide-gray-50">
      {items.map((item, i) => (
        <a
          key={i}
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-start gap-3 py-2.5 hover:bg-gray-50 rounded transition-colors px-1 -mx-1"
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-800 leading-snug line-clamp-2">{item.title}</p>
            <div className="flex items-center gap-2 mt-0.5">
              {item.publisher && (
                <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-medium">
                  {item.publisher}
                </span>
              )}
              {item.publishedAt > 0 && (
                <span className="text-[10px] text-gray-400">
                  {timeAgo(item.publishedAt)} · {fmtNewsDate(item.publishedAt)}
                </span>
              )}
            </div>
          </div>
          <ExternalLink size={12} className="text-gray-300 shrink-0 mt-1" />
        </a>
      ))}
    </div>
  )
}