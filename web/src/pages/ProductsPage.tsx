import { useState } from 'react'
import { Package, Search, Plus, Pencil, Trash2, Tag, Archive, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { usePaginatedQuery } from '@/hooks/usePaginatedQuery'
import { DataTablePagination } from '@/components/DataTablePagination'
import { TableSkeleton } from '@/components/ui/skeleton'
import pb from '@/lib/pocketbase'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useLocation } from 'react-router'
import { productService, isAppError } from '@/services'
import type { Status } from '@/services'

export function ProductsPage() {
  const location = useLocation()
  const queryClient = useQueryClient()
  const initialSearch = location.state?.search || ''
  
  const { items, totalItems, totalPages, page, perPage, search, isLoading, goToPage, updateSearch } =
    usePaginatedQuery({ collection: 'products', searchFields: ['name', 'sku'], initialSearch })

  const [formData, setFormData] = useState({ name: '', description: '', price: '', sku: '', status: 'active' as Status })
  const [creating, setCreating] = useState(location.state?.openCreate === true)
  const [editing, setEditing] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: '', description: '', price: '', sku: '', status: 'active' as Status })

  const actorId = pb.authStore.record?.id || ''

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) =>
      productService.create({ ...data, price: Number(data.price) }, actorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Product created')
      setCreating(false)
      setFormData({ name: '', description: '', price: '', sku: '', status: 'active' })
    },
    onError: (err: any) => toast.error(isAppError(err) ? err.message : 'Failed to create product'),
  })

  const updateMutation = useMutation({
    mutationFn: (data: typeof editForm) =>
      productService.update(editing!, { ...data, price: Number(data.price) }, actorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Product updated')
      setEditing(null)
    },
    onError: (err: any) => toast.error(isAppError(err) ? err.message : 'Failed to update product'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Product deleted')
    },
    onError: (err: any) => toast.error(isAppError(err) ? err.message : 'Failed to delete product'),
  })

  const handleCreate = (e: React.FormEvent) => { e.preventDefault(); createMutation.mutate(formData) }
  const handleEdit = (e: React.FormEvent) => { e.preventDefault(); updateMutation.mutate(editForm) }

  return (
    <div className="flex flex-col h-full bg-white relative">
      <div className="flex-none p-4 sm:p-6 border-b border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[rgb(var(--ns-accent))]/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <Package className="w-5 h-5 text-[rgb(var(--ns-accent))]" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Products & Services</h1>
              <p className="text-sm text-slate-500">Manage your catalog for invoicing</p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button onClick={() => setCreating(true)} className="flex-shrink-0 bg-[rgb(var(--ns-accent))] hover:bg-[rgb(var(--ns-accent-dk))] text-white shadow-sm">
              <Plus className="w-4 h-4 mr-2" /> Add
            </Button>
          </div>
        </div>
      </div>
      
      <div className="p-4 sm:p-6 pb-0">
        <div className="relative mb-4 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => updateSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col min-h-0">
          <div className="overflow-x-auto min-h-[300px]">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 border-b border-slate-200 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 font-semibold">Name & Description</th>
                  <th className="px-6 py-4 font-semibold">SKU</th>
                  <th className="px-6 py-4 font-semibold">Price</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <TableSkeleton rows={5} />
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                          <Package className="w-6 h-6 text-slate-400" />
                        </div>
                        <h3 className="text-sm font-medium text-slate-900">No products found</h3>
                        <p className="text-sm text-slate-500 mt-1">Get started by creating your first product or service.</p>
                        <Button onClick={() => setCreating(true)} variant="outline" size="sm" className="mt-4 text-[rgb(var(--ns-accent))] border-[rgb(var(--ns-accent))]/20 hover:bg-[rgb(var(--ns-accent))]/5">
                          <Plus className="w-4 h-4 mr-2" /> Add Product
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{item.name}</div>
                        {item.description && <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">{item.description}</div>}
                      </td>
                      <td className="px-6 py-4">
                        {item.sku ? (
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Tag className="w-3.5 h-3.5" />
                            <span className="font-mono text-xs">{item.sku}</span>
                          </div>
                        ) : <span className="text-slate-400">-</span>}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900">
                        ${item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4">
                        {item.status === 'active' ? (
                          <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200/50 font-medium">
                            <CheckCircle className="w-3 h-3 mr-1" /> Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-slate-200 font-medium">
                            <Archive className="w-3 h-3 mr-1" /> Archived
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-[rgb(var(--ns-accent))] hover:bg-[rgb(var(--ns-accent))]/10" onClick={() => {
                            setEditForm({ name: item.name, description: item.description, price: item.price.toString(), sku: item.sku, status: item.status })
                            setEditing(item.id)
                          }}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50" onClick={() => {
                            if (window.confirm('Are you sure you want to delete this product?')) deleteMutation.mutate(item.id)
                          }}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <DataTablePagination page={page} totalPages={totalPages} totalItems={totalItems} perPage={perPage} onPageChange={goToPage} />
        </div>
      </div>

      {/* Create/Edit Dialogs */}
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Product or Service</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>Name</Label>
                <Input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Website Design" />
              </div>
              <div className="space-y-2">
                <Label>Price ($)</Label>
                <Input required type="number" step="0.01" min="0" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label>SKU / Item Code</Label>
                <Input value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value })} placeholder="WD-001" />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Description</Label>
                <Input value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Custom website design and development" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setCreating(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending} className="bg-[rgb(var(--ns-accent))] hover:bg-[rgb(var(--ns-accent-dk))] text-white">
                {createMutation.isPending ? 'Creating...' : 'Create Product'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>Name</Label>
                <Input required value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
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
            <DialogFooter>
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
