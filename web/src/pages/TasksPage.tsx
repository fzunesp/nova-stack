import { useState, useEffect } from 'react'
import { CheckSquare, Search, Trash2, Pencil, ArrowUpDown, HelpCircle, Kanban, List, Plus, Hash } from 'lucide-react'
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
import { useEntityNumberingPreview } from '@/hooks/useEntityNumberingPreview'
import { toast } from 'sonner'
import type { Status } from '@/services'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { DynamicCustomFieldsForm, validateCustomFields } from '@/components/DynamicCustomFieldsForm'
import { useCustomFieldDefinitions } from '@/hooks/useCustomFields'
import { useColumnPicker, type ColumnDef } from '@/hooks/useColumnPicker'
import { ColumnPicker } from '@/components/ColumnPicker'
import { cn } from '@/lib/utils'

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
    usePaginatedQuery({ 
      collection: 'tasks', 
      searchFields: ['title'], 
      initialSearch,
      expand: 'contactId,dealId,assigneeId'
    })

  const { data: allTasks, isLoading: allTasksLoading } = useQuery({
    queryKey: ['tasks-all', search],
    queryFn: async () => {
      const filter = search ? `(title ~ "${search.trim()}")` : ''
      return pb.collection('tasks').getFullList({
        filter: filter || undefined,
        expand: 'contactId,dealId,assigneeId',
        sort: '-id'
      })
    },
    enabled: viewMode === 'board',
  })

  const emptyTaskForm = { title: '', description: '', status: 'draft' as Status, dueDate: '', contactId: '', dealId: '', assigneeId: '', customFields: {} as Record<string, any> }
  const [formData, setFormData] = useState(emptyTaskForm)
  const [creating, setCreating] = useState(location.state?.openCreate === true)
  const [editing, setEditing] = useState<string | null>(null)
  const [editForm, setEditForm] = useState(emptyTaskForm)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const { data: customFieldDefs = [] } = useCustomFieldDefinitions('tasks')

  const { preview: taskPreview, isEnabled: showAutoNumber } = useEntityNumberingPreview('tasks')

  const standardColumns: ColumnDef[] = [
    { key: 'checkbox', label: '', width: 40, alwaysVisible: true },
    { key: 'task', label: 'Task Title', flex: true, minWidth: 200, sortField: 'title' },
    { key: 'description', label: 'Description', width: 180, defaultHidden: true },
    { key: 'assignee', label: 'Assignee', width: 150 },
    { key: 'status', label: 'Status', width: 130, sortField: 'status' },
    { key: 'priority', label: 'Priority', width: 110, defaultHidden: true, sortField: 'priority' },
    { key: 'due', label: 'Due Date', width: 130, sortField: 'dueDate' },
    { key: 'contact', label: 'Linked Contact', width: 150, defaultHidden: true },
    { key: 'deal', label: 'Linked Deal', width: 150, defaultHidden: true },
    { key: 'created', label: 'Created At', width: 150, defaultHidden: true, sortField: 'created', readOnly: true },
    { key: 'updated', label: 'Updated At', width: 150, defaultHidden: true, sortField: 'updated', readOnly: true },
    { key: 'actions', label: 'Actions', width: 80, alwaysVisible: true, stickyRight: true }
  ]

  const customColumns: ColumnDef[] = customFieldDefs.map((def: any) => ({
    key: def.key,
    label: def.name,
    width: 130,
    isCustom: true
  }))

  const { 
    visibleKeys, 
    visibleColumns, 
    orderedAllColumns, 
    toggleColumn, 
    moveColumn, 
    resetColumns 
  } = useColumnPicker('tasks', [...standardColumns, ...customColumns])

  const { data: contacts } = useQuery({
    queryKey: ['allContacts'],
    queryFn: () => pb.collection('contacts').getFullList({ sort: 'name' })
  })

  const { data: deals } = useQuery({
    queryKey: ['allDeals'],
    queryFn: () => pb.collection('deals').getFullList({ sort: 'title' })
  })

  const { data: employees } = useQuery({
    queryKey: ['allEmployees'],
    queryFn: () => pb.collection('employees').getFullList({ sort: 'name' })
  })

  const createTask = useMutation({
    mutationFn: (data: typeof formData) =>
      pb.collection('tasks').create({ 
        ...data, 
        dueDate: data.dueDate || undefined, 
        userId: pb.authStore.record?.id // creator remains userId for now, or we can use created_by
      }),
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
          <DialogTrigger asChild><Button className="flex-shrink-0 bg-[rgb(var(--ns-accent))] hover:bg-[rgb(var(--ns-accent-dk))] text-white shadow-sm font-bold"><Plus className="w-4 h-4 mr-1.5" />Add Task</Button></DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col p-0 overflow-hidden">
            <DialogHeader className="px-6 py-4 border-b border-slate-100 flex-shrink-0"><DialogTitle>Add New Task</DialogTitle></DialogHeader>
            <form onSubmit={handleCreateSubmit} className="flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
                {showAutoNumber && (
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Task Number <span className="font-normal normal-case text-slate-400">(auto-generated)</span></Label>
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 h-10">
                      <Hash className="w-4 h-4 text-slate-400" />
                      <span className="font-mono text-sm text-slate-700">{taskPreview || 'TSK-0001'}</span>
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Title *</Label>
                  <Input placeholder="What needs to be done?" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required className="h-10" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Due Date</Label>
                    <Input type="date" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} className="h-10" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Assignee</Label>
                    <Select value={formData.assigneeId} onValueChange={(v) => setFormData({ ...formData, assigneeId: v })}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select member" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees?.map((e: any) => (
                          <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Description</Label>
                  <Input placeholder="Additional details..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="h-10" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Contact *</Label>
                    <Select value={formData.contactId} onValueChange={(v) => setFormData({ ...formData, contactId: v })} required>
                      <SelectTrigger className={cn("h-10", !formData.contactId && 'border-red-200')}>
                        <SelectValue placeholder="Link contact" />
                      </SelectTrigger>
                      <SelectContent>
                        {contacts?.map((c: any) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Deal *</Label>
                    <Select value={formData.dealId} onValueChange={(v) => setFormData({ ...formData, dealId: v })} required>
                      <SelectTrigger className={cn("h-10", !formData.dealId && 'border-red-200')}>
                        <SelectValue placeholder="Link deal" />
                      </SelectTrigger>
                      <SelectContent>
                        {deals?.map((d: any) => (
                          <SelectItem key={d.id} value={d.id}>{d.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="pt-2">
                  <DynamicCustomFieldsForm entityType="tasks" values={formData.customFields || {}} onChange={(cf) => setFormData({ ...formData, customFields: cf })} errors={formErrors} />
                </div>
              </div>
              <DialogFooter className="px-6 py-4 border-t border-slate-100 flex-shrink-0 bg-slate-50/50">
                <Button type="submit" disabled={createTask.isPending || !formData.contactId || !formData.dealId} className="font-bold bg-indigo-600 hover:bg-indigo-700">Add Task</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>

      <div className="flex items-center justify-between mb-4 gap-4">
        <div className="relative flex-1 max-w-md flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input value={search} onChange={(e) => updateSearch(e.target.value)} placeholder="Search tasks..." className="pl-10 h-10 shadow-sm" />
          </div>
          <div className="flex items-center border border-slate-200 rounded-lg p-1 bg-white shadow-sm flex-shrink-0">
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "p-1.5 rounded-md transition-all",
                viewMode === 'list' ? 'bg-slate-100 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
              )}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('board')}
              className={cn(
                "p-1.5 rounded-md transition-all",
                viewMode === 'board' ? 'bg-slate-100 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
              )}
              title="Board View"
            >
              <Kanban className="w-4 h-4" />
            </button>
          </div>
        </div>
        <ColumnPicker 
          orderedAllColumns={orderedAllColumns} 
          visibleKeys={visibleKeys} 
          onToggle={toggleColumn}
          onMove={moveColumn}
          onReset={resetColumns}
        />
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
                                      <div className="flex flex-col gap-1">
                                        {task.expand?.contactId && (
                                          <p className="text-[11px] text-slate-500 font-medium truncate flex items-center gap-1">
                                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                                            {task.expand.contactId.name}
                                          </p>
                                        )}
                                        {task.expand?.dealId && (
                                          <p className="text-[11px] text-indigo-500 font-semibold truncate flex items-center gap-1">
                                            <span className="w-1 h-1 rounded-full bg-indigo-200" />
                                            {task.expand.dealId.title}
                                          </p>
                                        )}
                                        {task.expand?.assigneeId && (
                                          <div className="flex items-center gap-1.5 mt-1.5">
                                            <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-500">
                                              {task.expand.assigneeId.name.charAt(0)}
                                            </div>
                                            <span className="text-[10px] text-slate-400 font-medium">{task.expand.assigneeId.name}</span>
                                          </div>
                                        )}
                                      </div>
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
                                            assigneeId: task.assigneeId || '',
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
                                            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
                                              {showAutoNumber && (
                                                <div className="space-y-2">
                                                  <Label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Task Number</Label>
                                                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 h-10">
                                                    <Hash className="w-4 h-4 text-slate-400" />
                                                    <span className="font-mono text-sm text-slate-700">{task.entity_numbering || '—'}</span>
                                                  </div>
                                                </div>
                                              )}
                                              <div className="space-y-2"><Label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Title *</Label><Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} required className="h-10" /></div>
                                              
                                              <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                  <Label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Due Date</Label>
                                                  <Input type="date" value={editForm.dueDate} onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })} className="h-10" />
                                                </div>
                                                <div className="space-y-2">
                                                  <Label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Assignee</Label>
                                                  <Select value={editForm.assigneeId} onValueChange={(v) => setEditForm({ ...editForm, assigneeId: v })}>
                                                    <SelectTrigger className="h-10">
                                                      <SelectValue placeholder="Select member" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                      {employees?.map((e: any) => (
                                                        <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                                                      ))}
                                                    </SelectContent>
                                                  </Select>
                                                </div>
                                              </div>

                                              <div className="space-y-2">
                                                <Label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Description</Label>
                                                <Input value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className="h-10" />
                                              </div>

                                              <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                  <Label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Contact *</Label>
                                                  <Select value={editForm.contactId} onValueChange={(v) => setEditForm({ ...editForm, contactId: v })} required>
                                                    <SelectTrigger className={cn("h-10", !editForm.contactId && 'border-red-200')}>
                                                      <SelectValue placeholder="Link contact" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                      {contacts?.map((c: any) => (
                                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                                      ))}
                                                    </SelectContent>
                                                  </Select>
                                                </div>
                                                <div className="space-y-2">
                                                  <Label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Deal *</Label>
                                                  <Select value={editForm.dealId} onValueChange={(v) => setEditForm({ ...editForm, dealId: v })}>
                                                    <SelectTrigger className={cn("h-10", !editForm.dealId && 'border-red-200')}>
                                                      <SelectValue placeholder="Link deal" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                      {deals?.map((d: any) => (
                                                        <SelectItem key={d.id} value={d.id}>{d.title}</SelectItem>
                                                      ))}
                                                    </SelectContent>
                                                  </Select>
                                                </div>
                                              </div>
                                              <DynamicCustomFieldsForm entityType="tasks" values={editForm.customFields || {}} onChange={(cf) => { setEditForm({ ...editForm, customFields: cf }); setFormErrors({}) }} errors={formErrors} />
                                            </div>
                                            <DialogFooter className="px-6 py-4 border-t border-slate-100 flex-shrink-0 bg-slate-50/50">
                                              <Button type="submit" disabled={updateTask.isPending || !editForm.contactId || !editForm.dealId} className="font-bold bg-indigo-600 hover:bg-indigo-700">Save Changes</Button>
                                            </DialogFooter>
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
                                    <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between">
                                      <span className="text-[10px] text-slate-400">{task.dueDate}</span>
                                      <Badge className={cn("text-[9px] font-bold py-0 h-4 border-none", statusColors[task.status as Status])}>
                                        {statusLabels[task.status as Status]}
                                      </Badge>
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
                <div className="flex items-center px-4 py-3 border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wide bg-slate-50/50">
                  {visibleColumns.map(col => {
                    const stickyClass = col.stickyRight ? 'sticky right-0 bg-slate-50 z-10 shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.04)]' : ''
                    if (col.sortField) {
                      return (
                        <button 
                          key={col.key} 
                          style={col.flex ? { flex: 1, minWidth: col.minWidth } : { width: col.width }}
                          className={cn("flex items-center gap-1 hover:text-slate-600 text-left font-semibold uppercase transition-colors", stickyClass)} 
                          onClick={() => toggleSort(col.sortField!)}
                        >
                          {col.label} <ArrowUpDown className="w-3.5 h-3.5" />
                        </button>
                      )
                    }
                    return (
                      <div 
                        key={col.key} 
                        style={col.flex ? { flex: 1, minWidth: col.minWidth } : { width: col.width }} 
                        className={cn("truncate", stickyClass)}
                      >
                        {col.label}
                      </div>
                    )
                  })}
                </div>

                {items.length === 0 ? (
                  <div className="text-center py-16">
                    <CheckSquare className="w-10 h-10 mx-auto mb-3 text-slate-200" />
                    <p className="text-sm font-medium text-slate-500 mb-4">No tasks found</p>
                    <Button size="sm" variant="outline" onClick={() => setCreating(true)}>Create your first task</Button>
                  </div>
                ) : (
                  items.map((task: any) => (
                    <div key={task.id} className="group flex items-center px-4 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50/80 transition-colors">                      {visibleColumns.map(col => {
                        const stickyClass = col.stickyRight ? 'sticky right-0 bg-white group-hover:bg-slate-50 z-10 shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.04)] pl-4' : ''
                        
                        if (col.key === 'checkbox') {
                          return (
                            <div key={col.key} style={{ width: col.width }} className="flex items-center flex-shrink-0">
                              <button
                                title="Cycle status"
                                onClick={() => cycleStatus.mutate({ id: task.id, currentStatus: task.status as Status })}
                                className={`w-5 h-5 rounded-full border-2 flex-shrink-0 transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                                  task.status === 'approved'
                                    ? 'bg-green-500 border-green-500'
                                    : task.status === 'active'
                                    ? 'border-blue-500 bg-transparent shadow-[inset_0_0_0_2px_rgba(59,130,246,0.1)]'
                                    : 'border-slate-300 bg-transparent'
                                }`}
                              >
                                {task.status === 'approved' && <CheckSquare className="w-3 h-3 text-white mx-auto" />}
                              </button>
                            </div>
                          )
                        }
                        if (col.key === 'task') {
                          return (
                            <div key={col.key} style={{ flex: 1, minWidth: col.minWidth }} className="min-w-0 pr-4">
                              <span className={`font-semibold text-slate-900 block truncate ${task.status === 'approved' ? 'line-through text-slate-400' : ''}`}>
                                {task.title}
                              </span>
                              <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5 truncate">
                                {task.expand?.contactId && (
                                  <>
                                    <button onClick={(e) => { e.stopPropagation(); navigate(`/crm/contacts/${task.expand.contactId.id}`) }} className="text-slate-500 hover:text-indigo-600 hover:underline font-medium transition-colors">
                                      {task.expand.contactId.name}
                                    </button>
                                    <span className="w-0.5 h-0.5 rounded-full bg-slate-300" />
                                  </>
                                )}
                                {task.expand?.dealId && (
                                  <button onClick={(e) => { e.stopPropagation(); navigate(`/crm/deals/${task.expand.dealId.id}`) }} className="text-indigo-500 hover:text-indigo-700 hover:underline font-semibold transition-colors">
                                    {task.expand.dealId.title}
                                  </button>
                                )}
                              </div>
                            </div>
                          )
                        }
                        if (col.key === 'assignee') {
                          return (
                            <div key={col.key} style={{ width: col.width }} className="flex items-center gap-2 flex-shrink-0 pr-4">
                              {task.expand?.assigneeId ? (
                                <>
                                  <div className="w-6 h-6 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-600">
                                    {task.expand.assigneeId.name.charAt(0)}
                                  </div>
                                  <span className="text-xs text-slate-600 font-medium truncate">{task.expand.assigneeId.name}</span>
                                </>
                              ) : <span className="text-slate-300 text-xs italic">Unassigned</span>}
                            </div>
                          )
                        }
                        if (col.key === 'status') {
                          return (
                            <div key={col.key} style={{ width: col.width }} className="flex-shrink-0">
                              <Badge className={cn("inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 border-none", statusColors[task.status as Status] || statusColors.draft)}>
                                <span className={cn("w-1.5 h-1.5 rounded-full", statusDots[task.status as Status] || statusDots.draft)} />
                                {statusLabels[task.status as Status] || task.status}
                              </Badge>
                            </div>
                          )
                        }
                        if (col.key === 'due') {
                          return (
                            <div key={col.key} style={{ width: col.width }} className="text-xs text-slate-500 flex-shrink-0 pr-4">
                              {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}
                            </div>
                          )
                        }
                        if (col.key === 'actions') {
                          return (
                            <div key={col.key} style={{ width: col.width }} className={cn("flex justify-end gap-1 flex-shrink-0", stickyClass)}>
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
                                    assigneeId: task.assigneeId || '',
                                    customFields: task.customFields || {}
                                  });
                                } else {
                                  setEditing(null);
                                  setFormErrors({});
                                }
                              }}>
                                <DialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600"><Pencil className="w-3.5 h-3.5" /></Button></DialogTrigger>
                                <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col p-0 overflow-hidden">
                                  <DialogHeader className="px-6 py-4 border-b border-slate-100 flex-shrink-0"><DialogTitle>Edit Task</DialogTitle></DialogHeader>
                                  <form onSubmit={handleEditSubmit} className="flex flex-col min-h-0">
                                    <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
                                      {showAutoNumber && (
                                        <div className="space-y-2">
                                          <Label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Task Number</Label>
                                          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 h-10">
                                            <Hash className="w-4 h-4 text-slate-400" />
                                            <span className="font-mono text-sm text-slate-700">{task.entity_numbering || '—'}</span>
                                          </div>
                                        </div>
                                      )}
                                      <div className="space-y-2"><Label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Title *</Label><Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} required className="h-10" /></div>
                                      
                                      <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                          <Label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Due Date</Label>
                                          <Input type="date" value={editForm.dueDate} onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })} className="h-10" />
                                        </div>
                                        <div className="space-y-2">
                                          <Label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Assignee</Label>
                                          <Select value={editForm.assigneeId} onValueChange={(v) => setEditForm({ ...editForm, assigneeId: v })}>
                                            <SelectTrigger className="h-10">
                                              <SelectValue placeholder="Select member" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {employees?.map((e: any) => (
                                                <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      </div>

                                      <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Description</Label>
                                        <Input value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className="h-10" />
                                      </div>

                                      <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                          <Label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Contact *</Label>
                                          <Select value={editForm.contactId} onValueChange={(v) => setEditForm({ ...editForm, contactId: v })} required>
                                            <SelectTrigger className={cn("h-10", !editForm.contactId && 'border-red-200')}>
                                              <SelectValue placeholder="Link contact" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {contacts?.map((c: any) => (
                                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        <div className="space-y-2">
                                          <Label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Deal *</Label>
                                          <Select value={editForm.dealId} onValueChange={(v) => setEditForm({ ...editForm, dealId: v })}>
                                            <SelectTrigger className={cn("h-10", !editForm.dealId && 'border-red-200')}>
                                              <SelectValue placeholder="Link deal" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {deals?.map((d: any) => (
                                                <SelectItem key={d.id} value={d.id}>{d.title}</SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      </div>
                                      <DynamicCustomFieldsForm entityType="tasks" values={editForm.customFields || {}} onChange={(cf) => { setEditForm({ ...editForm, customFields: cf }); setFormErrors({}) }} errors={formErrors} />
                                    </div>
                                    <DialogFooter className="px-6 py-4 border-t border-slate-100 flex-shrink-0 bg-slate-50/50">
                                      <Button type="submit" disabled={updateTask.isPending || !editForm.contactId || !editForm.dealId} className="font-bold bg-indigo-600 hover:bg-indigo-700">Save Changes</Button>
                                    </DialogFooter>
                                  </form>
                                </DialogContent>
                              </Dialog>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500" onClick={() => { if (confirm('Delete this task?')) deleteTask.mutate(task.id) }}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          )
                        }

                        // Render other standard attributes
                        if (!col.isCustom) {
                          let displayVal = '—'
                          if (col.key === 'description') {
                            displayVal = task.description || '—'
                          } else if (col.key === 'priority') {
                            displayVal = task.priority ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1) : '—'
                          } else if (col.key === 'contact') {
                            displayVal = task.expand?.contactId?.name || '—'
                          } else if (col.key === 'deal') {
                            displayVal = task.expand?.dealId?.title || '—'
                          } else if (col.key === 'created' || col.key === 'updated') {
                            const dateVal = task[col.key]
                            if (dateVal) {
                              try {
                                displayVal = new Date(dateVal).toLocaleDateString(undefined, {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              } catch {
                                displayVal = String(dateVal)
                              }
                            }
                          }

                          return (
                            <div key={col.key} style={col.flex ? { flex: 1, minWidth: col.minWidth } : { width: col.width }} className="text-sm text-slate-500 truncate flex-shrink-0 pr-4">
                              {displayVal}
                            </div>
                          )
                        }

                        // Render custom fields dynamically
                        const rawVal = task.customFields?.[col.key]
                        const fieldDef = customFieldDefs.find((f: any) => f.key === col.key)
                        let displayVal = '—'
                        if (rawVal !== undefined && rawVal !== null && rawVal !== '') {
                          if (fieldDef?.type === 'checkbox') displayVal = rawVal ? 'Yes' : 'No'
                          else if (fieldDef?.type === 'date') displayVal = new Date(rawVal).toLocaleDateString()
                          else displayVal = String(rawVal)
                        }

                        return (
                          <div key={col.key} style={{ width: col.width }} className="text-sm text-slate-500 truncate flex-shrink-0 pr-4">
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
