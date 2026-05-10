import { useState } from 'react'
import { FileText, Search, Trash2, Pencil, ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { usePaginatedQuery } from '@/hooks/usePaginatedQuery'
import { DataTablePagination } from '@/components/DataTablePagination'
import { TableSkeleton } from '@/components/ui/skeleton'
import pb from '@/lib/pocketbase'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useLocation } from 'react-router'

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-amber-100 text-amber-700',
  paid: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
}
const statusDots: Record<string, string> = {
  draft: 'bg-gray-400',
  sent: 'bg-amber-500',
  paid: 'bg-green-500',
  cancelled: 'bg-red-400',
}

export function InvoicesPage() {
  const location = useLocation()
  const queryClient = useQueryClient()
  const { items, totalItems, totalPages, page, perPage, search, isLoading, toggleSort, goToPage, updateSearch } =
    usePaginatedQuery({ collection: 'invoices', searchFields: ['title'] })

  const [formData, setFormData] = useState({ title: '', amount: '', status: 'draft', dueDate: '' })
  const [creating, setCreating] = useState(location.state?.openCreate === true)
  const [editing, setEditing] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ title: '', amount: '', status: 'draft', dueDate: '' })

  const createInvoice = useMutation({
    mutationFn: (data: typeof formData) =>
      pb.collection('invoices').create({ ...data, amount: parseFloat(data.amount) || 0, userId: pb.authStore.record?.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      setFormData({ title: '', amount: '', status: 'draft', dueDate: '' })
      setCreating(false)
      toast.success('Invoice created')
    },
    onError: () => toast.error('Failed to create invoice'),
  })

  const updateInvoice = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof editForm }) =>
      pb.collection('invoices').update(id, { ...data, amount: parseFloat(data.amount) || 0 }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['invoices'] }); setEditing(null); toast.success('Invoice updated') },
    onError: () => toast.error('Failed to update invoice'),
  })

  const deleteInvoice = useMutation({
    mutationFn: (id: string) => pb.collection('invoices').delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['invoices'] }); toast.success('Invoice deleted') },
    onError: () => toast.error('Failed to delete invoice'),
  })

  const allInvoices = items as any[]
  const totalOutstanding = allInvoices.filter((i) => i.status === 'sent' || i.status === 'draft').reduce((s, i) => s + (i.amount || 0), 0)
  const totalPaid = allInvoices.filter((i) => i.status === 'paid').reduce((s, i) => s + (i.amount || 0), 0)

  const statusOptions = ['draft', 'sent', 'paid', 'cancelled']

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Invoices</h2>
          <p className="text-sm text-slate-500 mt-0.5">{totalItems} invoice{totalItems !== 1 ? 's' : ''} total</p>
        </div>
        <Dialog open={creating} onOpenChange={setCreating}>
          <DialogTrigger asChild><Button>Add Invoice</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add New Invoice</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); createInvoice.mutate(formData) }} className="space-y-4">
              <div className="space-y-2"><Label>Title</Label><Input placeholder="Invoice title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required /></div>
              <div className="space-y-2"><Label>Amount ($)</Label><Input type="number" step="0.01" placeholder="0.00" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} /></div>
              <div className="space-y-2"><Label>Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{statusOptions.map((s) => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Due Date</Label><Input type="date" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} /></div>
              <DialogFooter><Button type="submit" disabled={createInvoice.isPending}>Add Invoice</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Outstanding</p>
          <p className="text-2xl font-bold text-indigo-600">${totalOutstanding.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Paid</p>
          <p className="text-2xl font-bold text-emerald-600">${totalPaid.toLocaleString()}</p>
        </div>
      </div>

      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input value={search} onChange={(e) => updateSearch(e.target.value)} placeholder="Search invoices..." className="pl-10" />
      </div>

      {isLoading ? <TableSkeleton rows={5} /> : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wide">
            <button className="col-span-5 flex items-center gap-1 hover:text-slate-600" onClick={() => toggleSort('title')}>Title <ArrowUpDown className="w-3 h-3" /></button>
            <button className="col-span-2 flex items-center gap-1 hover:text-slate-600" onClick={() => toggleSort('amount')}>Amount <ArrowUpDown className="w-3 h-3" /></button>
            <div className="col-span-3">Status</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="w-10 h-10 mx-auto mb-3 text-slate-200" />
              <p className="text-sm font-medium text-slate-500 mb-4">No invoices yet</p>
              <Button size="sm" variant="outline" onClick={() => setCreating(true)}>Create your first invoice</Button>
            </div>
          ) : (
            items.map((invoice: any) => (
              <div key={invoice.id} className="group grid grid-cols-12 gap-4 px-4 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors items-center">
                <div className="col-span-5 font-medium text-slate-900">{invoice.title}</div>
                <div className="col-span-2 text-sm font-semibold text-slate-700">${invoice.amount?.toLocaleString()}</div>
                <div className="col-span-3">
                  <Badge className={`${statusColors[invoice.status]} inline-flex items-center gap-1.5 text-xs`}>
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusDots[invoice.status]}`} />
                    {invoice.status}
                  </Badge>
                </div>
                <div className="col-span-2 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Dialog open={editing === invoice.id} onOpenChange={(open) => {
                    if (open) { setEditing(invoice.id); setEditForm({ title: invoice.title || '', amount: String(invoice.amount || ''), status: invoice.status || 'draft', dueDate: invoice.dueDate || '' }) }
                    else setEditing(null)
                  }}>
                    <DialogTrigger asChild><Button variant="ghost" size="icon"><Pencil className="w-3.5 h-3.5" /></Button></DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Edit Invoice</DialogTitle></DialogHeader>
                      <form onSubmit={(e) => { e.preventDefault(); updateInvoice.mutate({ id: invoice.id, data: editForm }) }} className="space-y-4">
                        <div className="space-y-2"><Label>Title</Label><Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} required /></div>
                        <div className="space-y-2"><Label>Amount ($)</Label><Input type="number" step="0.01" value={editForm.amount} onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })} /></div>
                        <div className="space-y-2"><Label>Status</Label>
                          <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>{statusOptions.map((s) => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2"><Label>Due Date</Label><Input type="date" value={editForm.dueDate} onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })} /></div>
                        <DialogFooter><Button type="submit" disabled={updateInvoice.isPending}>Save</Button></DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                  <Button variant="ghost" size="icon" onClick={() => { if (confirm('Delete this invoice?')) deleteInvoice.mutate(invoice.id) }}>
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </Button>
                </div>
              </div>
            ))
          )}
          <DataTablePagination page={page} totalPages={totalPages} totalItems={totalItems} perPage={perPage} onPageChange={goToPage} />
        </div>
      )}
    </div>
  )
}
