import { useState } from 'react'
import { Inbox, Search, Trash2, Pencil, ArrowUpDown } from 'lucide-react'
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
  new: 'bg-blue-100 text-blue-700',
  in_review: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-600',
  converted: 'bg-purple-100 text-purple-700',
}
const statusDots: Record<string, string> = {
  new: 'bg-blue-500',
  in_review: 'bg-amber-500',
  approved: 'bg-green-500',
  rejected: 'bg-red-400',
  converted: 'bg-purple-500',
}

export function IntakePage() {
  const location = useLocation()
  const queryClient = useQueryClient()
  const { items, totalItems, totalPages, page, perPage, search, isLoading, toggleSort, goToPage, updateSearch } =
    usePaginatedQuery({ collection: 'intake_submissions', searchFields: ['name', 'email'] })

  const [formData, setFormData] = useState({ name: '', email: '', message: '', budget: '', status: 'new' })
  const [creating, setCreating] = useState(location.state?.openCreate === true)
  const [editing, setEditing] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: '', email: '', message: '', budget: '', status: 'new' })

  const createSub = useMutation({
    mutationFn: (data: typeof formData) =>
      pb.collection('intake_submissions').create({ ...data, budget: parseFloat(data.budget) || 0, userId: pb.authStore.record?.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intake_submissions'] })
      setFormData({ name: '', email: '', message: '', budget: '', status: 'new' })
      setCreating(false)
      toast.success('Intake submission added')
    },
    onError: () => toast.error('Failed to add submission'),
  })

  const updateSub = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof editForm }) =>
      pb.collection('intake_submissions').update(id, { ...data, budget: parseFloat(data.budget) || 0 }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['intake_submissions'] }); setEditing(null); toast.success('Submission updated') },
    onError: () => toast.error('Failed to update submission'),
  })

  const deleteSub = useMutation({
    mutationFn: (id: string) => pb.collection('intake_submissions').delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['intake_submissions'] }); toast.success('Submission deleted') },
    onError: () => toast.error('Failed to delete submission'),
  })

  const statusOptions = ['new', 'in_review', 'approved', 'rejected', 'converted']

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Intake</h2>
          <p className="text-sm text-slate-500 mt-0.5">{totalItems} submission{totalItems !== 1 ? 's' : ''}</p>
        </div>
        <Dialog open={creating} onOpenChange={setCreating}>
          <DialogTrigger asChild><Button>Add Submission</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Intake Submission</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); createSub.mutate(formData) }} className="space-y-4">
              <div className="space-y-2"><Label>Name</Label><Input placeholder="Client name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div>
              <div className="space-y-2"><Label>Email</Label><Input type="email" placeholder="client@email.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required /></div>
              <div className="space-y-2"><Label>Message</Label><Input placeholder="Their message or notes" value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} /></div>
              <div className="space-y-2"><Label>Budget ($)</Label><Input type="number" placeholder="0" value={formData.budget} onChange={(e) => setFormData({ ...formData, budget: e.target.value })} /></div>
              <DialogFooter><Button type="submit" disabled={createSub.isPending}>Add Submission</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input value={search} onChange={(e) => updateSearch(e.target.value)} placeholder="Search submissions..." className="pl-10" />
      </div>

      {isLoading ? <TableSkeleton rows={5} /> : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wide">
            <button className="col-span-4 flex items-center gap-1 hover:text-slate-600" onClick={() => toggleSort('name')}>Name <ArrowUpDown className="w-3 h-3" /></button>
            <div className="col-span-3">Email</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-1">Budget</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-16">
              <Inbox className="w-10 h-10 mx-auto mb-3 text-slate-200" />
              <p className="text-sm font-medium text-slate-500 mb-4">No intake submissions yet</p>
              <Button size="sm" variant="outline" onClick={() => setCreating(true)}>Add first submission</Button>
            </div>
          ) : (
            items.map((sub: any) => (
              <div key={sub.id} className="group grid grid-cols-12 gap-4 px-4 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors items-center">
                <div className="col-span-4">
                  <p className="font-medium text-slate-900">{sub.name}</p>
                </div>
                <div className="col-span-3 text-sm text-slate-500 truncate">{sub.email}</div>
                <div className="col-span-2">
                  <Badge className={`${statusColors[sub.status]} inline-flex items-center gap-1.5 text-xs`}>
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusDots[sub.status]}`} />
                    {sub.status.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="col-span-1 text-sm text-slate-500">{sub.budget ? `$${sub.budget}` : '—'}</div>
                <div className="col-span-2 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Dialog open={editing === sub.id} onOpenChange={(open) => {
                    if (open) { setEditing(sub.id); setEditForm({ name: sub.name || '', email: sub.email || '', message: sub.message || '', budget: String(sub.budget || ''), status: sub.status || 'new' }) }
                    else setEditing(null)
                  }}>
                    <DialogTrigger asChild><Button variant="ghost" size="icon"><Pencil className="w-3.5 h-3.5" /></Button></DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Edit Submission</DialogTitle></DialogHeader>
                      <form onSubmit={(e) => { e.preventDefault(); updateSub.mutate({ id: sub.id, data: editForm }) }} className="space-y-4">
                        <div className="space-y-2"><Label>Name</Label><Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required /></div>
                        <div className="space-y-2"><Label>Email</Label><Input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} required /></div>
                        <div className="space-y-2"><Label>Message</Label><Input value={editForm.message} onChange={(e) => setEditForm({ ...editForm, message: e.target.value })} /></div>
                        <div className="space-y-2"><Label>Budget</Label><Input type="number" value={editForm.budget} onChange={(e) => setEditForm({ ...editForm, budget: e.target.value })} /></div>
                        <div className="space-y-2"><Label>Status</Label>
                          <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>{statusOptions.map((s) => <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <DialogFooter><Button type="submit" disabled={updateSub.isPending}>Save</Button></DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                  <Button variant="ghost" size="icon" onClick={() => { if (confirm('Delete this submission?')) deleteSub.mutate(sub.id) }}>
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
