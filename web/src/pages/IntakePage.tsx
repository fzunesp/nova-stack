import { useState } from 'react'
import { Inbox, Search, Trash2, Pencil, ArrowUpDown, CheckCircle2, XCircle, Clock, User, MessageSquare } from 'lucide-react'
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
import { intakeService, isAppError } from '@/services'
import type { Status } from '@/services'

const statusLabels: Record<Status, string> = {
  draft: 'New',
  active: 'In review',
  pending: 'Pending decision',
  approved: 'Approved',
  rejected: 'Rejected',
  archived: 'Archived',
  lead: 'Lead',
  inactive: 'Inactive',
}

const statusColors: Record<Status, string> = {
  draft: 'bg-blue-100 text-blue-700',
  active: 'bg-amber-100 text-amber-700',
  pending: 'bg-purple-100 text-purple-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-600',
  archived: 'bg-slate-100 text-slate-500',
  lead: 'bg-blue-100 text-blue-700',
  inactive: 'bg-slate-100 text-slate-500',
}

const statusDots: Record<Status, string> = {
  draft: 'bg-blue-500',
  active: 'bg-amber-500',
  pending: 'bg-purple-500',
  approved: 'bg-green-500',
  rejected: 'bg-red-400',
  archived: 'bg-slate-400',
  lead: 'bg-blue-500',
  inactive: 'bg-slate-400',
}

const typeLabels: Record<string, string> = {
  general: 'General',
  vacation: 'Vacation',
  reimbursement: 'Reimbursement',
  hardware: 'Hardware',
}

export function IntakePage() {
  const location = useLocation()
  const queryClient = useQueryClient()
  const initialSearch = location.state?.search || ''
  const { items, totalItems, totalPages, page, perPage, search, isLoading, toggleSort, goToPage, updateSearch } =
    usePaginatedQuery({ collection: 'intake_submissions', searchFields: ['name', 'email'], initialSearch })

  const [formData, setFormData] = useState({
    name: '', email: '', message: '',
    type: '' as '' | 'general' | 'vacation' | 'reimbursement' | 'hardware',
    source: '' as '' | 'external' | 'internal',
    status: '' as '' | Status,
  })
  const [creating, setCreating] = useState(location.state?.openCreate === true)
  const [editing, setEditing] = useState<string | null>(null)
  const [selectedSub, setSelectedSub] = useState<any | null>(null)
  const [editForm, setEditForm] = useState({
    name: '', email: '', message: '',
    type: '' as '' | 'general' | 'vacation' | 'reimbursement' | 'hardware',
    source: '' as '' | 'external' | 'internal',
    status: '' as '' | Status,
  })

  const actorId = pb.authStore.record?.id || ''

  const createSub = useMutation({
    mutationFn: (data: typeof formData) =>
      intakeService.create({ ...data, type: data.type as any, source: data.source as any, status: (data.status || 'draft') as Status, userId: pb.authStore.record?.id }, actorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intake_submissions'] })
      setFormData({ name: '', email: '', message: '', type: '', source: '', status: '' })
      setCreating(false)
      toast.success('Intake submission added')
    },
    onError: (err) => toast.error(isAppError(err) ? err.message : 'Failed to add submission'),
  })

  const updateSub = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof editForm }) =>
      intakeService.update(id, { ...data, type: data.type as any, source: data.source as any, status: data.status as Status }, actorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intake_submissions'] })
      setEditing(null)
      toast.success('Submission updated')
    },
    onError: (err) => toast.error(isAppError(err) ? err.message : 'Failed to update submission'),
  })

  const deleteSub = useMutation({
    mutationFn: (id: string) => intakeService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intake_submissions'] })
      toast.success('Submission deleted')
    },
    onError: () => toast.error('Failed to delete submission'),
  })

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
            <form onSubmit={(e) => { e.preventDefault(); createSub.mutate(formData as any) }} className="space-y-4">
              <div className="space-y-2"><Label>Name *</Label><Input placeholder="Client name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div>
              <div className="space-y-2"><Label>Email *</Label><Input type="email" placeholder="client@email.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required /></div>
              <div className="space-y-2"><Label>Message</Label><Input placeholder="Their message or notes" value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} /></div>
              <div className="space-y-2"><Label>Type *</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v as any })}>
                  <SelectTrigger className={!formData.type ? 'border-red-200' : ''}><SelectValue placeholder="— Select type —" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(typeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Source *</Label>
                <Select value={formData.source} onValueChange={(v) => setFormData({ ...formData, source: v as any })}>
                  <SelectTrigger className={!formData.source ? 'border-red-200' : ''}><SelectValue placeholder="— Select source —" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="external">External</SelectItem>
                    <SelectItem value="internal">Internal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Status *</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as any })}>
                  <SelectTrigger className={!formData.status ? 'border-red-200' : ''}><SelectValue placeholder="— Select status —" /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(statusLabels) as Status[]).map((s) => (
                      <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter><Button type="submit" disabled={createSub.isPending || !formData.type || !formData.source || !formData.status}>Add Submission</Button></DialogFooter>
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
            <div className="col-span-1">Type</div>
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
              <div
                key={sub.id}
                onClick={() => setSelectedSub(sub)}
                className="group grid grid-cols-12 gap-4 px-4 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50/80 transition-colors items-center cursor-pointer"
              >
                <div className="col-span-4">
                  <p className="font-medium text-slate-900">{sub.name}</p>
                </div>
                <div className="col-span-3 text-sm text-slate-500 truncate">{sub.email}</div>
                <div className="col-span-2">
                  <Badge className={`${statusColors[sub.status as Status] || statusColors.draft} inline-flex items-center gap-1.5 text-xs`}>
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusDots[sub.status as Status] || statusDots.draft}`} />
                    {statusLabels[sub.status as Status] || sub.status}
                  </Badge>
                </div>
                <div className="col-span-1 text-sm text-slate-500">{typeLabels[sub.type] || sub.type || '—'}</div>
                <div
                  className="col-span-2 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Dialog open={editing === sub.id} onOpenChange={(open) => {
                    if (open) { setEditing(sub.id); setEditForm({ name: sub.name || '', email: sub.email || '', message: sub.message || '', type: sub.type || 'general', source: sub.source || 'external', status: sub.status || 'draft' }) }
                    else setEditing(null)
                  }}>
                    <DialogTrigger asChild><Button variant="ghost" size="icon"><Pencil className="w-3.5 h-3.5" /></Button></DialogTrigger>
                    <DialogContent onClick={(e) => e.stopPropagation()}>
                      <DialogHeader><DialogTitle>Edit Submission</DialogTitle></DialogHeader>
                      <form onSubmit={(e) => { e.preventDefault(); updateSub.mutate({ id: sub.id, data: editForm }) }} className="space-y-4">
                        <div className="space-y-2"><Label>Name</Label><Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required /></div>
                        <div className="space-y-2"><Label>Email</Label><Input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} required /></div>
                        <div className="space-y-2"><Label>Message</Label><Input value={editForm.message} onChange={(e) => setEditForm({ ...editForm, message: e.target.value })} /></div>
                        <div className="space-y-2"><Label>Type</Label>
                          <Select value={editForm.type} onValueChange={(v) => setEditForm({ ...editForm, type: v as typeof editForm.type })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {Object.entries(typeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2"><Label>Source</Label>
                          <Select value={editForm.source} onValueChange={(v) => setEditForm({ ...editForm, source: v as typeof editForm.source })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="external">External</SelectItem>
                              <SelectItem value="internal">Internal</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2"><Label>Status</Label>
                          <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v as Status })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {(Object.keys(statusLabels) as Status[]).map((s) => (
                                <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>
                              ))}
                            </SelectContent>
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

      {selectedSub && (
        <IntakeDetailDialog
          sub={selectedSub}
          onClose={() => setSelectedSub(null)}
          onUpdate={() => {
            queryClient.invalidateQueries({ queryKey: ['intake_submissions'] })
            // Update the locally selected item details so the UI shifts status instantly
            pb.collection('intake_submissions').getOne(selectedSub.id).then((freshSub) => setSelectedSub(freshSub)).catch(() => {})
          }}
        />
      )}
    </div>
  )
}

function IntakeDetailDialog({ sub, onClose, onUpdate }: { sub: any; onClose: () => void; onUpdate: () => void }) {
  const [decisionNote, setDecisionNote] = useState('')
  const [deciding, setDeciding] = useState(false)

  const handleDecision = async (status: 'approved' | 'rejected') => {
    setDeciding(true)
    try {
      await pb.collection('intake_submissions').update(sub.id, {
        status,
        decisionNote,
        decidedAt: new Date().toISOString(),
      })
      toast.success(`Submission marked as ${status}`)
      onUpdate()
    } catch (e) {
      toast.error('Failed to update submission decision')
      console.error(e)
    } finally {
      setDeciding(false)
    }
  }

  const dateString = new Date(sub.created).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const decidedDateString = sub.decidedAt ? new Date(sub.decidedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }) : ''

  return (
    <Dialog open={true} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-slate-900">
            <Inbox className="w-5 h-5 text-indigo-500" />
            Intake Details
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0">
          {/* Main Bento Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex items-start gap-3">
              <User className="w-5 h-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Submitter</p>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">{sub.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{sub.email}</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex items-start gap-3">
              <Clock className="w-5 h-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Submission Date</p>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">{dateString}</p>
                <p className="text-xs text-slate-500 mt-0.5">Source: <span className="capitalize font-medium">{sub.source}</span></p>
              </div>
            </div>
          </div>

          {/* Type & Status */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Submission Type</p>
              <p className="text-sm font-semibold text-slate-800 capitalize mt-0.5">{typeLabels[sub.type] || sub.type}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 text-right mb-1">Status</p>
              <Badge className={`${statusColors[sub.status as Status] || statusColors.draft} inline-flex items-center gap-1.5 text-xs`}>
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusDots[sub.status as Status] || statusDots.draft}`} />
                {statusLabels[sub.status as Status] || sub.status}
              </Badge>
            </div>
          </div>

          {/* Message */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Message / Request Body</p>
            <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 min-h-[80px]">
              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {sub.message || <span className="italic text-slate-400">No message provided.</span>}
              </p>
            </div>
          </div>

          {/* Decision Section */}
          {['approved', 'rejected'].includes(sub.status) ? (
            <div className={`p-4 rounded-xl border space-y-3 ${sub.status === 'approved' ? 'bg-emerald-50/50 border-emerald-100' : 'bg-red-50/50 border-red-100'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {sub.status === 'approved' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600" />
                  )}
                  <span className={`text-xs font-bold uppercase tracking-wider ${sub.status === 'approved' ? 'text-emerald-800' : 'text-red-800'}`}>
                    Decision Details
                  </span>
                </div>
                {decidedDateString && (
                  <span className="text-[10px] text-slate-400 font-medium">{decidedDateString}</span>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Decision Note</p>
                <div className="bg-white rounded-lg p-3 border border-slate-100 shadow-sm text-slate-700 text-xs leading-relaxed italic whitespace-pre-wrap">
                  {sub.decisionNote || 'No decision note recorded.'}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-indigo-50/30 border border-indigo-100/60 p-4 rounded-xl space-y-3.5">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                  Take Decision
                </span>
              </div>
              
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Decision Note / Reason *</Label>
                <textarea
                  value={decisionNote}
                  onChange={(e) => setDecisionNote(e.target.value)}
                  placeholder="Enter reason or instructions for approval or rejection..."
                  className="w-full min-h-[80px] p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs text-slate-700 placeholder-slate-400 transition-all shadow-sm"
                />
              </div>

              <div className="flex gap-2 justify-end pt-1">
                <Button
                  size="sm"
                  onClick={() => handleDecision('rejected')}
                  disabled={deciding || !decisionNote.trim()}
                  className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 px-3 flex items-center gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" /> Reject
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleDecision('approved')}
                  disabled={deciding || !decisionNote.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 flex items-center gap-1.5 shadow-sm"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
