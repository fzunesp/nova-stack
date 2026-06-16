import { useState, useRef, useEffect } from 'react'
import { SlidersHorizontal, Check, ChevronUp, ChevronDown, RotateCcw, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ColumnDef } from '@/hooks/useColumnPicker'

export interface ColumnPickerProps {
  orderedAllColumns: ColumnDef[]
  visibleKeys: Set<string>
  onToggle: (key: string) => void
  onMove: (key: string, direction: 'up' | 'down') => void
  onReset: () => void
}

export function ColumnPicker({ 
  orderedAllColumns, 
  visibleKeys, 
  onToggle,
  onMove,
  onReset
}: ColumnPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Filter configurable columns to determine boundaries for moving
  const configurableColumns = orderedAllColumns.filter(c => !c.alwaysVisible && !c.stickyRight)
  const totalConfigCols = configurableColumns.length

  return (
    <div className="relative" ref={dropdownRef}>
      <Button 
        variant="outline" 
        size="sm" 
        className="flex items-center gap-2 h-9 border-slate-200 text-slate-600 hover:text-slate-900 bg-white shadow-sm font-medium transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <SlidersHorizontal className="w-4 h-4 text-slate-500" />
        <span>Columns</span>
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-slate-200 bg-white shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Column Manager</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="h-7 px-2 text-slate-500 hover:text-slate-800 text-xs flex items-center gap-1 font-semibold"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </Button>
          </div>

          {/* List of Columns */}
          <div className="max-h-[60vh] overflow-y-auto p-2 space-y-1">
            {orderedAllColumns.map((col) => {
              const isPinned = col.alwaysVisible || col.stickyRight
              const isVisible = isPinned || visibleKeys.has(col.key)
              
              // Find index of this column within the configurable list to handle up/down disabled states
              const configIndex = configurableColumns.findIndex(c => c.key === col.key)

              // Friendly label for empty/expand column
              const displayLabel = col.label || (col.key === 'expand' ? 'Expand Row' : col.key)

              return (
                <div 
                  key={col.key}
                  className={`flex items-center justify-between p-1 rounded-lg transition-all border ${
                    isPinned
                      ? 'bg-slate-100/50 border-slate-200/40 opacity-75'
                      : isVisible 
                        ? 'bg-slate-50/50 border-slate-100' 
                        : 'bg-white border-transparent opacity-60'
                  }`}
                >
                  {/* Reordering Controls */}
                  <div className="flex items-center gap-0.5 mr-2 flex-shrink-0">
                    {isPinned ? (
                      <div className="h-6 w-12 flex items-center justify-center text-slate-400" title="Pinned column position cannot be changed">
                        <Lock className="w-3.5 h-3.5" />
                      </div>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={configIndex === 0}
                          onClick={() => onMove(col.key, 'up')}
                          className="h-6 w-6 text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
                          title="Move up"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={configIndex === totalConfigCols - 1}
                          onClick={() => onMove(col.key, 'down')}
                          className="h-6 w-6 text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
                          title="Move down"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    )}
                  </div>

                  {/* Label */}
                  <div className="flex-1 min-w-0 mr-3">
                    {isPinned ? (
                      <span className="font-semibold text-slate-500 text-xs italic">
                        {displayLabel}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onToggle(col.key)}
                        className="w-full text-left font-medium text-slate-700 hover:text-slate-900 text-sm truncate focus:outline-none"
                      >
                        {displayLabel}
                      </button>
                    )}
                    {col.isCustom && (
                      <span className="inline-block px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-indigo-50 text-indigo-600 border border-indigo-100 mt-0.5">
                        Custom
                      </span>
                    )}
                    {col.readOnly && (
                      <span className="inline-block px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-amber-50 text-amber-600 border border-amber-100 mt-0.5 ml-1" title="This field is automatically managed by the system and cannot be edited">
                        Auto
                      </span>
                    )}
                  </div>

                  {/* Visibility Checkbox */}
                  <div className="flex-shrink-0 mr-1">
                    {isPinned ? (
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-200/50 px-1.5 py-0.5 rounded border border-slate-300/40">
                        Pinned
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onToggle(col.key)}
                        className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors cursor-pointer ${
                          isVisible 
                            ? 'bg-[rgb(var(--ns-accent))] border-[rgb(var(--ns-accent))]' 
                            : 'border-slate-300 bg-white hover:border-slate-400'
                        }`}
                      >
                        {isVisible && <Check className="w-3 h-3 text-white stroke-[3px]" />}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

