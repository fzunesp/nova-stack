import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { Search, Users, Briefcase, CheckSquare, FileText, Inbox, ArrowRight, Loader2, Package } from 'lucide-react'
import { type SearchResult, type GroupedResults } from '@/hooks/useGlobalSearch'

const TYPE_CONFIG = {
  contact: { label: 'Contacts', icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
  deal:    { label: 'Deals',    icon: Briefcase, color: 'text-orange-500', bg: 'bg-orange-50' },
  task:    { label: 'Tasks',    icon: CheckSquare, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  invoice: { label: 'Invoices', icon: FileText, color: 'text-violet-500', bg: 'bg-violet-50' },
  product: { label: 'Products', icon: Package, color: 'text-indigo-500', bg: 'bg-indigo-50' },
  intake:  { label: 'Intake',   icon: Inbox, color: 'text-pink-500', bg: 'bg-pink-50' },
} as const

const GROUP_ORDER: (keyof GroupedResults)[] = ['contacts', 'deals', 'tasks', 'invoices', 'products', 'intake']
const TYPE_MAP: Record<keyof GroupedResults, SearchResult['type']> = {
  contacts: 'contact',
  deals: 'deal',
  tasks: 'task',
  invoices: 'invoice',
  products: 'product',
  intake: 'intake',
}

interface Props {
  open: boolean
  onClose: () => void
  query: string
  onQueryChange: (q: string) => void
  data: GroupedResults | undefined
  isLoading: boolean
  hasResults: boolean | GroupedResults | undefined
  debouncedQuery: string
}

export function GlobalSearch({ open, onClose, query, onQueryChange, data, isLoading, hasResults, debouncedQuery }: Props) {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [activeIndex, setActiveIndex] = useState(-1)

  // Flatten results for keyboard navigation
  const flatResults: SearchResult[] = data
    ? GROUP_ORDER.flatMap((g) => data[g])
    : []

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setActiveIndex(-1)
    }
  }, [open])

  // Reset active index when results change
  useEffect(() => {
    setActiveIndex(-1)
  }, [debouncedQuery])

  // Keyboard navigation
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex((i) => Math.min(i + 1, flatResults.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex((i) => Math.max(i - 1, -1))
      } else if (e.key === 'Enter' && activeIndex >= 0) {
        const result = flatResults[activeIndex]
        if (result) handleSelect(result)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, activeIndex, flatResults])

  const handleSelect = (result: SearchResult) => {
    onClose()
    const state: any = { search: result.title }
    if (result.type === 'deal') state.tab = 'deals'
    if (result.type === 'contact') state.tab = 'contacts'
    navigate(result.link, { state })
  }

  if (!open) return null

  const showEmpty = debouncedQuery.length >= 2 && !isLoading && !hasResults
  const showPrompt = query.length < 2

  let globalIdx = -1

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">

        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100">
          {isLoading
            ? <Loader2 className="w-4 h-4 text-slate-400 flex-shrink-0 animate-spin" />
            : <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
          }
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search contacts, deals, tasks, invoices, products..."
            className="flex-1 text-sm text-slate-900 placeholder-slate-400 outline-none bg-transparent"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-slate-400 bg-slate-100 rounded border border-slate-200">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[420px] overflow-y-auto">

          {/* Prompt state */}
          {showPrompt && (
            <div className="py-12 text-center">
              <Search className="w-8 h-8 text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-400">Type at least 2 characters to search</p>
              <p className="text-xs text-slate-300 mt-1">Searches contacts, deals, tasks, invoices, products & intake</p>
            </div>
          )}

          {/* Empty state */}
          {showEmpty && (
            <div className="py-12 text-center">
              <p className="text-sm font-medium text-slate-500">No results for</p>
              <p className="text-sm text-slate-400 mt-0.5">"{debouncedQuery}"</p>
            </div>
          )}

          {/* Grouped results */}
          {data && hasResults && GROUP_ORDER.map((group) => {
            const items = data[group]
            if (!items.length) return null
            const type = TYPE_MAP[group]
            const config = TYPE_CONFIG[type]
            const Icon = config.icon

            return (
              <div key={group}>
                {/* Group header */}
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border-b border-slate-100">
                  <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    {config.label}
                  </span>
                </div>

                {/* Items */}
                {items.map((result) => {
                  globalIdx++
                  const idx = globalIdx
                  const isActive = activeIndex === idx

                  return (
                    <button
                      key={result.id}
                      onMouseEnter={() => setActiveIndex(idx)}
                      onMouseDown={() => handleSelect(result)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-slate-50 last:border-0 group ${
                        isActive ? 'bg-slate-50' : 'hover:bg-slate-50'
                      }`}
                    >
                      {/* Type icon */}
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${config.bg}`}>
                        <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                      </span>

                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{result.title}</p>
                        {result.subtitle && (
                          <p className="text-xs text-slate-400 truncate mt-0.5">{result.subtitle}</p>
                        )}
                      </div>

                      {/* Arrow on hover/active */}
                      <ArrowRight className={`w-3.5 h-3.5 text-slate-300 flex-shrink-0 transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>

        {/* Footer hint */}
        {hasResults && (
          <div className="flex items-center gap-4 px-4 py-2 border-t border-slate-100 bg-slate-50">
            <span className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px]">↑↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px]">↵</kbd>
              Open
            </span>
            <span className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px]">ESC</kbd>
              Close
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
