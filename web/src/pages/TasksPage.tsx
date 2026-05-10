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
import pb from '@/lib/pocketbase'
import { useMutation, useQueryClient } from '@tanstack/react-query'

const statusColors: Record<string, string> = { todo: 'bg-gray-100 text-gray-800', in_progress: 'bg-blue-100 text-blue-800', done: 'bg-green-100 text-green-800' }

export function TasksPage() {
  const queryClient = useQueryClient()
  const {
    items, totalItems, totalPages, page, perPage, search,
    isLoading, toggleSort, goToPage, updateSearch,
  } = usePaginatedQuery({ collection: 'tasks', searchFields: ['title'] })

  const [formData, setFormData] = useState({ title: '', description: '', status: 'todo', dueDate: '' })
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ title: '', description: '', status: 'todo', dueDate: '' })

  const createTask = useMutation({
    mutationFn: (data: typeof formData) => pb.collection('tasks').create({ ...data, dueDate: data.dueDate || null, userId: pb.authStore.record?.id }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tasks'] }); setFormData({ title: '', description: '', status: 'todo', dueDate: '' }); setCreating(false) },
  })

  const updateTask = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof editForm }) => pb.collection('tasks').update(id, { ...data, dueDate: data.dueDate || null }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tasks'] }); setEditing(null) },
  })

  const deleteTask = useMutation({
    mutationFn: (id: string) => pb.collection('tasks').delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  })

  if (isLoading) return (
    <div className="flex items-center justify-center h-48 text-slate-400 text-sm">Loading tasks...</div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Tasks</h2>
          <p className="text-sm text-slate-500 mt-0.5">{totalItems} task{totalItems !== 1 ? 's' : ''} total</p>
        </div>
        <Dialog open={creating} onOpenChange={setCreating}>
          <DialogTrigger asChild>
            <Button>Add Task</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add New Task</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); createTask.mutate(formData) }} className="space-y-4">
              <div className="space-y-2"><Label>Title</Label><Input placeholder="Task title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required /></div>
              <div className="space-y-2"><Label>Description</Label><Input placeholder="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
              <div className="space-y-2"><Label>Due Date</Label><Input type="date" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} /></div>
              <DialogFooter><Button type="submit" disabled={createTask.isPending}>Add Task</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => updateSearch(e.target.value)} placeholder="Search tasks..." className="pl-10" />
      </div>


      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wide">
          <div className="col-span-1"></div>
          <button className="col-span-5 flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort('title')}>
            Task <ArrowUpDown className="w-3 h-3" />
          </button>
          <button className="col-span-2 flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort('status')}>
            Status <ArrowUpDown className="w-3 h-3" />
          </button>
          <div className="col-span-2">Due</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-16 text-slate-400"><CheckSquare className="w-8 h-8 mx-auto mb-2 opacity-30" /><p className="text-sm">No tasks yet. Create your first task!</p></div>
        ) : (
          items.map((task: any) => (
            <div key={task.id} className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors items-center">
              <div className="col-span-1">
                <button
                  onClick={() => {
                    const next = task.status === 'todo' ? 'in_progress' : task.status === 'in_progress' ? 'done' : 'todo'
                    updateTask.mutate({ id: task.id, data: { title: task.title, description: task.description || '', status: next, dueDate: task.dueDate || '' } })
                  }}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${task.status === 'done' ? 'bg-green-500 border-green-500' : task.status === 'in_progress' ? 'border-blue-500' : 'border-gray-300'}`}
                >
                  {task.status === 'done' && <span className="text-white text-xs">✓</span>}
                </button>
              </div>
              <div className="col-span-5">
                <p className={`font-medium ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>{task.title}</p>
                {task.description && <p className="text-sm text-muted-foreground">{task.description}</p>}
              </div>
              <div className="col-span-2"><Badge className={statusColors[task.status]}>{task.status.replace('_', ' ')}</Badge></div>
              <div className="col-span-2 text-sm text-muted-foreground">{task.dueDate || '-'}</div>
              <div className="col-span-2 flex justify-end gap-1">
                <Dialog open={editing === task.id} onOpenChange={(open) => {
                  if (open) { setEditing(task.id); setEditForm({ title: task.title || '', description: task.description || '', status: task.status || 'todo', dueDate: task.dueDate || '' }) } else { setEditing(null) }
                }}>
                  <DialogTrigger asChild><Button variant="ghost" size="icon"><Pencil className="w-4 h-4" /></Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Edit Task</DialogTitle></DialogHeader>
                    <form onSubmit={(e) => { e.preventDefault(); updateTask.mutate({ id: task.id, data: editForm }) }} className="space-y-4">
                      <div className="space-y-2"><Label>Title</Label><Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} required /></div>
                      <div className="space-y-2"><Label>Description</Label><Input value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} /></div>
                      <div className="space-y-2"><Label>Status</Label>
                        <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="todo">To Do</SelectItem><SelectItem value="in_progress">In Progress</SelectItem><SelectItem value="done">Done</SelectItem></SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2"><Label>Due Date</Label><Input type="date" value={editForm.dueDate} onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })} /></div>
                      <DialogFooter><Button type="submit" disabled={updateTask.isPending}>Save</Button></DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
                <Button variant="ghost" size="icon" onClick={() => deleteTask.mutate(task.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
              </div>
            </div>
          ))
        )}
        <DataTablePagination page={page} totalPages={totalPages} totalItems={totalItems} perPage={perPage} onPageChange={goToPage} />
      </div>
    </div>
  )
}
