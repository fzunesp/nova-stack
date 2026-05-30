import { useCustomFieldDefinitions } from '@/hooks/useCustomFields'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

interface DynamicCustomFieldsFormProps {
  entityType: 'companies' | 'contacts' | 'deals' | 'tasks' | 'invoices' | 'products'
  values: Record<string, any>
  onChange: (values: Record<string, any>) => void
  errors?: Record<string, string>
}

export function validateCustomFields(definitions: any[], values: Record<string, any>): Record<string, string> {
  const errors: Record<string, string> = {}
  definitions.forEach(field => {
    if (field.isActive && field.required) {
      const val = values[field.key]
      if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0) || val === false) {
        errors[field.key] = `${field.name} is required`
      }
    }
  })
  return errors
}

export function DynamicCustomFieldsForm({
  entityType,
  values,
  onChange,
  errors = {}
}: DynamicCustomFieldsFormProps) {
  const { data: fields = [], isLoading } = useCustomFieldDefinitions(entityType)
  
  // Filter active fields only
  const activeFields = fields.filter((f: any) => f.isActive)

  if (isLoading || activeFields.length === 0) {
    return null
  }

  const handleFieldChange = (key: string, value: any) => {
    onChange({
      ...values,
      [key]: value
    })
  }

  return (
    <div className="border-t border-slate-100 pt-6 mt-6">
      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">
        Custom Attributes
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {activeFields.map((field: any) => {
          const val = values[field.key] ?? ''
          const hasError = !!errors[field.key]

          return (
            <div key={field.id} className="space-y-1.5 flex flex-col justify-end">
              {field.type !== 'checkbox' && (
                <Label className="flex items-center gap-1">
                  {field.name}
                  {field.required && <span className="text-red-500">*</span>}
                </Label>
              )}

              {field.type === 'text' && (
                <Input
                  type="text"
                  value={val}
                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                  placeholder={`Enter ${field.name.toLowerCase()}`}
                  className={hasError ? 'border-red-300 focus:ring-red-500 bg-red-50/50' : ''}
                />
              )}

              {field.type === 'number' && (
                <Input
                  type="number"
                  value={val}
                  onChange={(e) => handleFieldChange(field.key, e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder={`Enter ${field.name.toLowerCase()}`}
                  className={hasError ? 'border-red-300 focus:ring-red-500 bg-red-50/50' : ''}
                />
              )}

              {field.type === 'date' && (
                <Input
                  type="date"
                  value={val}
                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                  className={hasError ? 'border-red-300 focus:ring-red-500 bg-red-50/50' : ''}
                />
              )}

              {field.type === 'checkbox' && (
                <div className={`flex items-center gap-2 py-2.5 px-2 rounded-md ${hasError ? 'bg-red-50 border border-red-200' : ''}`}>
                  <Checkbox
                    id={`custom-${field.key}`}
                    checked={!!val}
                    onCheckedChange={(checked) => handleFieldChange(field.key, checked === true)}
                  />
                  <Label htmlFor={`custom-${field.key}`} className="text-sm font-medium text-slate-700 cursor-pointer flex items-center gap-1">
                    {field.name}
                    {field.required && <span className="text-red-500">*</span>}
                  </Label>
                </div>
              )}

              {field.type === 'select' && (
                <Select
                  value={val || undefined}
                  onValueChange={(value) => handleFieldChange(field.key, value)}
                >
                  <SelectTrigger className={`w-full ${hasError ? 'border-red-300 focus:ring-red-500 bg-red-50/50' : ''}`}>
                    <SelectValue placeholder={`Select ${field.name.toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {(field.options || []).map((opt: string) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {hasError && (
                <span className="text-[10px] font-bold text-red-500 mt-0.5 animate-in fade-in slide-in-from-top-1">
                  {errors[field.key]}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
