'use client'

import { useState, useRef } from 'react'
import { X, Plus, Upload, Download, Check } from 'lucide-react'
import { DEFAULT_TICKERS, COMPANY_NAMES } from '@/lib/stockList'

export function TickerModal({
  watchlist,
  onUpdate,
  onClose,
}: {
  watchlist: string[]
  onUpdate: (t: string[]) => void
  onClose: () => void
}) {
  const [search,      setSearch]      = useState('')
  const [addInput,    setAddInput]    = useState('')
  const [importText,  setImportText]  = useState('')
  const [tab,         setTab]         = useState<'list' | 'import'>('list')
  const [copied,      setCopied]      = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const filtered = search
    ? watchlist.filter(t => t.includes(search.toUpperCase()) ||
        (COMPANY_NAMES[t] ?? '').toLowerCase().includes(search.toLowerCase()))
    : watchlist

  function parseTickers(raw: string): string[] {
    return raw.split(/[\s,;\n]+/)
      .map(t => t.trim().toUpperCase().replace(/[^A-Z0-9.\-]/g, ''))
      .filter(t => t.length >= 1 && t.length <= 8)
  }

  function remove(t: string) { onUpdate(watchlist.filter(x => x !== t)) }

  function addTickers(raw: string) {
    const news = parseTickers(raw)
    onUpdate([...new Set([...watchlist, ...news])])
  }

  function handleAdd() {
    if (!addInput.trim()) return
    addTickers(addInput)
    setAddInput('')
  }

  function handleImport() {
    if (!importText.trim()) return
    addTickers(importText)
    setImportText('')
    setTab('list')
  }

  function handleFileImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      addTickers(ev.target?.result as string ?? '')
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(watchlist.join(', ')).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function downloadTxt() {
    const blob = new Blob([watchlist.join('\n')], { type: 'text/plain' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = 'watchlist.txt'; a.click()
    URL.revokeObjectURL(url)
  }

  function resetDefaults() {
    if (confirm(`Reset to ${DEFAULT_TICKERS.length}-ticker default list? Your changes will be lost.`)) {
      onUpdate([...DEFAULT_TICKERS])
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col"
        style={{ maxHeight: '80vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-gray-800">Manage Watchlist</h2>
            <p className="text-xs text-gray-400 mt-0.5">{watchlist.length} tickers</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-5">
          {(['list', 'import'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`py-2.5 px-3 text-sm font-medium border-b-2 -mb-px capitalize transition-colors ${
                tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >{t === 'list' ? 'Tickers' : 'Import'}</button>
          ))}
        </div>

        {tab === 'list' ? (
          <>
            {/* Search & Add */}
            <div className="px-5 py-3 space-y-2 border-b border-gray-50">
              <input
                type="text"
                placeholder="Search by ticker or company…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add ticker (e.g. RIVN, TSLA)"
                  value={addInput}
                  onChange={e => setAddInput(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && handleAdd()}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={handleAdd}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 shrink-0"
                >
                  <Plus size={14} /> Add
                </button>
              </div>
            </div>

            {/* Scrollable ticker grid */}
            <div className="flex-1 overflow-y-auto px-5 py-3">
              {filtered.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-6">No tickers match your search.</p>
              ) : (
                <div className="grid grid-cols-3 gap-1.5">
                  {filtered.map(t => (
                    <div key={t} className="group flex items-center justify-between bg-gray-50 hover:bg-red-50 rounded-lg px-2.5 py-1.5 transition-colors">
                      <div className="min-w-0">
                        <span className="text-sm font-semibold text-gray-700">{t}</span>
                        {COMPANY_NAMES[t] && (
                          <span className="block text-[10px] text-gray-400 truncate leading-tight">
                            {COMPANY_NAMES[t]}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => remove(t)}
                        className="text-gray-200 group-hover:text-red-400 transition-colors ml-1 shrink-0"
                        title={`Remove ${t}`}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            <p className="text-xs text-gray-500">
              Paste tickers separated by commas, spaces, or new lines. Duplicates are ignored.
            </p>
            <textarea
              value={importText}
              onChange={e => setImportText(e.target.value)}
              placeholder={"AAPL, MSFT, GOOGL\nTSLA NVDA\nAMZN"}
              rows={6}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono resize-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-2">
              <button
                onClick={handleImport}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm font-medium"
              >
                Add to Watchlist
              </button>
              <button
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-1.5 border border-gray-300 text-gray-600 hover:bg-gray-50 rounded-lg px-3 py-2 text-sm"
              >
                <Upload size={13} /> .txt / .csv
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".txt,.csv"
                className="hidden"
                onChange={handleFileImport}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center gap-2 px-5 py-3 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-1.5 text-xs text-gray-600 border border-gray-200 bg-white rounded-lg px-3 py-1.5 hover:border-gray-300 transition-colors"
          >
            {copied ? <Check size={12} className="text-emerald-500" /> : <Upload size={12} />}
            {copied ? 'Copied!' : 'Copy list'}
          </button>
          <button
            onClick={downloadTxt}
            className="flex items-center gap-1.5 text-xs text-gray-600 border border-gray-200 bg-white rounded-lg px-3 py-1.5 hover:border-gray-300 transition-colors"
          >
            <Download size={12} /> Export .txt
          </button>
          <button
            onClick={resetDefaults}
            className="ml-auto text-xs text-gray-400 hover:text-red-500 transition-colors"
          >
            ↺ Reset to defaults
          </button>
        </div>
      </div>
    </div>
  )
}