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
import pb from '@/lib/pocketbase'
import { useMutation, useQueryClient } from '@tanstack/react-query'

const statusColors: Record<string, string> = { draft: 'bg-gray-100 text-gray-800', sent: 'bg-blue-100 text-blue-800', paid: 'bg-green-100 text-green-800', cancelled: 'bg-red-100 text-red-800' }

export function InvoicesPage() {
  const queryClient = useQueryClient()
  const {
    items, totalItems, totalPages, page, perPage, search,
    isLoading, toggleSort, goToPage, updateSearch,
  } = usePaginatedQuery({ collection: 'invoices', searchFields: ['title'] })

  const [formData, setFormData] = useState({ title: '', amount: '', status: 'draft', dueDate: '' })
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ title: '', amount: '', status: 'draft', dueDate: '' })

  const createInvoice = useMutation({
    mutationFn: (data: typeof formData) => pb.collection('invoices').create({ ...data, dueDate: data.dueDate || null, amount: parseFloat(data.amount) || 0, userId: pb.authStore.record?.id }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['invoices'] }); setFormData({ title: '', amount: '', status: 'draft', dueDate: '' }); setCreating(false) },
  })

  const updateInvoice = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof editForm }) => pb.collection('invoices').update(id, { ...data, dueDate: data.dueDate || null, amount: parseFloat(data.amount) || 0 }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['invoices'] }); setEditing(null) },
  })

  const deleteInvoice = useMutation({
    mutationFn: (id: string) => pb.collection('invoices').delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invoices'] }),
  })

  if (isLoading) return (
    <div className="flex items-center justify-center h-48 text-slate-400 text-sm">Loading invoices...</div>
  )

  const allInvoices = items as any[]
  const totalOutstanding = allInvoices?.filter((i) => i.status === 'sent').reduce((sum: number, i) => sum + (i.amount || 0), 0) || 0
  const totalPaid = allInvoices?.filter((i) => i.status === 'paid').reduce((sum: number, i) => sum + (i.amount || 0), 0) || 0

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Invoices</h2>
          <p className="text-sm text-slate-500 mt-0.5">{totalItems} invoice{totalItems !== 1 ? 's' : ''} total</p>
        </div>
        <Dialog open={creating} onOpenChange={setCreating}>
          <DialogTrigger asChild>
            <Button>Add Invoice</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add New Invoice</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); createInvoice.mutate(formData) }} className="space-y-4">
              <div className="space-y-2"><Label>Title</Label><Input placeholder="Invoice title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required /></div>
              <div className="space-y-2"><Label>Amount</Label><Input type="number" placeholder="Amount" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required /></div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="sent">Sent</SelectItem><SelectItem value="paid">Paid</SelectItem><SelectItem value="cancelled">Cancelled</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Due Date</Label><Input type="date" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} /></div>
              <DialogFooter><Button type="submit" disabled={createInvoice.isPending}>Add Invoice</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => updateSearch(e.target.value)} placeholder="Search invoices..." className="pl-10" />
      </div>


      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wide">
          <button className="col-span-5 flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort('title')}>
            Title <ArrowUpDown className="w-3 h-3" />
          </button>
          <button className="col-span-2 flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort('amount')}>
            Amount <ArrowUpDown className="w-3 h-3" />
          </button>
          <div className="col-span-3">Status</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-16 text-slate-400"><FileText className="w-8 h-8 mx-auto mb-2 opacity-30" /><p className="text-sm">No invoices yet.</p></div>
        ) : (
          items.map((invoice: any) => (
            <div key={invoice.id} className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors items-center">
              <div className="col-span-5 font-medium">{invoice.title}</div>
              <div className="col-span-2 text-sm text-muted-foreground">${invoice.amount?.toLocaleString()}</div>
              <div className="col-span-3"><Badge className={statusColors[invoice.status]}>{invoice.status}</Badge></div>
              <div className="col-span-2 flex justify-end gap-1">
                <Dialog open={editing === invoice.id} onOpenChange={(open) => {
                  if (open) { setEditing(invoice.id); setEditForm({ title: invoice.title || '', amount: String(invoice.amount || ''), status: invoice.status || 'draft', dueDate: invoice.dueDate || '' }) } else { setEditing(null) }
                }}>
                  <DialogTrigger asChild><Button variant="ghost" size="icon"><Pencil className="w-4 h-4" /></Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Edit Invoice</DialogTitle></DialogHeader>
                    <form onSubmit={(e) => { e.preventDefault(); updateInvoice.mutate({ id: invoice.id, data: editForm }) }} className="space-y-4">
                      <div className="space-y-2"><Label>Title</Label><Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} required /></div>
                      <div className="space-y-2"><Label>Amount</Label><Input type="number" value={editForm.amount} onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })} /></div>
                      <div className="space-y-2"><Label>Status</Label>
                        <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="sent">Sent</SelectItem><SelectItem value="paid">Paid</SelectItem><SelectItem value="cancelled">Cancelled</SelectItem></SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2"><Label>Due Date</Label><Input type="date" value={editForm.dueDate} onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })} /></div>
                      <DialogFooter><Button type="submit" disabled={updateInvoice.isPending}>Save</Button></DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
                <Button variant="ghost" size="icon" onClick={() => deleteInvoice.mutate(invoice.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
              </div>
            </div>
          ))
        )}
        <DataTablePagination page={page} totalPages={totalPages} totalItems={totalItems} perPage={perPage} onPageChange={goToPage} />
      </div>
    </div>
  )
}
