import { useState } from 'react'
import { CheckSquare, Search, Trash2, Pencil, ArrowUpDown } from 'lucide-react'
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
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useLocation } from 'react-router'
import type { Status } from '@/services'

const statusLabels: Record<Status, string> = {
  draft: 'Not started',
  active: 'In progress',
  pending: 'Waiting',
  approved: 'Done',
  rejected: 'Cancelled',
  archived: 'Archived',
  lead: 'Lead',
  inactive: 'Inactive',
  converted: 'Converted',
}

const statusColors: Record<Status, string> = {
  draft: 'bg-gray-100 text-gray-700',
  active: 'bg-blue-100 text-blue-700',
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-600',
  archived: 'bg-slate-100 text-slate-500',
  lead: 'bg-blue-100 text-blue-700',
  inactive: 'bg-slate-100 text-slate-500',
  converted: 'bg-violet-100 text-violet-700',
}

const statusDots: Record<Status, string> = {
  draft: 'bg-gray-400',
  active: 'bg-blue-500',
  pending: 'bg-amber-500',
  approved: 'bg-green-500',
  rejected: 'bg-red-400',
  archived: 'bg-slate-400',
  lead: 'bg-blue-500',
  inactive: 'bg-slate-400',
  converted: 'bg-violet-500',
}

export function TasksPage() {
  const location = useLocation()
  const queryClient = useQueryClient()
  const initialSearch = location.state?.search || ''
  const { items, totalItems, totalPages, page, perPage, search, isLoading, toggleSort, goToPage, updateSearch } =
    usePaginatedQuery({ collection: 'tasks', searchFields: ['title'], initialSearch })

  const [formData, setFormData] = useState({ title: '', description: '', status: 'draft' as Status, dueDate: '', contactId: '', dealId: '' })
  const [creating, setCreating] = useState(location.state?.openCreate === true)
  const [editing, setEditing] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ title: '', description: '', status: 'draft' as Status, dueDate: '', contactId: '', dealId: '' })

  const { data: contacts } = useQuery({
    queryKey: ['allContacts'],
    queryFn: () => pb.collection('contacts').getFullList({ sort: 'name' })
  })

  const { data: deals } = useQuery({
    queryKey: ['allDeals'],
    queryFn: () => pb.collection('deals').getFullList({ sort: 'title' })
  })

  const createTask = useMutation({
    mutationFn: (data: typeof formData) =>
      pb.collection('tasks').create({ ...data, dueDate: data.dueDate || undefined, userId: pb.authStore.record?.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      setFormData({ title: '', description: '', status: 'draft', dueDate: '', contactId: '', dealId: '' })
      setCreating(false)
      toast.success('Task created')
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to create task'),
  })

  const updateTask = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof editForm }) =>
      pb.collection('tasks').update(id, { ...data, dueDate: data.dueDate || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      setEditing(null)
      toast.success('Task updated')
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to update task'),
  })

  const deleteTask = useMutation({
    mutationFn: (id: string) => pb.collection('tasks').delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Task deleted')
    },
    onError: () => toast.error('Failed to delete task'),
  })

  const cycleStatus = useMutation({
    mutationFn: ({ id, currentStatus }: { id: string; currentStatus: Status }) => {
      const cycle: Status[] = ['draft', 'active', 'approved']
      const next = cycle[(cycle.indexOf(currentStatus) + 1) % cycle.length] ?? 'draft'
      return pb.collection('tasks').update(id, { status: next })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
    onError: () => toast.error('Failed to update status'),
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Tasks</h2>
          <p className="text-sm text-slate-500 mt-0.5">{totalItems} task{totalItems !== 1 ? 's' : ''} total</p>
        </div>
        <Dialog open={creating} onOpenChange={setCreating}>
          <DialogTrigger asChild><Button>Add Task</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add New Task</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); createTask.mutate(formData) }} className="space-y-4">
              <div className="space-y-2"><Label>Title</Label><Input placeholder="Task title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required /></div>
              <div className="space-y-2"><Label>Description</Label><Input placeholder="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
              <div className="space-y-2"><Label>Due Date</Label><Input type="date" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} /></div>
              
              <div className="space-y-2">
                <Label>Contact *</Label>
                <Select value={formData.contactId} onValueChange={(v) => setFormData({ ...formData, contactId: v })} required>
                  <SelectTrigger className={!formData.contactId ? 'border-red-200' : ''}>
                    <SelectValue placeholder="Select a contact" />
                  </SelectTrigger>
                  <SelectContent>
                    {contacts?.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Deal *</Label>
                <Select value={formData.dealId} onValueChange={(v) => setFormData({ ...formData, dealId: v })} required>
                  <SelectTrigger className={!formData.dealId ? 'border-red-200' : ''}>
                    <SelectValue placeholder="Select a deal" />
                  </SelectTrigger>
                  <SelectContent>
                    {deals?.map((d: any) => (
                      <SelectItem key={d.id} value={d.id}>{d.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter><Button type="submit" disabled={createTask.isPending || !formData.contactId || !formData.dealId}>Add Task</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input value={search} onChange={(e) => updateSearch(e.target.value)} placeholder="Search tasks..." className="pl-10" />
      </div>

      {isLoading ? <TableSkeleton rows={6} /> : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wide">
            <div className="col-span-1" />
            <button className="col-span-5 flex items-center gap-1 hover:text-slate-600" onClick={() => toggleSort('title')}>Task <ArrowUpDown className="w-3 h-3" /></button>
            <button className="col-span-2 flex items-center gap-1 hover:text-slate-600" onClick={() => toggleSort('status')}>Status <ArrowUpDown className="w-3 h-3" /></button>
            <div className="col-span-2">Due</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-16">
              <CheckSquare className="w-10 h-10 mx-auto mb-3 text-slate-200" />
              <p className="text-sm font-medium text-slate-500 mb-4">No tasks yet</p>
              <Button size="sm" variant="outline" onClick={() => setCreating(true)}>Create your first task</Button>
            </div>
          ) : (
            items.map((task: any) => (
              <div key={task.id} className="group grid grid-cols-12 gap-4 px-4 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors items-center">
                {/* Circular quick-status toggle */}
                <div className="col-span-1 flex items-center">
                  <button
                    title="Cycle status: To Do → In Progress → Done"
                    onClick={() => cycleStatus.mutate({ id: task.id, currentStatus: task.status as Status })}
                    className={`w-5 h-5 rounded-full border-2 flex-shrink-0 transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                      task.status === 'approved'
                        ? 'bg-green-500 border-green-500'
                        : task.status === 'active'
                        ? 'border-blue-500 bg-transparent'
                        : 'border-slate-300 bg-transparent'
                    }`}
                    style={task.status === 'approved' ? {} : task.status === 'active' ? { boxShadow: 'inset 0 0 0 2px rgb(59 130 246 / 0.3)' } : {}}
                  />
                </div>
                <div className="col-span-5">
                  <p className={`font-medium ${task.status === 'approved' ? 'line-through text-slate-400' : 'text-slate-900'}`}>{task.title}</p>
                  {task.description && <p className="text-xs text-slate-400 mt-0.5 truncate">{task.description}</p>}
                </div>
                <div className="col-span-2">
                  <Badge className={`${statusColors[task.status as Status] || statusColors.draft} inline-flex items-center gap-1.5 text-xs`}>
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusDots[task.status as Status] || statusDots.draft}`} />
                    {statusLabels[task.status as Status] || task.status}
                  </Badge>
                </div>
                <div className="col-span-2 text-sm text-slate-400">{task.dueDate || '—'}</div>
                <div className="col-span-2 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Dialog open={editing === task.id} onOpenChange={(open) => {
                    if (open) { setEditing(task.id); setEditForm({ title: task.title || '', description: task.description || '', status: task.status || 'draft', dueDate: task.dueDate || '', contactId: task.contactId || '', dealId: task.dealId || '' }) }
                    else setEditing(null)
                  }}>
                    <DialogTrigger asChild><Button variant="ghost" size="icon"><Pencil className="w-3.5 h-3.5" /></Button></DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Edit Task</DialogTitle></DialogHeader>
                      <form onSubmit={(e) => { e.preventDefault(); updateTask.mutate({ id: task.id, data: editForm }) }} className="space-y-4">
                        <div className="space-y-2"><Label>Title</Label><Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} required /></div>
                        <div className="space-y-2"><Label>Description</Label><Input value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} /></div>
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
                        <div className="space-y-2"><Label>Due Date</Label><Input type="date" value={editForm.dueDate} onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })} /></div>
                        
                        <div className="space-y-2">
                          <Label>Contact *</Label>
                          <Select value={editForm.contactId} onValueChange={(v) => setEditForm({ ...editForm, contactId: v })}>
                            <SelectTrigger className={!editForm.contactId ? 'border-red-200' : ''}>
                              <SelectValue placeholder="Select a contact" />
                            </SelectTrigger>
                            <SelectContent>
                              {contacts?.map((c: any) => (
                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Deal *</Label>
                          <Select value={editForm.dealId} onValueChange={(v) => setEditForm({ ...editForm, dealId: v })}>
                            <SelectTrigger className={!editForm.dealId ? 'border-red-200' : ''}>
                              <SelectValue placeholder="Select a deal" />
                            </SelectTrigger>
                            <SelectContent>
                              {deals?.map((d: any) => (
                                <SelectItem key={d.id} value={d.id}>{d.title}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <DialogFooter><Button type="submit" disabled={updateTask.isPending || !editForm.contactId || !editForm.dealId}>Save</Button></DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                  <Button variant="ghost" size="icon" onClick={() => { if (confirm('Delete this task?')) deleteTask.mutate(task.id) }}>
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
