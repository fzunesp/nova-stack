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
  /** Field is auto-managed by PocketBase and cannot be edited by the user */
  readOnly?: boolean
}

export function useColumnPicker(entityKey: string, allColumns: ColumnDef[]) {
  const localStorageKey = `novastack-columns-${entityKey}`

  // Initial visibility keys loaded from localStorage or derived from defaults
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(localStorageKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          if (Array.isArray(parsed.visible)) {
            return new Set(parsed.visible)
          }
        } else if (Array.isArray(parsed)) {
          // Backward compatibility for old format [key1, key2...]
          return new Set(parsed)
        }
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

  // Initial column order loaded from localStorage
  const [customOrder, setCustomOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(localStorageKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          if (Array.isArray(parsed.order)) {
            return parsed.order
          }
        }
      }
    } catch (e) {
      console.error('Failed to parse column order from localStorage', e)
    }
    return []
  })

  // Persist to localStorage whenever settings change
  useEffect(() => {
    const settingsObj = {
      visible: Array.from(visibleKeys),
      order: customOrder
    }
    localStorage.setItem(localStorageKey, JSON.stringify(settingsObj))
  }, [visibleKeys, customOrder, localStorageKey])

  // Split standard pinned start columns (e.g. checkbox, expand), configurable, and stickyRight end columns (e.g. actions)
  const startColumns = useMemo(() => {
    return allColumns.filter(c => c.alwaysVisible && !c.stickyRight)
  }, [allColumns])

  const endColumns = useMemo(() => {
    return allColumns.filter(c => c.stickyRight)
  }, [allColumns])

  const configurableColumns = useMemo(() => {
    return allColumns.filter(c => !c.alwaysVisible && !c.stickyRight)
  }, [allColumns])

  // Merge the persistent custom order with all currently defined configurable columns
  const orderedConfigurableColumns = useMemo(() => {
    const ordered: ColumnDef[] = []
    const processed = new Set<string>()

    // 1. Position columns that have a saved custom order index
    for (const key of customOrder) {
      const col = configurableColumns.find(c => c.key === key)
      if (col) {
        ordered.push(col)
        processed.add(key)
      }
    }

    // 2. Append new columns that don't have a saved order yet (e.g. new custom fields)
    for (const col of configurableColumns) {
      if (!processed.has(col.key)) {
        ordered.push(col)
      }
    }

    return ordered
  }, [configurableColumns, customOrder])

  // Full ordered set of columns: Pinned start -> Ordered configurable -> Pinned end
  const orderedAllColumns = useMemo(() => {
    return [...startColumns, ...orderedConfigurableColumns, ...endColumns]
  }, [startColumns, orderedConfigurableColumns, endColumns])

  // Filter down to the columns that are visible (or always visible)
  const visibleColumns = useMemo(() => {
    return orderedAllColumns.filter(c => c.alwaysVisible || visibleKeys.has(c.key))
  }, [orderedAllColumns, visibleKeys])

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

  // Move a column left/right (or up/down in picker list)
  const moveColumn = useCallback((key: string, direction: 'up' | 'down') => {
    setCustomOrder(prev => {
      const currentConfigKeys = orderedConfigurableColumns.map(c => c.key)
      const index = currentConfigKeys.indexOf(key)
      if (index === -1) return prev

      const targetIndex = direction === 'up' ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= currentConfigKeys.length) return prev

      const nextKeys = [...currentConfigKeys]
      const temp = nextKeys[index]
      nextKeys[index] = nextKeys[targetIndex]
      nextKeys[targetIndex] = temp

      return nextKeys
    })
  }, [orderedConfigurableColumns])

  // Reset order and visibility to default settings
  const resetColumns = useCallback(() => {
    setVisibleKeys(new Set(
      allColumns
        .filter(c => c.alwaysVisible || (!c.isCustom && !c.defaultHidden))
        .map(c => c.key)
    ))
    setCustomOrder([])
  }, [allColumns])

  return {
    visibleKeys,
    visibleColumns,
    orderedConfigurableColumns,
    orderedAllColumns,
    toggleColumn,
    moveColumn,
    resetColumns
  }
}
