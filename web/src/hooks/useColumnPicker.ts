import { useState, useEffect, useMemo, useCallback } from 'react'

export interface ColumnDef {
  key: string
  label: string
  width?: number
  flex?: boolean
  minWidth?: number
  sortField?: string
  isCustom?: boolean
  alwaysVisible?: boolean
  defaultHidden?: boolean
  /** Pin this column to the right edge; it will always render last */
  stickyRight?: boolean
}

export function useColumnPicker(entityKey: string, allColumns: ColumnDef[]) {
  const localStorageKey = `novastack-columns-${entityKey}`

  // Initial state from localStorage or default (all non-custom, non-hidden columns visible)
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(localStorageKey)
      if (saved) {
        return new Set(JSON.parse(saved))
      }
    } catch (e) {
      console.error('Failed to parse column settings from localStorage', e)
    }
    // Default: visible if alwaysVisible or (not custom and not defaultHidden)
    return new Set(
      allColumns
        .filter(c => c.alwaysVisible || (!c.isCustom && !c.defaultHidden))
        .map(c => c.key)
    )
  })

  // Persist to localStorage whenever visibleKeys changes
  useEffect(() => {
    localStorage.setItem(localStorageKey, JSON.stringify(Array.from(visibleKeys)))
  }, [visibleKeys, localStorageKey])

  // Toggle column visibility
  const toggleColumn = useCallback((key: string) => {
    setVisibleKeys(prev => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }, [])

  // Derived state: columns actually rendered — sticky-right columns always last
  const visibleColumns = useMemo(() => {
    const cols = allColumns.filter(c => c.alwaysVisible || visibleKeys.has(c.key))
    const normal = cols.filter(c => !c.stickyRight)
    const sticky = cols.filter(c => c.stickyRight)
    return [...normal, ...sticky]
  }, [allColumns, visibleKeys])

  return {
    visibleKeys,
    visibleColumns,
    toggleColumn
  }
}
