import { useState, useRef, useEffect } from 'react'
import { SlidersHorizontal, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ColumnDef } from '@/hooks/useColumnPicker'

export interface ColumnPickerProps {
  allColumns: ColumnDef[]
  visibleKeys: Set<string>
  onToggle: (key: string) => void
}

export function ColumnPicker({ allColumns, visibleKeys, onToggle }: ColumnPickerProps) {
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

  const standardCols = allColumns.filter(c => !c.isCustom && !c.alwaysVisible)
  const customCols = allColumns.filter(c => c.isCustom && !c.alwaysVisible)
  
  const activeCustomCount = customCols.filter(c => visibleKeys.has(c.key)).length

  return (
    <div className="relative" ref={dropdownRef}>
      <Button 
        variant="outline" 
        size="sm" 
        className="flex items-center gap-2 h-9 border-slate-200 text-slate-600 hover:text-slate-900 bg-white"
        onClick={() => setIsOpen(!isOpen)}
      >
        <SlidersHorizontal className="w-4 h-4" />
        <span className="hidden sm:inline">Columns</span>
        {activeCustomCount > 0 && (
          <span className="ml-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[rgb(var(--ns-accent))] px-1 text-[10px] font-bold text-white">
            {activeCustomCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-slate-200 bg-white shadow-lg z-50 overflow-hidden">
          <div className="max-h-[60vh] overflow-y-auto">
            <div className="p-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">Standard Columns</h4>
              <div className="space-y-0.5">
                {standardCols.map(col => (
                  <button
                    key={col.key}
                    type="button"
                    onClick={() => onToggle(col.key)}
                    className="w-full flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-slate-50 text-sm text-slate-700 transition-colors"
                  >
                    <span>{col.label}</span>
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${visibleKeys.has(col.key) ? 'bg-[rgb(var(--ns-accent))] border-[rgb(var(--ns-accent))]' : 'border-slate-300'}`}>
                      {visibleKeys.has(col.key) && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-4 mb-2 border-t border-slate-100 pt-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">Custom Attributes</h4>
                {customCols.length === 0 ? (
                  <p className="text-xs text-slate-500 px-2 italic">No custom fields defined.</p>
                ) : (
                  <div className="space-y-0.5">
                    {customCols.map(col => (
                      <button
                        key={col.key}
                        type="button"
                        onClick={() => onToggle(col.key)}
                        className="w-full flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-slate-50 text-sm text-slate-700 transition-colors"
                      >
                        <span className="truncate pr-2 text-left">{col.label}</span>
                        <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${visibleKeys.has(col.key) ? 'bg-[rgb(var(--ns-accent))] border-[rgb(var(--ns-accent))]' : 'border-slate-300'}`}>
                          {visibleKeys.has(col.key) && <Check className="w-3 h-3 text-white" />}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
