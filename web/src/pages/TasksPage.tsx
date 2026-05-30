import { useState, useEffect } from 'react'
import { CheckSquare, Search, Trash2, Pencil, ArrowUpDown, HelpCircle, Kanban, List, Plus } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router'
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
import type { Status } from '@/services'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { DynamicCustomFieldsForm, validateCustomFields } from '@/components/DynamicCustomFieldsForm'
import { useCustomFieldDefinitions } from '@/hooks/useCustomFields'
import { useColumnPicker, type ColumnDef } from '@/hooks/useColumnPicker'
import { ColumnPicker } from '@/components/ColumnPicker'

const statusLabels: Record<Status, string> = {
  draft: 'Todo',
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

const boardStatuses = ['draft', 'active', 'pending', 'approved']

const columnHeaderStyles: Record<string, string> = {
  draft: 'bg-white border-gray-200 text-gray-600',
  active: 'bg-blue-50 border-blue-200 text-blue-700',
  pending: 'bg-amber-50 border-amber-200 text-amber-700',
  approved: 'bg-green-50 border-green-200 text-green-700',
}

export function TasksPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const initialSearch = location.state?.search || ''
  const [viewMode, setViewMode] = useState<'list' | 'board'>(() => {
    const saved = localStorage.getItem('tasks-view')
    return saved === 'board' ? 'board' : 'list'
  })

  useEffect(() => {
    localStorage.setItem('tasks-view', viewMode)
  }, [viewMode])
  const { items, totalItems, totalPages, page, perPage, search, isLoading, toggleSort, goToPage, updateSearch } =
    usePaginatedQuery({ collection: 'tasks', searchFields: ['title'], initialSearch })

  const { data: allTasks, isLoading: allTasksLoading } = useQuery({
    queryKey: ['tasks-all', search],
    queryFn: async () => {
      const filter = search ? `(title ~ "${search.trim()}")` : ''
      return pb.collection('tasks').getFullList({
        filter: filter || undefined,
        expand: 'contactId,dealId',
        sort: '-id'
      })
    },
    enabled: viewMode === 'board',
  })

  const emptyTaskForm = { title: '', description: '', status: 'draft' as Status, dueDate: '', contactId: '', dealId: '', customFields: {} as Record<string, any> }
  const [formData, setFormData] = useState(emptyTaskForm)
  const [creating, setCreating] = useState(location.state?.openCreate === true)
  const [editing, setEditing] = useState<string | null>(null)
  const [editForm, setEditForm] = useState(emptyTaskForm)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const { data: customFieldDefs = [] } = useCustomFieldDefinitions('tasks')

  const standardColumns: ColumnDef[] = [
    { key: 'checkbox', label: '', width: 40, alwaysVisible: true },
    { key: 'task', label: 'Task', flex: true, minWidth: 200, sortField: 'title' },
    { key: 'status', label: 'Status', width: 130, sortField: 'status' },
    { key: 'due', label: 'Due', width: 130 },
    { key: 'actions', label: 'Actions', width: 80, alwaysVisible: true, stickyRight: true }
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
  const { visibleKeys, visibleColumns, toggleColumn } = useColumnPicker('tasks', allColumns)

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
      setFormData(emptyTaskForm)
      setFormErrors({})
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
      setFormErrors({})
      toast.success('Task updated')
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to update task'),
  })

  const updateTaskStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Status }) =>
      pb.collection('tasks').update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      if (viewMode === 'board') {
        queryClient.invalidateQueries({ queryKey: ['tasks-all'] })
      }
    },
    onError: () => toast.error('Failed to update status'),
  })

  const deleteTask = useMutation({
    mutationFn: (id: string) => pb.collection('tasks').delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      if (viewMode === 'board') {
        queryClient.invalidateQueries({ queryKey: ['tasks-all'] })
      }
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

  const handleDragEnd = (result: any) => {
    const { destination, source, draggableId } = result
    if (!destination) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) return

    queryClient.setQueryData(['tasks-all', search], (prev: any) => {
      if (!prev) return prev
      return prev.map((t: any) => {
        if (t.id === draggableId) {
          return { ...t, status: destination.droppableId }
        }
        return t
      })
    })

    updateTaskStatus.mutate({ id: draggableId, status: destination.droppableId as Status })
  }

  const groupedTasks = boardStatuses.reduce((acc, status) => {
    acc[status] = (allTasks || []).filter((t: any) => t.status === status)
    return acc
  }, {} as Record<string, any[]>)

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validateCustomFields(customFieldDefs, formData.customFields || {})
    if (Object.keys(errs).length > 0) { setFormErrors(errs); toast.error('Fill required custom fields'); return }
    createTask.mutate(formData)
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validateCustomFields(customFieldDefs, editForm.customFields || {})
    if (Object.keys(errs).length > 0) { setFormErrors(errs); toast.error('Fill required custom fields'); return }
    if (editing) updateTask.mutate({ id: editing, data: editForm })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Tasks</h2>
          <p className="text-sm text-slate-500 mt-0.5">{totalItems} task{totalItems !== 1 ? 's' : ''} total</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/help?tab=tasks')}
            className="cursor-pointer flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-[rgb(var(--ns-accent))] bg-slate-50 hover:bg-[rgb(var(--ns-accent))]/10 border border-slate-200 hover:border-[rgb(var(--ns-accent))]/30 rounded-lg px-3 py-2 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Help
          </button>
          <Dialog open={creating} onOpenChange={(open) => {
            if (open) { setFormData(emptyTaskForm); setFormErrors({}); setCreating(true) }
            else { setCreating(false); setFormErrors({}) }
          }}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-1.5" />Add Task</Button></DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col p-0 overflow-hidden">
            <DialogHeader className="px-6 py-4 border-b border-slate-100 flex-shrink-0"><DialogTitle>Add New Task</DialogTitle></DialogHeader>
            <form onSubmit={handleCreateSubmit} className="flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
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

                <DynamicCustomFieldsForm entityType="tasks" values={formData.customFields || {}} onChange={(cf) => setFormData({ ...formData, customFields: cf })} errors={formErrors} />
              </div>
              <DialogFooter className="px-6 py-4 border-t border-slate-100 flex-shrink-0"><Button type="submit" disabled={createTask.isPending || !formData.contactId || !formData.dealId}>Add Task</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>

      <div className="flex items-center justify-between mb-4 gap-4">
        <div className="relative flex-1 max-w-md flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input value={search} onChange={(e) => updateSearch(e.target.value)} placeholder="Search tasks..." className="pl-10" />
          </div>
          <div className="flex items-center border border-slate-200 rounded-lg p-1 bg-white shadow-sm flex-shrink-0">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('board')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'board' ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              title="Board View"
            >
              <Kanban className="w-4 h-4" />
            </button>
          </div>
        </div>
        <ColumnPicker allColumns={allColumns} visibleKeys={visibleKeys} onToggle={toggleColumn} />
      </div>

      {viewMode === 'board' ? (
        allTasksLoading ? <TableSkeleton rows={3} /> : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="flex gap-4 h-[calc(100vh-280px)] overflow-hidden">
              {boardStatuses.map((status) => {
                const tasks = groupedTasks[status] || []
                return (
                  <div key={status} className="flex-1 min-w-[280px] flex flex-col">
                    <div className={`mb-3 p-3 rounded-xl border flex items-center justify-between font-bold text-xs uppercase tracking-wider ${columnHeaderStyles[status]}`}>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${statusDots[status as Status]}`} />
                        {statusLabels[status as Status]}
                      </div>
                      <Badge variant="outline" className="bg-white/50 border-none text-[10px] px-2">{tasks.length}</Badge>
                    </div>

                    <Droppable droppableId={status}>
                      {(provided, snapshot) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className={`flex-1 overflow-y-auto rounded-xl border-2 border-dashed p-3 transition-colors ${snapshot.isDraggingOver ? 'bg-slate-50 border-slate-300' : 'border-transparent'}`}
                        >
                          {tasks.map((task, index) => (
                            <Draggable key={task.id} draggableId={task.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-3 group hover:border-indigo-200 transition-all ${snapshot.isDragging ? 'shadow-lg rotate-2 scale-105 border-indigo-300 ring-2 ring-indigo-500/20' : ''}`}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                      <h4 className="font-bold text-slate-800 text-sm mb-1 truncate group-hover:text-indigo-600 transition-colors">{task.title}</h4>
                                      {task.expand?.contactId && (
                                        <p className="text-[11px] text-slate-500 font-medium truncate flex items-center gap-1">
                                          <span className="w-1 h-1 rounded-full bg-slate-300" />
                                          {task.expand.contactId.name}
                                        </p>
                                      )}
                                      {task.expand?.dealId && (
                                        <p className="text-[11px] text-indigo-500 font-semibold truncate flex items-center gap-1 mt-0.5">
                                          <span className="w-1 h-1 rounded-full bg-indigo-200" />
                                          {task.expand.dealId.title}
                                        </p>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                      <Dialog open={editing === task.id} onOpenChange={(open) => {
                                        if (open) {
                                          setFormErrors({});
                                          setEditing(task.id);
                                          setEditForm({
                                            title: task.title || '',
                                            description: task.description || '',
                                            status: task.status || 'draft',
                                            dueDate: task.dueDate || '',
                                            contactId: task.contactId || '',
                                            dealId: task.dealId || '',
                                            customFields: task.customFields || {}
                                          });
                                        } else {
                                          setEditing(null);
                                          setFormErrors({});
                                        }
                                      }}>
                                        <DialogTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-slate-600"><Pencil className="w-3 h-3" /></Button></DialogTrigger>
                                        <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col p-0 overflow-hidden">
                                          <DialogHeader className="px-6 py-4 border-b border-slate-100 flex-shrink-0"><DialogTitle>Edit Task</DialogTitle></DialogHeader>
                                          <form onSubmit={handleEditSubmit} className="flex flex-col min-h-0">
                                            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                                              <div className="space-y-2"><Label>Title</Label><Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} required /></div>
                                              <div className="space-y-2"><Label>Description</Label><Input value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} /></div>
                                              <div className="space-y-2"><Label>Due Date</Label><Input type="date" value={editForm.dueDate} onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })} /></div>

                                              <div className="space-y-2">
                                                <Label>Contact *</Label>
                                                <Select value={editForm.contactId} onValueChange={(v) => setEditForm({ ...editForm, contactId: v })} required>
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
                                              <DynamicCustomFieldsForm entityType="tasks" values={editForm.customFields || {}} onChange={(cf) => { setEditForm({ ...editForm, customFields: cf }); setFormErrors({}) }} errors={formErrors} />
                                            </div>
                                            <DialogFooter className="px-6 py-4 border-t border-slate-100 flex-shrink-0"><Button type="submit" disabled={updateTask.isPending || !editForm.contactId || !editForm.dealId}>Save</Button></DialogFooter>
                                          </form>
                                        </DialogContent>
                                      </Dialog>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-slate-400 hover:text-red-500"
                                        onClick={() => { if (confirm('Delete this task?')) deleteTask.mutate(task.id) }}
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>
                                  {task.dueDate && (
                                    <div className="mt-2 pt-1.5 border-t border-slate-100">
                                      <span className="text-[10px] text-slate-400">{task.dueDate}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                )
              })}
            </div>
          </DragDropContext>
        )
      ) : (
        isLoading ? <TableSkeleton rows={6} /> : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <div className="min-w-full divide-y divide-slate-100">
                <div className="flex items-center px-4 py-3 border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  {visibleColumns.map(col => {
                    const stickyClass = col.stickyRight ? 'sticky right-0 bg-white pl-4 z-10 shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.04)]' : ''
                    if (col.sortField) {
                      return (
                        <button 
                          key={col.key} 
                          style={col.flex ? { flex: 1, minWidth: col.minWidth } : { width: col.width }}
                          className={`flex items-center gap-1 hover:text-slate-600 text-left font-semibold uppercase animate-none ${stickyClass}`} 
                          onClick={() => toggleSort(col.sortField!)}
                        >
                          {col.label} <ArrowUpDown className="w-3 h-3" />
                        </button>
                      )
                    }
                    return (
                      <div 
                        key={col.key} 
                        style={col.flex ? { flex: 1, minWidth: col.minWidth } : { width: col.width }} 
                        className={`truncate ${stickyClass}`}
                      >
                        {col.label}
                      </div>
                    )
                  })}
                </div>

                {items.length === 0 ? (
                  <div className="text-center py-16">
                    <CheckSquare className="w-10 h-10 mx-auto mb-3 text-slate-200" />
                    <p className="text-sm font-medium text-slate-500 mb-4">No tasks yet</p>
                    <Button size="sm" variant="outline" onClick={() => setCreating(true)}>Create your first task</Button>
                  </div>
                ) : (
                  items.map((task: any) => (
                    <div key={task.id} className="group flex items-center px-4 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                      {visibleColumns.map(col => {
                        if (col.key === 'checkbox') {
                          return (
                            <div key={col.key} style={{ width: col.width }} className="flex items-center flex-shrink-0">
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
                              />
                            </div>
                          )
                        }
                        if (col.key === 'task') {
                          return (
                            <div key={col.key} style={{ flex: 1, minWidth: col.minWidth }} className="min-w-0 pr-4">
                              <span className={`font-medium text-slate-900 block truncate ${task.status === 'approved' ? 'line-through text-slate-400' : ''}`}>
                                {task.title}
                              </span>
                              {task.expand?.contactId && (
                                <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                                  <span>For:</span>
                                  <button onClick={(e) => { e.stopPropagation(); navigate(`/crm/contacts/${task.expand.contactId.id}`) }} className="text-indigo-500 hover:underline font-medium">
                                    {task.expand.contactId.name}
                                  </button>
                                  {task.expand.dealId && (
                                    <>
                                      <span className="text-slate-300">|</span>
                                      <button onClick={(e) => { e.stopPropagation(); navigate(`/crm/deals/${task.expand.dealId.id}`) }} className="text-indigo-500 hover:underline font-medium">
                                        {task.expand.dealId.title}
                                      </button>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        }
                        if (col.key === 'status') {
                          return (
                            <div key={col.key} style={{ width: col.width }} className="flex-shrink-0">
                              <Badge className={`${statusColors[task.status as Status] || statusColors.draft} inline-flex items-center gap-1.5 text-[10px] font-bold px-1.5 py-0.5`}>
                                <span className={`w-1 h-1 rounded-full ${statusDots[task.status as Status] || statusDots.draft}`} />
                                {statusLabels[task.status as Status] || task.status}
                              </Badge>
                            </div>
                          )
                        }
                        if (col.key === 'due') {
                          return (
                            <div key={col.key} style={{ width: col.width }} className="text-xs text-slate-500 flex-shrink-0">
                              {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}
                            </div>
                          )
                        }
                        if (col.key === 'actions') {
                          return (
                            <div key={col.key} style={{ width: col.width }} className="flex justify-end gap-1 flex-shrink-0 sticky right-0 bg-white pl-4 group-hover:bg-slate-50 z-10 shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.04)]">
                              <Dialog open={editing === task.id} onOpenChange={(open) => {
                                if (open) {
                                  setFormErrors({});
                                  setEditing(task.id);
                                  setEditForm({
                                    title: task.title || '',
                                    description: task.description || '',
                                    status: task.status || 'draft',
                                    dueDate: task.dueDate || '',
                                    contactId: task.contactId || '',
                                    dealId: task.dealId || '',
                                    customFields: task.customFields || {}
                                  });
                                } else {
                                  setEditing(null);
                                  setFormErrors({});
                                }
                              }}>
                                <DialogTrigger asChild><Button variant="ghost" size="icon"><Pencil className="w-3.5 h-3.5" /></Button></DialogTrigger>
                                <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col p-0 overflow-hidden">
                                  <DialogHeader className="px-6 py-4 border-b border-slate-100 flex-shrink-0"><DialogTitle>Edit Task</DialogTitle></DialogHeader>
                                  <form onSubmit={handleEditSubmit} className="flex flex-col min-h-0">
                                    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                                      <div className="space-y-2"><Label>Title</Label><Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} required /></div>
                                      <div className="space-y-2"><Label>Description</Label><Input value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} /></div>
                                      <div className="space-y-2"><Label>Due Date</Label><Input type="date" value={editForm.dueDate} onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })} /></div>

                                      <div className="space-y-2">
                                        <Label>Contact *</Label>
                                        <Select value={editForm.contactId} onValueChange={(v) => setEditForm({ ...editForm, contactId: v })} required>
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
                                        <Select value={editForm.dealId} onValueChange={(v) => setEditForm({ ...editForm, dealId: v })} required>
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

                                      <DynamicCustomFieldsForm entityType="tasks" values={editForm.customFields || {}} onChange={(cf) => { setEditForm({ ...editForm, customFields: cf }); setFormErrors({}) }} errors={formErrors} />
                                    </div>
                                    <DialogFooter className="px-6 py-4 border-t border-slate-100 flex-shrink-0"><Button type="submit" disabled={updateTask.isPending || !editForm.contactId || !editForm.dealId}>Save</Button></DialogFooter>
                                  </form>
                                </DialogContent>
                              </Dialog>
                              <Button variant="ghost" size="icon" onClick={() => { if (confirm('Delete this task?')) deleteTask.mutate(task.id) }}>
                                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                              </Button>
                            </div>
                          )
                        }

                        // Render custom fields dynamically
                        const rawVal = task.customFields?.[col.key]
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
                          <div key={col.key} style={{ width: col.width }} className="text-sm text-slate-500 truncate flex-shrink-0">
                            {fieldDef?.type === 'checkbox' && (rawVal !== undefined && rawVal !== null && rawVal !== '') ? (
                              <Badge className="bg-slate-200 text-slate-700 border-none text-[10px] px-1.5 py-0.5 font-bold">
                                {displayVal}
                              </Badge>
                            ) : (
                              displayVal
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ))
                )}
              </div>
            </div>
            <DataTablePagination page={page} totalPages={totalPages} totalItems={totalItems} perPage={perPage} onPageChange={goToPage} />
          </div>
        )
      )}
    </div>
  )
}
