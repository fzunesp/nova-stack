import { useState } from 'react'
import { useCustomFieldDefinitions, useCreateCustomField, useUpdateCustomField, useDeleteCustomField } from '@/hooks/useCustomFields'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Loader2, Plus, Edit, Trash2, Layers } from 'lucide-react'

const ENTITY_TYPES = [
  { id: 'companies', label: 'Companies' },
  { id: 'contacts', label: 'Contacts' },
  { id: 'deals', label: 'Deals' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'invoices', label: 'Invoices' },
  { id: 'products', label: 'Products' },
]

const FIELD_TYPES = [
  { id: 'text', label: 'Text Input' },
  { id: 'number', label: 'Number' },
  { id: 'select', label: 'Dropdown / Select' },
  { id: 'checkbox', label: 'Checkbox (Boolean)' },
  { id: 'date', label: 'Date Picker' },
]

export function CustomFieldsTab() {
  const [selectedEntity, setSelectedEntity] = useState<string>('companies')
  const { data: fields = [], isLoading } = useCustomFieldDefinitions(selectedEntity)
  
  const createField = useCreateCustomField()
  const updateField = useUpdateCustomField()
  const deleteField = useDeleteCustomField()

  const [open, setOpen] = useState(false)
  const [editingField, setEditingField] = useState<any>(null)

  // Form State
  const [name, setName] = useState('')
  const [key, setKey] = useState('')
  const [type, setType] = useState<any>('text')
  const [required, setRequired] = useState(false)
  const [isActive, setIsActive] = useState(true)
  const [optionsStr, setOptionsStr] = useState('')

  const handleOpen = (field?: any) => {
    if (field) {
      setEditingField(field)
      setName(field.name)
      setKey(field.key)
      setType(field.type)
      setRequired(!!field.required)
      setIsActive(!!field.isActive)
      setOptionsStr(field.options ? field.options.join('\n') : '')
    } else {
      setEditingField(null)
      setName('')
      setKey('')
      setType('text')
      setRequired(false)
      setIsActive(true)
      setOptionsStr('')
    }
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    setEditingField(null)
  }

  const handleNameChange = (val: string) => {
    setName(val)
    if (!editingField) {
      // Auto-generate key slug
      const slug = val
        .toLowerCase()
        .replace(/[^a-z0-9_]+/g, '_')
        .replace(/^_+|_+$/g, '')
      setKey(slug)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !key.trim()) return

    const parsedOptions = type === 'select'
      ? optionsStr.split('\n').map(o => o.trim()).filter(Boolean)
      : undefined

    if (editingField) {
      await updateField.mutateAsync({
        id: editingField.id,
        data: {
          name,
          required,
          isActive,
          options: parsedOptions,
        }
      })
    } else {
      // check duplicates locally first
      if (fields.some((f: any) => f.key === key)) {
        alert('A field with this key already exists for this entity.')
        return
      }

      await createField.mutateAsync({
        name,
        key,
        entityType: selectedEntity as any,
        type,
        required,
        isActive,
        options: parsedOptions,
      })
    }
    handleClose()
  }

  const handleToggleActive = async (field: any) => {
    await updateField.mutateAsync({
      id: field.id,
      data: { isActive: !field.isActive }
    })
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this custom field? Historical values on existing records will remain, but the field will no longer be shown in forms.')) {
      await deleteField.mutateAsync(id)
    }
  }

  const inputClass = 'w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ns-accent))] focus:border-transparent bg-white placeholder-slate-400'

  return (
    <div className="space-y-6">
      {/* Entity Selector Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-400" />
              <h3 className="font-semibold text-slate-900">Custom Fields Manager</h3>
            </div>
            <p className="text-sm text-slate-500 mt-1">Configure user-defined fields for CRM tables.</p>
          </div>
          <Button onClick={() => handleOpen()} size="sm" className="flex items-center gap-1.5 bg-[rgb(var(--ns-accent))] hover:bg-[rgb(var(--ns-accent-dk))] text-white">
            <Plus className="w-3.5 h-3.5" /> Add Field
          </Button>
        </div>

        <div className="border-b border-slate-100 bg-slate-50/50 p-2 flex gap-1 overflow-x-auto">
          {ENTITY_TYPES.map((entity) => (
            <button
              key={entity.id}
              type="button"
              onClick={() => setSelectedEntity(entity.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                selectedEntity === entity.id
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {entity.label}
            </button>
          ))}
        </div>

        {/* Custom Fields List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
          </div>
        ) : fields.length === 0 ? (
          <div className="text-center py-16">
            <Layers className="w-10 h-10 mx-auto mb-3 text-slate-200" />
            <p className="text-sm font-medium text-slate-500 mb-2">No custom fields defined for {ENTITY_TYPES.find(e => e.id === selectedEntity)?.label}</p>
            <Button onClick={() => handleOpen()} size="sm" variant="outline">Create your first custom field</Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wide bg-slate-50/50">
                  <th className="px-6 py-3">Label</th>
                  <th className="px-6 py-3">Key (DB Column)</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Validation</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {fields.map((field: any) => (
                  <tr key={field.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-slate-900">{field.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-mono">{field.key}</code>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className="bg-blue-50 text-blue-700 border-blue-100 text-[10px] uppercase font-semibold">
                        {FIELD_TYPES.find(t => t.id === field.type)?.label || field.type}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      {field.required ? (
                        <Badge className="bg-red-50 text-red-700 border-red-100 text-[10px] font-semibold">Required</Badge>
                      ) : (
                        <span className="text-xs text-slate-400">Optional</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(field)}
                        className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
                        title={field.isActive ? "Deactivate" : "Activate"}
                      >
                        {field.isActive ? (
                          <span className="inline-flex items-center gap-1.5 text-xs text-green-700 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                            Inactive
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          type="button"
                          onClick={() => handleOpen(field)}
                          className="h-8 w-8 text-slate-400 hover:text-slate-600"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          type="button"
                          onClick={() => handleDelete(field.id)}
                          className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Field Creator/Editor Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingField ? 'Edit Custom Field' : 'Add Custom Field'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            {/* Field Label */}
            <div className="space-y-1.5">
              <Label>Field Label (Name) *</Label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. VAT Registration Number"
                className={inputClass}
              />
            </div>

            {/* Field Key */}
            <div className="space-y-1.5">
              <Label>Field Key (Database Identifier) *</Label>
              <input
                type="text"
                required
                disabled={!!editingField}
                value={key}
                onChange={(e) => setKey(e.target.value.toLowerCase().replace(/[^a-z0-9_]+/g, '_'))}
                placeholder="e.g. vat_registration_number"
                className={`${inputClass} font-mono text-xs ${editingField ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : ''}`}
              />
              <p className="text-[10px] text-slate-400">Used under the hood. Can contain lowercase alphanumeric and underscores.</p>
            </div>

            {/* Field Type */}
            <div className="space-y-1.5">
              <Label>Field Type *</Label>
              {editingField ? (
                <input
                  type="text"
                  disabled
                  value={FIELD_TYPES.find(t => t.id === type)?.label || type}
                  className={`${inputClass} bg-slate-50 text-slate-400 cursor-not-allowed`}
                />
              ) : (
                <Select value={type} onValueChange={(val) => setType(val as any)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FIELD_TYPES.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Dropdown Options (Select Type Only) */}
            {type === 'select' && (
              <div className="space-y-1.5">
                <Label>Dropdown Options *</Label>
                <textarea
                  required
                  value={optionsStr}
                  onChange={(e) => setOptionsStr(e.target.value)}
                  placeholder="Enter one option per line..."
                  rows={4}
                  className={`${inputClass} font-sans`}
                />
                <p className="text-[10px] text-slate-400">List all choices, one option per line. Empty lines ignored.</p>
              </div>
            )}

            {/* Settings Toggles */}
            <div className="flex flex-col gap-3 pt-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="field-required"
                  checked={required}
                  onCheckedChange={(v) => setRequired(v === true)}
                />
                <Label htmlFor="field-required" className="text-sm font-medium text-slate-700 cursor-pointer">
                  Required field (validation checks on submission)
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="field-isActive"
                  checked={isActive}
                  onCheckedChange={(v) => setIsActive(v === true)}
                />
                <Label htmlFor="field-isActive" className="text-sm font-medium text-slate-700 cursor-pointer">
                  Active (visible on screens)
                </Label>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={handleClose}>Cancel</Button>
              <Button
                type="submit"
                disabled={createField.isPending || updateField.isPending}
                className="bg-[rgb(var(--ns-accent))] hover:bg-[rgb(var(--ns-accent-dk))] text-white"
              >
                {editingField ? 'Save Changes' : 'Create Field'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
