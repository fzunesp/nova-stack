import { useCustomFieldDefinitions } from '@/hooks/useCustomFields'
import { Badge } from '@/components/ui/badge'

interface DynamicCustomFieldsViewerProps {
  entityType: 'companies' | 'contacts' | 'deals' | 'tasks' | 'invoices' | 'products'
  values?: Record<string, any>
  layout?: 'grid' | 'list'
}

export function DynamicCustomFieldsViewer({
  entityType,
  values = {},
  layout = 'grid'
}: DynamicCustomFieldsViewerProps) {
  const { data: fields = [], isLoading } = useCustomFieldDefinitions(entityType)

  if (isLoading) return null

  // Filter active fields only
  const activeFields = fields.filter((f: any) => f.isActive)

  if (activeFields.length === 0) return null

  const isGrid = layout === 'grid'

  return (
    <div className="border-t border-slate-100 pt-6 mt-6">
      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
        Custom Attributes
      </h4>
      <div className={isGrid ? 'grid grid-cols-2 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100' : 'space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100'}>
        {activeFields.map((field: any) => {
          const val = values[field.key]
          const hasValue = val !== undefined && val !== null && val !== ''
          let displayVal = '—'

          if (hasValue) {
            if (field.type === 'checkbox') {
              displayVal = val ? 'Yes' : 'No'
            } else if (field.type === 'date') {
              try {
                displayVal = new Date(val).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })
              } catch {
                displayVal = String(val)
              }
            } else {
              displayVal = String(val)
            }
          }

          return (
            <div key={field.id} className="space-y-1">
              <span className="block text-[11px] font-medium text-slate-400">
                {field.name}
              </span>
              <span className="block text-xs font-bold text-slate-800">
                {field.type === 'checkbox' && hasValue ? (
                  <Badge className="bg-slate-200 text-slate-700 border-none text-[10px] px-1.5 py-0.5 font-bold">
                    {displayVal}
                  </Badge>
                ) : (
                  displayVal
                )}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
