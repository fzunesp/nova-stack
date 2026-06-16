import { useQuery } from '@tanstack/react-query'
import pb from '@/lib/pocketbase'

interface NumberingConfig {
  enabled: boolean
  prefix: string
  padding: number
  suffix: string
  nextNumber?: number
}

interface NumberingSettings {
  companies?: NumberingConfig
  contacts?: NumberingConfig
  deals?: NumberingConfig
  tasks?: NumberingConfig
  invoices?: NumberingConfig
  products?: NumberingConfig
  intakes?: NumberingConfig
  employees?: NumberingConfig
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function useEntityNumberingPreview(entityKey: keyof NumberingSettings) {
  const collectionNameMap: Record<keyof NumberingSettings, string> = {
    companies: 'companies',
    contacts: 'contacts',
    deals: 'deals',
    tasks: 'tasks',
    invoices: 'invoices',
    products: 'products',
    intakes: 'intake_submissions',
    employees: 'employees',
  }

  const defaultPrefixes: Record<keyof NumberingSettings, string> = {
    companies: 'COM',
    contacts: 'CON',
    deals: 'DEL',
    tasks: 'TSK',
    invoices: 'INV',
    products: 'PRD',
    intakes: 'INT',
    employees: 'EMP',
  }

  const collectionName = collectionNameMap[entityKey]

  // Fetches the numbering settings record from app_settings.
  // queryKey is shared across all useEntityNumberingPreview instances so only one HTTP request is made.
  const settingsQuery = useQuery({
    queryKey: ['billing-settings'],
    queryFn: async () => {
      const records = await pb.collection('app_settings').getList(1, 1, { filter: 'category="numbering"' })
      if (records.items.length === 0) return null
      const record = records.items[0]
      const config = record?.config
      if (!config) return null
      // PocketBase JS SDK returns JSON fields already parsed as objects.
      // Guard against edge cases where it may still be a string.
      if (typeof config === 'string') {
        try {
          return JSON.parse(config) as NumberingSettings
        } catch {
          return null
        }
      }
      return config as NumberingSettings
    },
    staleTime: 60_000,
  })

  // Derive isEnabled directly from settings — no need to wait for previewQuery.
  // This avoids the two-step async gap that caused phantom "disabled" states.
  const entityConfig = settingsQuery.data?.[entityKey]
  const isEnabled = settingsQuery.isLoading ? false : (entityConfig?.enabled === true)

  // Fetches the next sequential number for this entity type.
  // Only runs when enabled so we don't waste requests for disabled entities.
  const previewQuery = useQuery({
    queryKey: ['next-number-preview', entityKey, entityConfig],
    queryFn: async () => {
      const prefix = entityConfig?.prefix !== undefined ? entityConfig.prefix : defaultPrefixes[entityKey]
      const padding = entityConfig?.padding !== undefined ? parseInt(String(entityConfig.padding)) || 4 : 4
      const suffix = entityConfig?.suffix !== undefined ? entityConfig.suffix : ''
      const configNextNumber = entityConfig?.nextNumber !== undefined ? parseInt(String(entityConfig.nextNumber)) || 1 : 1

      const records = await pb.collection(collectionName).getList(1, 1, {
        sort: '-created',
        filter: 'entity_numbering != ""',
        fields: 'entity_numbering',
      })

      let lastNumber = 0
      if (records.items.length > 0) {
        const val = records.items[0].getString('entity_numbering') || ''
        const pattern = '^' + escapeRegExp(prefix) + '-(\\d+)' + (suffix ? '-' + escapeRegExp(suffix) : '') + '$'
        const regex = new RegExp(pattern)
        const match = val.match(regex)
        if (match) {
          lastNumber = parseInt(match[1], 10) || 0
        }
      }

      const nextNumber = Math.max(configNextNumber, lastNumber + 1)
      const paddedNumber = String(nextNumber).padStart(padding, '0')
      return `${prefix}-${paddedNumber}${suffix ? '-' + suffix : ''}`
    },
    enabled: isEnabled,
    staleTime: 10_000,
  })

  return {
    isLoading: settingsQuery.isLoading,
    preview: previewQuery.data || '',
    isEnabled,
    refetch: () => {
      settingsQuery.refetch()
      previewQuery.refetch()
    }
  }
}
