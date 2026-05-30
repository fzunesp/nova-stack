import { useState } from 'react'
import { Package, Search, Plus, Pencil, Trash2, HelpCircle, ArrowUpDown } from 'lucide-react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { usePaginatedQuery } from '@/hooks/usePaginatedQuery'
import { DataTablePagination } from '@/components/DataTablePagination'
import { TableRowSkeleton } from '@/components/ui/skeleton'
import pb from '@/lib/pocketbase'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useLocation } from 'react-router'
import type { Status } from '@/services'
import { DynamicCustomFieldsForm, validateCustomFields } from '@/components/DynamicCustomFieldsForm'
import { useCustomFieldDefinitions } from '@/hooks/useCustomFields'
import { useColumnPicker, type ColumnDef } from '@/hooks/useColumnPicker'
import { ColumnPicker } from '@/components/ColumnPicker'

export function ProductsPage() {
  console.log('ProductsPage: Rendering');
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const initialSearch = location.state?.search || ''
  
  const { items, totalItems, totalPages, page, perPage, search, isLoading, toggleSort, goToPage, updateSearch } =
    usePaginatedQuery({ collection: 'products', searchFields: ['name', 'sku'], initialSearch })

  console.log('ProductsPage: Items count', items.length);
  const [formData, setFormData] = useState({ name: '', description: '', price: '', sku: '', status: 'active' as Status, customFields: {} as Record<string, any> })
  const [creating, setCreating] = useState(location.state?.openCreate === true)
  const [editing, setEditing] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: '', description: '', price: '', sku: '', status: 'active' as Status, customFields: {} as Record<string, any> })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const { data: customFieldDefs = [] } = useCustomFieldDefinitions('products')

  const standardColumns: ColumnDef[] = [
    { key: 'name', label: 'Name & Description', flex: true, minWidth: 200, sortField: 'name' },
    { key: 'sku', label: 'SKU', width: 130, sortField: 'sku' },
    { key: 'price', label: 'Price', width: 130, sortField: 'price' },
    { key: 'status', label: 'Status', width: 120 },
    { key: 'actions', label: 'Actions', width: 100, alwaysVisible: true, stickyRight: true }
  ]

  const customColumns: ColumnDef[] = customFieldDefs.map((def: any) => ({
    key: def.key,
    label: def.name,
    width: 130,
    isCustom: true
  }))

  const standardData = standardColumns.filter(c => !c.stickyRight)
  const stickyActions = standardColumns.filter(c => c.stickyRight)
  const allColumns = [...standardData, ...customColumns, ...stickyActions]
  const { visibleKeys, visibleColumns, toggleColumn } = useColumnPicker('products', allColumns)

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) =>
      pb.collection('products').create({ ...data, price: Number(data.price) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Product created')
      setCreating(false)
      setFormData({ name: '', description: '', price: '', sku: '', status: 'active', customFields: {} })
      setFormErrors({})
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to create product'),
  })

  const updateMutation = useMutation({
    mutationFn: (data: typeof editForm) =>
      pb.collection('products').update(editing!, { ...data, price: Number(data.price) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Product updated')
      setEditing(null)
      setFormErrors({})
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to update product'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => pb.collection('products').delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Product deleted')
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to delete product'),
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validateCustomFields(customFieldDefs, formData.customFields || {})
    if (Object.keys(errs).length > 0) { setFormErrors(errs); toast.error('Fill required custom fields'); return }
    createMutation.mutate(formData)
  }

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validateCustomFields(customFieldDefs, editForm.customFields || {})
    if (Object.keys(errs).length > 0) { setFormErrors(errs); toast.error('Fill required custom fields'); return }
    updateMutation.mutate(editForm)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Products</h2>
          <p className="text-sm text-slate-500 mt-0.5">{totalItems} product{totalItems !== 1 ? 's' : ''} total</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/help?tab=products')}
            className="cursor-pointer flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-[rgb(var(--ns-accent))] bg-slate-50 hover:bg-[rgb(var(--ns-accent))]/10 border border-slate-200 hover:border-[rgb(var(--ns-accent))]/30 rounded-lg px-3 py-2 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Help
          </button>
          <Button onClick={() => setCreating(true)} className="flex-shrink-0 bg-[rgb(var(--ns-accent))] hover:bg-[rgb(var(--ns-accent-dk))] text-white shadow-sm">
            <Plus className="w-4 h-4 mr-1.5" /> Add Product
          </Button>
        </div>
      </div>
      
      <div className="flex items-center justify-between mb-4 gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => updateSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <ColumnPicker allColumns={allColumns} visibleKeys={visibleKeys} onToggle={toggleColumn} />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs font-semibold text-slate-400 uppercase tracking-wide bg-white border-b border-slate-100">
              <tr>
                {visibleColumns.map(col => {
                  const stickyClass = col.stickyRight ? 'sticky right-0 bg-white pl-4 z-10 shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.04)]' : ''
                  return (
                    <th key={col.key} className={`px-4 py-3 font-semibold ${stickyClass}`} style={col.flex ? { width: 'auto' } : { width: col.width }}>
                      {col.sortField ? (
                        <button onClick={() => toggleSort(col.sortField!)} className="flex items-center gap-1 hover:text-slate-600">
                          {col.label} <ArrowUpDown className="w-3 h-3" />
                        </button>
                      ) : col.label}
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <TableRowSkeleton rows={5} />
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumns.length} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Package className="w-10 h-10 mx-auto mb-3 text-slate-200" />
                      <p className="text-sm font-medium text-slate-500 mb-4">No products yet</p>
                      <Button onClick={() => setCreating(true)} variant="outline" size="sm">Add your first product</Button>
                    </div>
                  </td>
                </tr>
              ) : (
                  items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                      {visibleColumns.map(col => {
                        if (col.key === 'name') {
                          return (
                            <td key={col.key} className="px-4 py-3">
                              <div className="font-medium text-slate-900">{item.name}</div>
                              {item.description && <div className="text-xs text-slate-400 mt-0.5 truncate">{item.description}</div>}
                            </td>
                          )
                        }
                        if (col.key === 'sku') {
                          return (
                            <td key={col.key} className="px-4 py-3">
                              {item.sku ? (
                                <span className="font-mono text-xs text-slate-500">{item.sku}</span>
                              ) : <span className="text-slate-400">—</span>}
                            </td>
                          )
                        }
                        if (col.key === 'price') {
                          return (
                            <td key={col.key} className="px-4 py-3 text-sm font-semibold text-slate-700">
                              ${item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          )
                        }
                        if (col.key === 'status') {
                          return (
                            <td key={col.key} className="px-4 py-3">
                              <Badge className={`${item.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'} inline-flex items-center gap-1.5 text-xs`}>
                                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${item.status === 'active' ? 'bg-green-500' : 'bg-slate-400'}`} />
                                {item.status === 'active' ? 'Active' : 'Archived'}
                              </Badge>
                            </td>
                          )
                        }
                        if (col.key === 'actions') {
                          return (
                            <td key={col.key} className="px-4 py-3 text-right sticky right-0 bg-white group-hover:bg-slate-50 z-10 shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.04)]">
                              <div className="flex items-center justify-end gap-1 transition-opacity">
                                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => {
                                  setFormErrors({})
                                  setEditForm({ name: item.name, description: item.description, price: item.price.toString(), sku: item.sku, status: item.status, customFields: item.customFields || {} })
                                  setEditing(item.id)
                                }}>
                                  <Pencil className="w-3.5 h-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => {
                                  if (window.confirm('Delete this product?')) deleteMutation.mutate(item.id)
                                }}>
                                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                </Button>
                              </div>
                            </td>
                          )
                        }

                        // Render custom fields
                        const rawVal = item.customFields?.[col.key]
                        const fieldDef = customFieldDefs.find((f: any) => f.key === col.key)
                        let displayVal = '—'
                        if (rawVal !== undefined && rawVal !== null && rawVal !== '') {
                          if (fieldDef?.type === 'checkbox') {
                            displayVal = rawVal ? 'Yes' : 'No'
                          } else if (fieldDef?.type === 'date') {
                            try {
                              displayVal = new Date(rawVal).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })
                            } catch {
                              displayVal = String(rawVal)
                            }
                          } else {
                            displayVal = String(rawVal)
                          }
                        }

                        return (
                          <td key={col.key} className="px-4 py-3 text-sm text-slate-500 truncate">
                            {fieldDef?.type === 'checkbox' && (rawVal !== undefined && rawVal !== null && rawVal !== '') ? (
                              <Badge className="bg-slate-200 text-slate-700 border-none text-[10px] px-1.5 py-0.5 font-bold">
                                {displayVal}
                              </Badge>
                            ) : (
                              displayVal
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <DataTablePagination page={page} totalPages={totalPages} totalItems={totalItems} perPage={perPage} onPageChange={goToPage} />
        </div>

      {/* Create/Edit Dialogs */}
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="px-6 py-4 border-b border-slate-100 flex-shrink-0">
            <DialogTitle>Add Product or Service</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label>Name</Label>
                  <Input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="New Product Name" />
                </div>
                <div className="space-y-2">
                  <Label>Price ($)</Label>
                  <Input required type="number" step="0.01" min="0" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} placeholder="0.00" />
                </div>
                <div className="space-y-2">
                  <Label>SKU / Item Code</Label>
                  <Input value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value })} placeholder="SKU-001" />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Description</Label>
                  <Input value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Product description..." />
                </div>
              </div>
              <DynamicCustomFieldsForm entityType="products" values={formData.customFields || {}} onChange={(cf) => { setFormData({ ...formData, customFields: cf }); setFormErrors({}) }} errors={formErrors} />
            </div>
            <DialogFooter className="px-6 py-4 border-t border-slate-100 flex-shrink-0 bg-slate-50/50">
              <Button type="button" variant="ghost" onClick={() => setCreating(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending} className="bg-[rgb(var(--ns-accent))] hover:bg-[rgb(var(--ns-accent-dk))] text-white">
                {createMutation.isPending ? 'Creating...' : 'Create Product'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(o) => { if (!o) { setEditing(null); setFormErrors({}) } }}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="px-6 py-4 border-b border-slate-100 flex-shrink-0">
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label>Name</Label>
                  <Input required value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} placeholder="Edit Product Name" />
                </div>
                <div className="space-y-2">
                  <Label>Price ($)</Label>
                  <Input required type="number" step="0.01" min="0" value={editForm.price} onChange={e => setEditForm({ ...editForm, price: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>SKU / Item Code</Label>
                  <Input value={editForm.sku} onChange={e => setEditForm({ ...editForm, sku: e.target.value })} />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Description</Label>
                  <Input value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Status</Label>
                  <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v as Status })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DynamicCustomFieldsForm entityType="products" values={editForm.customFields || {}} onChange={(cf) => { setEditForm({ ...editForm, customFields: cf }); setFormErrors({}) }} errors={formErrors} />
            </div>
            <DialogFooter className="px-6 py-4 border-t border-slate-100 flex-shrink-0 bg-slate-50/50">
              <Button type="button" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
              <Button type="submit" disabled={updateMutation.isPending} className="bg-[rgb(var(--ns-accent))] hover:bg-[rgb(var(--ns-accent-dk))] text-white">
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
