import { useState } from 'react'
import { Inbox, Search, Trash2, Pencil, ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { usePaginatedQuery } from '@/hooks/usePaginatedQuery'
import { DataTablePagination } from '@/components/DataTablePagination'
import pb from '@/lib/pocketbase'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function IntakePage() {
  const queryClient = useQueryClient()
  const {
    items, totalItems, totalPages, page, perPage, search,
    isLoading, toggleSort, goToPage, updateSearch,
  } = usePaginatedQuery({ collection: 'intake_submissions', searchFields: ['name'] })

  const [formData, setFormData] = useState({ name: '', email: '', message: '', type: 'general' })
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: '', email: '', message: '', type: 'general', status: 'new' })

  const createSubmission = useMutation({
    mutationFn: (data: typeof formData) => pb.collection('intake_submissions').create({ ...data, status: 'new', source: 'internal', userId: pb.authStore.record?.id }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['intake_submissions'] }); setFormData({ name: '', email: '', message: '', type: 'general' }); setCreating(false) },
  })

  const updateSubmission = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof editForm }) => pb.collection('intake_submissions').update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['intake_submissions'] }); setEditing(null) },
  })

  const deleteSubmission = useMutation({
    mutationFn: (id: string) => pb.collection('intake_submissions').delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['intake_submissions'] }),
  })

  if (isLoading) return (
    <div className="flex items-center justify-center h-48 text-slate-400 text-sm">Loading submissions...</div>
  )

  const statusBadge = (status: string) => {
    const map: Record<string, string> = { new: 'bg-blue-100 text-blue-800', in_review: 'bg-yellow-100 text-yellow-800', approved: 'bg-green-100 text-green-800', rejected: 'bg-red-100 text-red-800', converted: 'bg-purple-100 text-purple-800' }
    return map[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Intake</h2>
          <p className="text-sm text-slate-500 mt-0.5">{totalItems} submission{totalItems !== 1 ? 's' : ''}</p>
        </div>
        <Dialog open={creating} onOpenChange={setCreating}>
          <DialogTrigger asChild>
            <Button>Add Submission</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add New Submission</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); createSubmission.mutate(formData) }} className="space-y-4">
              <div className="space-y-2"><Label>Name</Label><Input placeholder="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div>
              <div className="space-y-2"><Label>Email</Label><Input type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required /></div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="general">General</SelectItem><SelectItem value="vacation">Vacation</SelectItem><SelectItem value="reimbursement">Reimbursement</SelectItem><SelectItem value="hardware">Hardware</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Message</Label><Textarea placeholder="Message" value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} required rows={3} /></div>
              <DialogFooter><Button type="submit" disabled={createSubmission.isPending}>Add Submission</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => updateSearch(e.target.value)} placeholder="Search submissions..." className="pl-10" />
      </div>


      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wide">
          <button className="col-span-4 flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort('name')}>
            Name <ArrowUpDown className="w-3 h-3" />
          </button>
          <div className="col-span-3">Type</div>
          <div className="col-span-3">Status</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-16 text-slate-400"><Inbox className="w-8 h-8 mx-auto mb-2 opacity-30" /><p className="text-sm">No submissions yet.</p></div>
        ) : (
          items.map((sub: any) => (
            <div key={sub.id} className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors items-center">
              <div className="col-span-4">
                <p className="font-medium">{sub.name}</p>
                <p className="text-sm text-muted-foreground">{sub.email}</p>
              </div>
              <div className="col-span-3 text-sm text-muted-foreground">{sub.type}</div>
              <div className="col-span-3"><Badge className={statusBadge(sub.status)}>{sub.status}</Badge></div>
              <div className="col-span-2 flex justify-end gap-1">
                <Dialog open={editing === sub.id} onOpenChange={(open) => {
                  if (open) { setEditing(sub.id); setEditForm({ name: sub.name || '', email: sub.email || '', message: sub.message || '', type: sub.type || 'general', status: sub.status || 'new' }) } else { setEditing(null) }
                }}>
                  <DialogTrigger asChild><Button variant="ghost" size="icon"><Pencil className="w-4 h-4" /></Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Edit Submission</DialogTitle></DialogHeader>
                    <form onSubmit={(e) => { e.preventDefault(); updateSubmission.mutate({ id: sub.id, data: editForm }) }} className="space-y-4">
                      <div className="space-y-2"><Label>Name</Label><Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required /></div>
                      <div className="space-y-2"><Label>Email</Label><Input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} required /></div>
                      <div className="space-y-2"><Label>Type</Label>
                        <Select value={editForm.type} onValueChange={(v) => setEditForm({ ...editForm, type: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="general">General</SelectItem><SelectItem value="vacation">Vacation</SelectItem><SelectItem value="reimbursement">Reimbursement</SelectItem><SelectItem value="hardware">Hardware</SelectItem></SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2"><Label>Status</Label>
                        <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="new">New</SelectItem><SelectItem value="in_review">In Review</SelectItem><SelectItem value="approved">Approved</SelectItem><SelectItem value="rejected">Rejected</SelectItem><SelectItem value="converted">Converted</SelectItem></SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2"><Label>Message</Label><Textarea value={editForm.message} onChange={(e) => setEditForm({ ...editForm, message: e.target.value })} /></div>
                      <DialogFooter><Button type="submit" disabled={updateSubmission.isPending}>Save</Button></DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
                <Button variant="ghost" size="icon" onClick={() => deleteSubmission.mutate(sub.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
              </div>
            </div>
          ))
        )}
        <DataTablePagination page={page} totalPages={totalPages} totalItems={totalItems} perPage={perPage} onPageChange={goToPage} />
      </div>
    </div>
  )
}
