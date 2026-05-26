import { useState } from 'react'
import { Package, Search, Plus, Pencil, Trash2, HelpCircle } from 'lucide-react'
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

export function ProductsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const initialSearch = location.state?.search || ''
  
  const { items, totalItems, totalPages, page, perPage, search, isLoading, goToPage, updateSearch } =
    usePaginatedQuery({ collection: 'products', searchFields: ['name', 'sku'], initialSearch })

  const [formData, setFormData] = useState({ name: '', description: '', price: '', sku: '', status: 'active' as Status })
  const [creating, setCreating] = useState(location.state?.openCreate === true)
  const [editing, setEditing] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: '', description: '', price: '', sku: '', status: 'active' as Status })

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) =>
      pb.collection('products').create({ ...data, price: Number(data.price) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Product created')
      setCreating(false)
      setFormData({ name: '', description: '', price: '', sku: '', status: 'active' })
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

  const handleCreate = (e: React.FormEvent) => { e.preventDefault(); createMutation.mutate(formData) }
  const handleEdit = (e: React.FormEvent) => { e.preventDefault(); updateMutation.mutate(editForm) }

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
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs font-semibold text-slate-400 uppercase tracking-wide bg-white border-b border-slate-100">
              <tr>
                <th className="px-4 py-3 font-semibold">Name & Description</th>
                <th className="px-4 py-3 font-semibold">SKU</th>
                <th className="px-4 py-3 font-semibold">Price</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <TableRowSkeleton rows={5} />
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
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
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{item.name}</div>
                        {item.description && <div className="text-xs text-slate-400 mt-0.5 truncate">{item.description}</div>}
                      </td>
                      <td className="px-4 py-3">
                        {item.sku ? (
                          <span className="font-mono text-xs text-slate-500">{item.sku}</span>
                        ) : <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-slate-700">
                        ${item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={`${item.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'} inline-flex items-center gap-1.5 text-xs`}>
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${item.status === 'active' ? 'bg-green-500' : 'bg-slate-400'}`} />
                          {item.status === 'active' ? 'Active' : 'Archived'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => {
                            setEditForm({ name: item.name, description: item.description, price: item.price.toString(), sku: item.sku, status: item.status })
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
