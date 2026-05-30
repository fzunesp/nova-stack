import { useState, useEffect } from 'react'
import { Users, Search, Trash2, Pencil, ArrowUpDown, Briefcase, FileText, CheckSquare, User, Activity, Phone, Mail, Building, Loader2, Kanban, List, Plus, X, Check, MessageCircle, MessageSquare, StickyNote, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { usePaginatedQuery } from '@/hooks/usePaginatedQuery'
import { DataTablePagination } from '@/components/DataTablePagination'
import { TableSkeleton } from '@/components/ui/skeleton'
import pb from '@/lib/pocketbase'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  useCreateInteraction,
  useUpdateInteraction,
  useDeleteInteraction,
} from '@/hooks/useContactInteractions'
import { getContactInteractions } from '@/services/contact-interactions'
import type { InteractionType } from '@/services/types'
import { useLocation, useNavigate, useParams } from 'react-router'
import type { Status } from '@/services'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { DynamicCustomFieldsForm, validateCustomFields } from '@/components/DynamicCustomFieldsForm'
import { DynamicCustomFieldsViewer } from '@/components/DynamicCustomFieldsViewer'
import { useCustomFieldDefinitions } from '@/hooks/useCustomFields'
import { useColumnPicker, type ColumnDef } from '@/hooks/useColumnPicker'
import { ColumnPicker } from '@/components/ColumnPicker'
// ContactInteractionsTimeline component replaced by unified timeline in this redesign

export function CrmPage() {
  const location = useLocation()
  const navigate = useNavigate()

  const isDealsRoute = location.pathname.startsWith('/crm/deals')
  const isContactsRoute = location.pathname.startsWith('/crm/contacts')

  const [activeTab, setActiveTab] = useState<'contacts' | 'deals'>(() => {
    const saved = localStorage.getItem('crm-tab')
    if (saved === 'deals' || saved === 'contacts') return saved
    return isDealsRoute ? 'deals' : 'contacts'
  })

  useEffect(() => {
    localStorage.setItem('crm-tab', activeTab)
  }, [activeTab])

  useEffect(() => {
    if (isDealsRoute && activeTab !== 'deals') {
      setActiveTab('deals')
    } else if (isContactsRoute && activeTab !== 'contacts') {
      setActiveTab('contacts')
    }
  }, [location.pathname])

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as 'contacts' | 'deals')
    navigate(`/crm/${tab}`)
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">CRM</h2>
          <p className="text-sm text-slate-500 mt-0.5">Manage your contacts and pipeline</p>
        </div>
        <button
          onClick={() => navigate('/help?tab=contacts')}
          className="cursor-pointer flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-[rgb(var(--ns-accent))] bg-slate-50 hover:bg-[rgb(var(--ns-accent))]/10 border border-slate-200 hover:border-[rgb(var(--ns-accent))]/30 rounded-lg px-3 py-2 transition-colors"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          Help
        </button>
      </div>
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="mb-6">
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="deals">Deals</TabsTrigger>
        </TabsList>
        <TabsContent value="contacts" className="mt-0">
          <ContactsTab autoOpen={activeTab === 'contacts' && location.state?.openCreate === true} />
        </TabsContent>
        <TabsContent value="deals" className="mt-0">
          <DealsTab autoOpen={activeTab === 'deals' && location.state?.openCreate === true} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ContactsTab({ autoOpen = false }: { autoOpen?: boolean }) {
  const queryClient = useQueryClient()
  const location = useLocation()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isContactsRoute = location.pathname.startsWith('/crm/contacts')
  
  const initialSearch = location.state?.search || ''
  
  const { items, totalItems, totalPages, page, perPage, search, isLoading, toggleSort, goToPage, updateSearch } =
    usePaginatedQuery({ collection: 'contacts', searchFields: ['name', 'email'], expand: 'companyId', defaultSort: '+companyId', initialSearch })

  const { data: routeContact } = useQuery({
    queryKey: ['contact', id],
    queryFn: async () => {
      try {
        return await pb.collection('contacts').getOne(id!, { expand: 'companyId' })
      } catch (err) {
        toast.error('Contact not found')
        navigate('/crm/contacts', { replace: true })
        return null
      }
    },
    enabled: isContactsRoute && !!id,
  })

  const emptyContactForm = { name: '', email: '', phone: '', title: '', companyId: '', notes: '', status: 'active' as Status, customFields: {} as Record<string, any> }
  const [formData, setFormData] = useState(emptyContactForm)
  const [creating, setCreating] = useState(autoOpen)
  const [editing, setEditing] = useState<string | null>(null)
  const [editForm, setEditForm] = useState(emptyContactForm)
  const [selectedContact, setSelectedContact] = useState<any | null>(null)

  const { data: customFieldDefs = [] } = useCustomFieldDefinitions('contacts')
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [apiError, setApiError] = useState<string | null>(null)

  const standardColumns: ColumnDef[] = [
    { key: 'company', label: 'Company', width: 160, sortField: 'companyId' },
    { key: 'name', label: 'Name', flex: true, minWidth: 180, sortField: 'name' },
    { key: 'email', label: 'Email', width: 200, sortField: 'email' },
    { key: 'phone', label: 'Phone', width: 130, defaultHidden: true },
    { key: 'status', label: 'Status', width: 90, defaultHidden: true },
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
  const { visibleKeys, visibleColumns, toggleColumn } = useColumnPicker('contacts', allColumns)

  // Fetch companies for the dropdown
  const { data: companiesList } = useQuery({
    queryKey: ['companies-all'],
    queryFn: () => pb.collection('companies').getFullList({ sort: 'name' })
  })

  const createContact = useMutation({
    mutationFn: (data: typeof formData) => pb.collection('contacts').create({ ...data, userId: pb.authStore.record?.id, companyId: data.companyId || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      setFormData(emptyContactForm)
      setFormErrors({})
      setApiError(null)
      setCreating(false)
      toast.success('Contact added')
    },
    onError: (err: any) => {
      const msg = err?.data ? JSON.stringify(err.data) : (err?.message || 'Failed to add contact')
      setApiError(msg)
      toast.error(msg)
    },
  })

  const updateContact = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof editForm }) => pb.collection('contacts').update(id, { ...data, companyId: data.companyId || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      setEditing(null)
      setFormErrors({})
      toast.success('Contact updated')
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to update contact'),
  })

  const deleteContact = useMutation({
    mutationFn: (id: string) => pb.collection('contacts').delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      toast.success('Contact deleted')
    },
    onError: () => toast.error('Failed to delete contact'),
  })

  const handleOpenCreatingContact = () => {
    setFormData(emptyContactForm)
    setFormErrors({})
    setCreating(true)
  }

  const handleOpenEditingContact = (contact: any) => {
    setFormErrors({})
    setEditForm({
      name: contact.name || '',
      email: contact.email || '',
      phone: contact.phone || '',
      title: contact.title || '',
      companyId: contact.companyId || '',
      notes: contact.notes || '',
      status: contact.status || 'active',
      customFields: contact.customFields || {},
    })
    setEditing(contact.id)
  }

  const handleCreateContactSubmit = () => {
    const errs = validateCustomFields(customFieldDefs, formData.customFields || {})
    if (Object.keys(errs).length > 0) { setFormErrors(errs); toast.error('Please fill in all required custom fields'); return }
    createContact.mutate(formData)
  }

  const handleEditContactSubmit = () => {
    const errs = validateCustomFields(customFieldDefs, editForm.customFields || {})
    if (Object.keys(errs).length > 0) { setFormErrors(errs); toast.error('Please fill in all required custom fields'); return }
    updateContact.mutate({ id: editing!, data: editForm })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-4">
        <div className="relative flex-grow max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={search} onChange={(e) => updateSearch(e.target.value)} placeholder="Search contacts..." className="pl-10" />
        </div>
        
        <div className="flex items-center gap-2">
          <ColumnPicker allColumns={allColumns} visibleKeys={visibleKeys} onToggle={toggleColumn} />
          <Dialog open={creating} onOpenChange={(open) => {
            if (open) handleOpenCreatingContact()
            else { setCreating(false); setFormErrors({}) }
          }}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-1.5" />Add Contact</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add New Contact</DialogTitle></DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); handleCreateContactSubmit() }} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 space-y-1"><Label>Full Name *</Label><Input placeholder="Full name" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} required /></div>
                  <div className="space-y-1"><Label>Email *</Label><Input type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} required /></div>
                  <div className="space-y-1"><Label>Phone</Label><Input placeholder="Phone" value={formData.phone} onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))} /></div>
                  <div className="space-y-1"><Label>Job Title</Label><Input placeholder="e.g. CEO" value={formData.title} onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))} /></div>
                  <div className="space-y-1">
                    <Label>Company</Label>
                    <Select value={formData.companyId || 'none'} onValueChange={(v) => setFormData(prev => ({ ...prev, companyId: v === 'none' ? '' : v }))}>
                      <SelectTrigger><SelectValue placeholder="Select company" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Company</SelectItem>
                        {companiesList?.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2 space-y-1"><Label>Notes</Label><Input placeholder="Notes" value={formData.notes} onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))} /></div>
                </div>
                <DynamicCustomFieldsForm entityType="contacts" values={formData.customFields || {}} onChange={(cf) => { setFormData(prev => ({ ...prev, customFields: cf })); setFormErrors({}) }} errors={formErrors} />
                {apiError && <p id="create-contact-api-error" style={{ color: 'red', fontSize: '11px', marginTop: '4px' }}>{apiError}</p>}
                <DialogFooter><Button type="submit" disabled={createContact.isPending}>Add Contact</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? <TableSkeleton rows={5} /> : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-full divide-y divide-slate-100">
              <div className="flex items-center px-4 py-3 border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                {visibleColumns.map(col => {
                  const stickyClass = col.stickyRight ? 'sticky right-0 bg-white z-10 shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.04)]' : ''
                  if (col.sortField) {
                    return (
                      <button 
                        key={col.key} 
                        style={col.flex ? { flex: 1, minWidth: col.minWidth } : { width: col.width }}
                        className={`flex items-center gap-1 hover:text-slate-600 text-left font-semibold uppercase ${stickyClass}`} 
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
                  <Users className="w-10 h-10 mx-auto mb-3 text-slate-200" />
                  <p className="text-sm font-medium text-slate-500 mb-4">No contacts yet</p>
                  <Button size="sm" variant="outline" onClick={() => setCreating(true)}>Add your first contact</Button>
                </div>
              ) : (
                items.map((contact: any, index: number) => {
                  const currentCompany = contact.expand?.companyId?.name || contact.companyName || '—'
                  const previousCompany = index > 0 ? (items[index - 1].expand?.companyId?.name || items[index - 1].companyName || '—') : null
                  const showCompany = currentCompany !== previousCompany

                  return (
                    <div key={contact.id} className="group flex items-center px-4 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                      {visibleColumns.map(col => {
                        if (col.key === 'company') {
                          return (
                            <div key={col.key} style={{ width: col.width }} className="text-sm font-semibold text-slate-700 truncate flex-shrink-0">
                              {showCompany ? currentCompany : ''}
                            </div>
                          )
                        }
                        if (col.key === 'name') {
                          return (
                            <div 
                              key={col.key} 
                              style={{ flex: 1, minWidth: col.minWidth }} 
                              className="cursor-pointer min-w-0" 
                              onClick={() => navigate(`/crm/contacts/${contact.id}`)}
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold flex-shrink-0">
                                  {contact.name?.charAt(0)?.toUpperCase() || '?'}
                                </div>
                                <span className="font-medium text-slate-900 truncate group-hover:text-[rgb(var(--ns-accent))] transition-colors">{contact.name}</span>
                              </div>
                            </div>
                          )
                        }
                        if (col.key === 'email') {
                          return (
                            <div key={col.key} style={{ width: col.width }} className="text-sm text-slate-500 truncate flex-shrink-0">
                              {contact.email || '—'}
                            </div>
                          )
                        }
                        if (col.key === 'phone') {
                          return (
                            <div key={col.key} style={{ width: col.width }} className="text-sm text-slate-500 truncate flex-shrink-0">
                              {contact.phone || '—'}
                            </div>
                          )
                        }
                        if (col.key === 'status') {
                          return (
                            <div key={col.key} style={{ width: col.width }} className="flex-shrink-0">
                              <Badge className={`${contact.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200'} text-[10px] px-1.5 py-0.5 capitalize`}>
                                {contact.status || 'active'}
                              </Badge>
                            </div>
                          )
                        }
                        if (col.key === 'actions') {
                          return (
                            <div key={col.key} style={{ width: col.width }} className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 sticky right-0 bg-white group-hover:bg-slate-50 z-10 shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.04)]">
                              <Dialog open={editing === contact.id} onOpenChange={(open) => {
                                if (open) handleOpenEditingContact(contact)
                                else { setEditing(null); setFormErrors({}) }
                              }}>
                                <DialogTrigger asChild><Button variant="ghost" size="icon"><Pencil className="w-3.5 h-3.5" /></Button></DialogTrigger>
                                <DialogContent>
                                  <DialogHeader><DialogTitle>Edit Contact</DialogTitle></DialogHeader>
                                  <form onSubmit={(e) => { e.preventDefault(); handleEditContactSubmit() }} className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                      <div className="col-span-2 space-y-1"><Label>Full Name *</Label><Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required /></div>
                                      <div className="space-y-1"><Label>Email *</Label><Input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} required /></div>
                                      <div className="space-y-1"><Label>Phone</Label><Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} /></div>
                                      <div className="space-y-1"><Label>Job Title</Label><Input placeholder="e.g. CEO" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} /></div>
                                      <div className="space-y-1">
                                        <Label>Company</Label>
                                        <Select value={editForm.companyId || 'none'} onValueChange={(v) => setEditForm({ ...editForm, companyId: v === 'none' ? '' : v })}>
                                          <SelectTrigger><SelectValue placeholder="Select company" /></SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="none">No Company</SelectItem>
                                            {companiesList?.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div className="col-span-2 space-y-1"><Label>Notes</Label><Input value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} /></div>
                                    </div>
                                    <DynamicCustomFieldsForm entityType="contacts" values={editForm.customFields || {}} onChange={(cf) => setEditForm({ ...editForm, customFields: cf })} errors={formErrors} />
                                    <DialogFooter><Button type="submit" disabled={updateContact.isPending}>Save</Button></DialogFooter>
                                  </form>
                                </DialogContent>
                              </Dialog>
                              <Button variant="ghost" size="icon" onClick={() => { if (confirm('Delete this contact?')) deleteContact.mutate(contact.id) }}>
                                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                              </Button>
                            </div>
                          )
                        }

                        // Render custom fields dynamically
                        const rawVal = contact.customFields?.[col.key]
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
                  )
                })
              )}
            </div>
          </div>
          <DataTablePagination page={page} totalPages={totalPages} totalItems={totalItems} perPage={perPage} onPageChange={goToPage} />
        </div>
      )}
      {(selectedContact || routeContact) && (
        <ContactDetailDialog
          contact={selectedContact || routeContact}
          onClose={() => {
            setSelectedContact(null)
            if (id) navigate('/crm/contacts')
          }}
        />
      )}
    </div>
  )
}

const stageColors: Record<string, string> = {
  lead: 'bg-blue-100 text-blue-700',
  contacted: 'bg-amber-100 text-amber-700',
  quoted: 'bg-purple-100 text-purple-700',
  won: 'bg-green-100 text-green-700',
  lost: 'bg-red-100 text-red-600',
}
const stageDots: Record<string, string> = {
  lead: 'bg-blue-500',
  contacted: 'bg-amber-500',
  quoted: 'bg-purple-500',
  won: 'bg-green-500',
  lost: 'bg-red-400',
}

function DealsTab({ autoOpen = false }: { autoOpen?: boolean }) {
  const queryClient = useQueryClient()
  const location = useLocation()
  const initialSearch = location.state?.search || ''
  const [viewMode, setViewMode] = useState<'list' | 'board'>(() => {
    const saved = localStorage.getItem('deals-view')
    return saved === 'board' ? 'board' : 'list'
  })

  useEffect(() => {
    localStorage.setItem('deals-view', viewMode)
  }, [viewMode])

  const { items, totalItems, totalPages, page, perPage, search, isLoading, toggleSort, goToPage, updateSearch } =
    usePaginatedQuery({ collection: 'deals', searchFields: ['title'], expand: 'contactId', initialSearch })

  const { data: allDeals, isLoading: allDealsLoading } = useQuery({
    queryKey: ['deals-all', search],
    queryFn: async () => {
      const filter = search ? `(title ~ "${search.trim()}")` : ''
      return pb.collection('deals').getFullList({
        filter: filter || undefined,
        expand: 'contactId',
        sort: '-id'
      })
    },
    enabled: viewMode === 'board',
  })

  const [formData, setFormData] = useState({ title: '', value: '', stage: 'lead' as 'lead' | 'contacted' | 'quoted' | 'won' | 'lost', status: 'active' as Status, contactId: '', companyId: '', customFields: {} as Record<string, any> })
  const [creating, setCreating] = useState(autoOpen)
  const [editing, setEditing] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ title: '', value: '', stage: 'lead' as 'lead' | 'contacted' | 'quoted' | 'won' | 'lost', status: 'active' as Status, contactId: '', companyId: '', customFields: {} as Record<string, any> })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const { data: dealCustomFieldDefs = [] } = useCustomFieldDefinitions('deals')

  const dealStandardColumns: ColumnDef[] = [
    { key: 'title', label: 'Title', flex: true, minWidth: 200, sortField: 'title' },
    { key: 'contact', label: 'Contact', width: 160 },
    { key: 'value', label: 'Value', width: 130, sortField: 'value' },
    { key: 'stage', label: 'Stage', width: 150 },
    { key: 'actions', label: 'Actions', width: 100, alwaysVisible: true, stickyRight: true }
  ]

  const dealCustomColumns: ColumnDef[] = dealCustomFieldDefs.map((def: any) => ({
    key: def.key,
    label: def.name,
    width: 130,
    isCustom: true
  }))

  const dealStandardData = dealStandardColumns.filter(c => !c.stickyRight)
  const dealStickyActions = dealStandardColumns.filter(c => c.stickyRight)
  const dealAllColumns = [...dealStandardData, ...dealCustomColumns, ...dealStickyActions]
  const { visibleKeys: dealVisibleKeys, visibleColumns: dealVisibleColumns, toggleColumn: dealToggleColumn } = useColumnPicker('deals', dealAllColumns)

  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isDealsRoute = location.pathname.startsWith('/crm/deals')

  const { data: routeDeal } = useQuery({
    queryKey: ['deal', id],
    queryFn: async () => {
      try {
        return await pb.collection('deals').getOne(id!)
      } catch (err) {
        toast.error('Deal not found')
        navigate('/crm/deals', { replace: true })
        return null
      }
    },
    enabled: isDealsRoute && !!id,
  })

  useEffect(() => {
    if (routeDeal) {
      setEditing(routeDeal.id)
      setEditForm({
        title: routeDeal.title || '',
        value: String(routeDeal.value || ''),
        stage: routeDeal.stage || 'lead',
        status: routeDeal.status || 'active',
        contactId: routeDeal.contactId || '',
        companyId: routeDeal.companyId || '',
        customFields: routeDeal.customFields || {}
      })
      setFormErrors({})
    }
  }, [routeDeal])

  const { data: contacts } = useQuery({
    queryKey: ['allContactsList'],
    queryFn: () => pb.collection('contacts').getFullList({ sort: 'name' })
  })

  const stages = ['lead', 'contacted', 'quoted', 'won', 'lost']

  const createDeal = useMutation({
    mutationFn: (data: typeof formData) => pb.collection('deals').create({ ...data, value: parseFloat(data.value) || 0, userId: pb.authStore.record?.id, contactId: data.contactId || undefined, companyId: data.companyId || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] })
      queryClient.invalidateQueries({ queryKey: ['deals-all'] })
      setFormData({ title: '', value: '', stage: 'lead', status: 'active', contactId: '', companyId: '', customFields: {} })
      setCreating(false)
      setFormErrors({})
      toast.success('Deal added')
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to add deal'),
  })

  const updateDeal = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof editForm }) => pb.collection('deals').update(id, { ...data, value: parseFloat(data.value) || 0, contactId: data.contactId || undefined, companyId: data.companyId || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] })
      queryClient.invalidateQueries({ queryKey: ['deals-all'] })
      setEditing(null)
      setFormErrors({})
      toast.success('Deal updated')
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to update deal'),
  })

  const handleCreateDealSubmit = () => {
    const errs = validateCustomFields(dealCustomFieldDefs, formData.customFields || {})
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs)
      toast.error('Please fill in all required custom fields')
      return
    }
    createDeal.mutate(formData)
  }

  const handleEditDealSubmit = (dealId: string) => {
    const errs = validateCustomFields(dealCustomFieldDefs, editForm.customFields || {})
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs)
      toast.error('Please fill in all required custom fields')
      return
    }
    updateDeal.mutate({ id: dealId, data: editForm })
  }

  const deleteDeal = useMutation({
    mutationFn: (id: string) => pb.collection('deals').delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] })
      queryClient.invalidateQueries({ queryKey: ['deals-all'] })
      toast.success('Deal deleted')
    },
    onError: () => toast.error('Failed to delete deal'),
  })

  const handleDragEnd = (result: any) => {
    const { destination, source, draggableId } = result
    if (!destination) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) return

    const deal = (allDeals || []).find((d: any) => d.id === draggableId)
    if (!deal) return

    // Optimistically update local cache to prevent drag flicker
    queryClient.setQueryData(['deals-all', search], (prev: any) => {
      if (!prev) return prev
      return prev.map((d: any) => {
        if (d.id === draggableId) {
          return { ...d, stage: destination.droppableId }
        }
        return d
      })
    })

    updateDeal.mutate({
      id: draggableId,
      data: {
        title: deal.title || '',
        value: String(deal.value || ''),
        stage: destination.droppableId as any,
        status: deal.status || 'active',
        contactId: deal.contactId || '',
        companyId: deal.companyId || '',
        customFields: deal.customFields || {}
      }
    })
  }

  const groupedDeals = stages.reduce((acc, stage) => {
    acc[stage] = (allDeals || []).filter((d: any) => d.stage === stage)
    return acc
  }, {} as Record<string, any[]>)

  const columnColors: Record<string, string> = {
    lead: 'bg-blue-50/50 border-blue-100 hover:bg-blue-50/70',
    contacted: 'bg-amber-50/50 border-amber-100 hover:bg-amber-50/70',
    quoted: 'bg-purple-50/50 border-purple-100 hover:bg-purple-50/70',
    won: 'bg-green-50/50 border-green-100 hover:bg-green-50/70',
    lost: 'bg-red-50/50 border-red-100 hover:bg-red-50/70',
  }

  const columnHeaderStyles: Record<string, string> = {
    lead: 'text-blue-700 bg-blue-100/60 border-blue-200',
    contacted: 'text-amber-700 bg-amber-100/60 border-amber-200',
    quoted: 'text-purple-700 bg-purple-100/60 border-purple-200',
    won: 'text-green-700 bg-green-100/60 border-green-200',
    lost: 'text-red-700 bg-red-100/60 border-red-200',
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4 gap-4">
        <div className="relative flex-grow max-w-md flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input value={search} onChange={(e) => updateSearch(e.target.value)} placeholder="Search deals..." className="pl-10" />
          </div>
          {/* Toggle buttons */}
          <div className="flex items-center border border-slate-200 rounded-lg p-0.5 bg-slate-50 flex-shrink-0">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === 'list' ? 'bg-white text-slate-800 shadow-sm border border-slate-200/50' : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('board')}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === 'board' ? 'bg-white text-slate-800 shadow-sm border border-slate-200/50' : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Kanban Board"
            >
              <Kanban className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {viewMode === 'list' && (
            <ColumnPicker allColumns={dealAllColumns} visibleKeys={dealVisibleKeys} onToggle={dealToggleColumn} />
          )}
          <Dialog open={creating} onOpenChange={setCreating}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-1.5" />Add Deal</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add New Deal</DialogTitle></DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); handleCreateDealSubmit() }} className="space-y-4">
                <div className="space-y-2"><Label>Title</Label><Input placeholder="Deal title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required /></div>
                <div className="space-y-2"><Label>Value ($)</Label><Input type="number" placeholder="Value" value={formData.value} onChange={(e) => setFormData({ ...formData, value: e.target.value })} /></div>
                <div className="space-y-2"><Label>Stage</Label>
                  <Select value={formData.stage} onValueChange={(v) => setFormData({ ...formData, stage: v as any })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{stages.map((s) => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Contact / Client *</Label>
                  <Select value={formData.contactId} onValueChange={(v) => setFormData({ ...formData, contactId: v })} required>
                    <SelectTrigger className={!formData.contactId ? 'border-red-200' : ''}>
                      <SelectValue placeholder="— Select a contact —" />
                    </SelectTrigger>
                    <SelectContent>
                      {contacts?.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <DynamicCustomFieldsForm entityType="deals" values={formData.customFields || {}} onChange={(cf) => setFormData({ ...formData, customFields: cf })} errors={formErrors} />
                <DialogFooter><Button type="submit" disabled={createDeal.isPending || !formData.contactId}>Add Deal</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {viewMode === 'list' ? (
        isLoading ? <TableSkeleton rows={5} /> : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <div className="min-w-full divide-y divide-slate-100">
                <div className="flex items-center px-4 py-3 border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  {dealVisibleColumns.map(col => {
                    const stickyClass = col.stickyRight ? 'sticky right-0 bg-white z-10 shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.04)]' : ''
                    if (col.sortField) {
                      return (
                        <button 
                          key={col.key} 
                          style={col.flex ? { flex: 1, minWidth: col.minWidth } : { width: col.width }}
                          className={`flex items-center gap-1 hover:text-slate-600 text-left font-semibold uppercase ${stickyClass}`} 
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
                    <Briefcase className="w-10 h-10 mx-auto mb-3 text-slate-200" />
                    <p className="text-sm font-medium text-slate-500 mb-4">No deals yet</p>
                    <Button size="sm" variant="outline" onClick={() => setCreating(true)}>Add your first deal</Button>
                  </div>
                ) : (
                  items.map((deal: any) => (
                    <div key={deal.id} className="group flex items-center px-4 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                      {dealVisibleColumns.map(col => {
                        if (col.key === 'title') {
                          return (
                            <div 
                              key={col.key} 
                              style={{ flex: 1, minWidth: col.minWidth }} 
                              className="cursor-pointer min-w-0" 
                              onClick={() => navigate(`/crm/deals/${deal.id}`)}
                            >
                              <span className="font-medium text-slate-900 truncate block group-hover:text-[rgb(var(--ns-accent))] transition-colors">{deal.title}</span>
                            </div>
                          )
                        }
                        if (col.key === 'contact') {
                          return (
                            <div key={col.key} style={{ width: col.width }} className="truncate flex-shrink-0">
                              {deal.expand?.contactId ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    navigate(`/crm/contacts/${deal.expand.contactId.id}`)
                                  }}
                                  className="text-xs text-indigo-500 hover:text-indigo-700 hover:underline font-medium text-left truncate block w-full"
                                >
                                  {deal.expand.contactId.name}
                                </button>
                              ) : (
                                <span className="text-xs text-slate-400">—</span>
                              )}
                            </div>
                          )
                        }
                        if (col.key === 'value') {
                          return (
                            <div key={col.key} style={{ width: col.width }} className="text-sm font-semibold text-slate-700 truncate flex-shrink-0">
                              ${deal.value?.toLocaleString()}
                            </div>
                          )
                        }
                        if (col.key === 'stage') {
                          return (
                            <div key={col.key} style={{ width: col.width }} className="flex-shrink-0">
                              <Badge className={`${stageColors[deal.stage] || ''} inline-flex items-center gap-1.5 text-xs`}>
                                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${stageDots[deal.stage] || 'bg-gray-400'}`} />
                                {deal.stage}
                              </Badge>
                            </div>
                          )
                        }
                        if (col.key === 'actions') {
                          return (
                            <div key={col.key} style={{ width: col.width }} className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 sticky right-0 bg-white group-hover:bg-slate-50 z-10 shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.04)]">
                              <Dialog open={editing === deal.id} onOpenChange={(open) => {
                                if (open) {
                                  setEditing(deal.id);
                                  setEditForm({
                                    title: deal.title || '',
                                    value: String(deal.value || ''),
                                    stage: deal.stage || 'lead',
                                    status: deal.status || 'active',
                                    contactId: deal.contactId || '',
                                    companyId: deal.companyId || '',
                                    customFields: deal.customFields || {}
                                  });
                                  setFormErrors({});
                                } else {
                                  setEditing(null);
                                  if (id) navigate('/crm/deals');
                                }
                              }}>
                                <DialogTrigger asChild><Button variant="ghost" size="icon"><Pencil className="w-3.5 h-3.5" /></Button></DialogTrigger>
                                <DialogContent>
                                  <DialogHeader><DialogTitle>Edit Deal</DialogTitle></DialogHeader>
                                  <form onSubmit={(e) => { e.preventDefault(); handleEditDealSubmit(deal.id) }} className="space-y-4">
                                    <div className="space-y-2"><Label>Title</Label><Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} required /></div>
                                    <div className="space-y-2"><Label>Value ($)</Label><Input type="number" value={editForm.value} onChange={(e) => setEditForm({ ...editForm, value: e.target.value })} /></div>
                                    <div className="space-y-2"><Label>Stage</Label>
                                      <Select value={editForm.stage} onValueChange={(v) => setEditForm({ ...editForm, stage: v as any })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>{stages.map((s) => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}</SelectContent>
                                      </Select>
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Contact / Client *</Label>
                                      <Select value={editForm.contactId} onValueChange={(v) => setEditForm({ ...editForm, contactId: v })}>
                                        <SelectTrigger className={!editForm.contactId ? 'border-red-200' : ''}>
                                          <SelectValue placeholder="— Select a contact —" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {contacts?.map((c: any) => (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <DynamicCustomFieldsForm entityType="deals" values={editForm.customFields || {}} onChange={(cf) => setEditForm({ ...editForm, customFields: cf })} errors={formErrors} />
                                    <DialogFooter className="flex items-center justify-between gap-2 w-full">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                          navigate('/invoices', {
                                            state: {
                                              openCreate: true,
                                              dealId: deal.id,
                                              dealTitle: deal.title,
                                              dealValue: deal.value,
                                            }
                                          })
                                        }}
                                        className="text-xs border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-1.5"
                                      >
                                        <FileText className="w-3.5 h-3.5" /> Create Invoice
                                      </Button>
                                      <Button type="submit" disabled={updateDeal.isPending || !editForm.contactId}>Save</Button>
                                    </DialogFooter>
                                  </form>
                                </DialogContent>
                              </Dialog>
                              <Button variant="ghost" size="icon" onClick={() => { if (confirm('Delete this deal?')) deleteDeal.mutate(deal.id) }}>
                                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                              </Button>
                            </div>
                          )
                        }

                        // Render custom attributes dynamically
                        const rawVal = deal.customFields?.[col.key]
                        const fieldDef = dealCustomFieldDefs.find((f: any) => f.key === col.key)
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
      ) : (
        allDealsLoading ? <TableSkeleton rows={5} /> : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4 items-start min-h-[500px]">
              {stages.map((stage) => {
                const stageDeals = groupedDeals[stage] || []
                const totalValue = stageDeals.reduce((sum, d) => sum + (d.value || 0), 0)

                return (
                  <div key={stage} className={`flex flex-col rounded-xl border p-3 min-w-[220px] transition-all min-h-[500px] ${columnColors[stage]}`}>
                    {/* Column Header */}
                    <div className={`flex items-center justify-between px-3 py-1.5 rounded-lg border text-xs font-bold uppercase tracking-wider mb-3 ${columnHeaderStyles[stage]}`}>
                      <div className="flex items-center gap-1.5">
                        <span>{stage}</span>
                        <span className="bg-white/90 px-1.5 py-0.5 rounded-full text-[10px]">{stageDeals.length}</span>
                      </div>
                      <span>${totalValue.toLocaleString()}</span>
                    </div>

                    {/* Droppable Area */}
                    <Droppable droppableId={stage}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`flex-1 flex flex-col gap-2 rounded-lg p-1 transition-colors min-h-[400px] ${
                            snapshot.isDraggingOver ? 'bg-slate-100/50' : ''
                          }`}
                        >
                          {stageDeals.map((deal, index) => (
                            <Draggable key={deal.id} draggableId={deal.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  style={{
                                    ...provided.draggableProps.style,
                                  }}
                                  className={`bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col gap-2 relative ${
                                    snapshot.isDragging ? 'shadow-lg border-indigo-400 rotate-1' : ''
                                  }`}
                                >
                                  <div className="flex justify-between items-start gap-2 pr-6">
                                    <span
                                      onClick={() => navigate(`/crm/deals/${deal.id}`)}
                                      className="font-semibold text-sm text-slate-800 cursor-pointer hover:text-[rgb(var(--ns-accent))] transition-colors line-clamp-2"
                                    >
                                      {deal.title}
                                    </span>
                                    
                                    {/* Actions dropdown or quick buttons absolute right */}
                                    <div className="absolute top-2 right-2 flex items-center gap-0.5">
                                      <Dialog open={editing === deal.id} onOpenChange={(open) => {
                                        if (open) {
                                          setEditing(deal.id);
                                          setEditForm({
                                            title: deal.title || '',
                                            value: String(deal.value || ''),
                                            stage: deal.stage || 'lead',
                                            status: deal.status || 'active',
                                            contactId: deal.contactId || '',
                                            companyId: deal.companyId || '',
                                            customFields: deal.customFields || {}
                                          });
                                          setFormErrors({});
                                        } else {
                                          setEditing(null);
                                          if (id) navigate('/crm/deals');
                                        }
                                      }}>
                                        <DialogTrigger asChild>
                                          <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-slate-600">
                                            <Pencil className="w-3 h-3" />
                                          </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                          <DialogHeader><DialogTitle>Edit Deal</DialogTitle></DialogHeader>
                                          <form onSubmit={(e) => { e.preventDefault(); handleEditDealSubmit(deal.id) }} className="space-y-4">
                                            <div className="space-y-2"><Label>Title</Label><Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} required /></div>
                                            <div className="space-y-2"><Label>Value ($)</Label><Input type="number" value={editForm.value} onChange={(e) => setEditForm({ ...editForm, value: e.target.value })} /></div>
                                            <div className="space-y-2"><Label>Stage</Label>
                                              <Select value={editForm.stage} onValueChange={(v) => setEditForm({ ...editForm, stage: v as any })}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>{stages.map((s) => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}</SelectContent>
                                              </Select>
                                            </div>
                                            <div className="space-y-2">
                                              <Label>Contact / Client *</Label>
                                              <Select value={editForm.contactId} onValueChange={(v) => setEditForm({ ...editForm, contactId: v })}>
                                                <SelectTrigger className={!editForm.contactId ? 'border-red-200' : ''}>
                                                  <SelectValue placeholder="— Select a contact —" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  {contacts?.map((c: any) => (
                                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                                  ))}
                                                </SelectContent>
                                              </Select>
                                            </div>
                                            <DynamicCustomFieldsForm entityType="deals" values={editForm.customFields || {}} onChange={(cf) => setEditForm({ ...editForm, customFields: cf })} errors={formErrors} />
                                            <DialogFooter className="flex items-center justify-between gap-2 w-full">
                                              <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => {
                                                  navigate('/invoices', {
                                                    state: {
                                                      openCreate: true,
                                                      dealId: deal.id,
                                                      dealTitle: deal.title,
                                                      dealValue: deal.value,
                                                    }
                                                  })
                                                }}
                                                className="text-xs border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-1.5"
                                              >
                                                <FileText className="w-3.5 h-3.5" /> Create Invoice
                                              </Button>
                                              <Button type="submit" disabled={updateDeal.isPending || !editForm.contactId}>Save</Button>
                                            </DialogFooter>
                                          </form>
                                        </DialogContent>
                                      </Dialog>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-slate-400 hover:text-red-500"
                                        onClick={() => { if (confirm('Delete this deal?')) deleteDeal.mutate(deal.id) }}
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>

                                  {deal.expand?.contactId && (
                                    <span
                                      onClick={() => navigate(`/crm/contacts/${deal.expand.contactId.id}`)}
                                      className="text-xs text-indigo-500 hover:text-indigo-700 hover:underline font-medium block truncate max-w-full cursor-pointer"
                                    >
                                      Client: {deal.expand.contactId.name}
                                    </span>
                                  )}

                                  <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-slate-100">
                                    <span className="text-xs font-bold text-slate-700">
                                      ${deal.value?.toLocaleString()}
                                    </span>
                                    {deal.created && (
                                      <span className="text-[10px] text-slate-400">
                                        {new Date(deal.created).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                      </span>
                                    )}
                                  </div>
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
      )}
    </div>
  )
}

const TYPE_CONFIG: Record<InteractionType, { label: string; icon: typeof Phone; color: string }> = {
  call: { label: 'Call', icon: Phone, color: 'bg-blue-50 text-blue-700 border-blue-200' },
  email: { label: 'Email', icon: Mail, color: 'bg-violet-50 text-violet-700 border-violet-200' },
  meeting: { label: 'Meeting', icon: MessageCircle, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  note: { label: 'Note', icon: StickyNote, color: 'bg-amber-50 text-amber-700 border-amber-200' },
  sms: { label: 'SMS', icon: MessageSquare, color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  proposal: { label: 'Proposal', icon: FileText, color: 'bg-rose-50 text-rose-700 border-rose-200' },
}

const TYPE_OPTIONS: InteractionType[] = ['note', 'call', 'email', 'meeting', 'sms', 'proposal']

function timeAgo(iso: string | Date) {
  const d = new Date(iso)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 4) return `${weeks}w ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

function buildUnifiedEvents(contact: any, data: any) {
  const events: any[] = []

  const contactDate = contact?.created || contact?.assignedAt
  events.push({
    id: 'created',
    type: 'created',
    date: contactDate ? new Date(contactDate) : new Date(),
    title: 'Contact Created',
    description: `Added to CRM`,
    status: 'Active',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    isManual: false,
  })

  if (data) {
    data.interactions?.forEach((interaction: any) => {
      events.push({
        id: interaction.id,
        type: 'interaction',
        interactionType: interaction.type,
        date: new Date(interaction.created || interaction.updated || Date.now()),
        title: TYPE_CONFIG[interaction.type as InteractionType]?.label || interaction.type,
        description: interaction.content,
        status: 'Logged',
        badgeColor: TYPE_CONFIG[interaction.type as InteractionType]?.color || 'bg-slate-50 text-slate-700 border-slate-200',
        isManual: true,
        raw: interaction,
      })
    })

    data.deals?.forEach((deal: any) => {
      const dealDate = deal.created || deal.expectedCloseDate || deal.assignedAt
      events.push({
        id: deal.id,
        type: 'deal',
        date: dealDate ? new Date(dealDate) : new Date(),
        title: deal.title,
        description: `Value: $${(deal.value || 0).toLocaleString()}`,
        status: deal.stage || 'lead',
        badgeColor: deal.stage === 'won' ? 'bg-green-50 text-green-700 border-green-100' : deal.stage === 'lost' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-blue-50 text-blue-700 border-blue-100',
        isManual: false,
        navigateTo: `/crm/deals/${deal.id}`,
      })
    })

    data.invoices?.forEach((invoice: any) => {
      const invoiceDate = invoice.created || invoice.issuedDate || invoice.assignedAt
      events.push({
        id: invoice.id,
        type: 'invoice',
        date: invoiceDate ? new Date(invoiceDate) : new Date(),
        title: invoice.title || 'Invoice',
        description: `Total: $${(invoice.amount || 0).toLocaleString()}`,
        status: invoice.status || 'pending',
        badgeColor: invoice.status === 'paid' ? 'bg-green-50 text-green-700 border-green-100' : invoice.status === 'approved' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-amber-50 text-amber-700 border-amber-100',
        isManual: false,
        navigateTo: `/invoices/${invoice.id}`,
      })
    })

    data.tasks?.forEach((task: any) => {
      const taskDate = task.created || task.dueDate || task.assignedAt
      events.push({
        id: task.id,
        type: 'task',
        date: taskDate ? new Date(taskDate) : new Date(),
        title: task.title,
        description: task.description || 'Task created',
        status: task.status || 'draft',
        badgeColor: task.status === 'done' ? 'bg-green-50 text-green-700 border-green-100' : task.status === 'approved' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-slate-50 text-slate-700 border-slate-200',
        isManual: false,
        navigateTo: `/tasks/${task.id}`,
      })
    })
  }

  return events.sort((a, b) => b.date.getTime() - a.date.getTime())
}

function ContactDetailDialog({ contact, onClose }: { contact: any; onClose: () => void }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [filter, setFilter] = useState<string>('all')
  const [newContent, setNewContent] = useState('')
  const [newType, setNewType] = useState<InteractionType>('note')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['contactTimeline', contact.id],
    queryFn: async () => {
      const [interactions, deals, tasks, invoices] = await Promise.all([
        getContactInteractions(contact.id),
        pb.collection('deals').getFullList({ filter: `contactId = "${contact.id}"`, sort: '-created' }),
        pb.collection('tasks').getFullList({ filter: `contactId = "${contact.id}"`, sort: '-created' }),
        pb.collection('invoices').getFullList({ filter: `dealId.contactId = "${contact.id}"`, expand: 'dealId', sort: '-created' })
      ])
      return { interactions, deals, tasks, invoices }
    }
  })

  const createMutation = useCreateInteraction()
  const updateMutation = useUpdateInteraction()
  const deleteMutation = useDeleteInteraction()

  const openDealsValue = data?.deals?.filter((d: any) => d.stage !== 'lost').reduce((sum: number, d: any) => sum + (d.value || 0), 0) || 0
  const pendingTasks = data?.tasks?.filter((t: any) => t.status !== 'done' && t.status !== 'approved').length || 0
  const lastInteractionDate = data?.interactions?.[0]?.created || contact.created
  const daysSince = lastInteractionDate ? Math.max(0, Math.floor((Date.now() - new Date(lastInteractionDate).getTime()) / (1000 * 60 * 60 * 24))) : null

  const allEvents = buildUnifiedEvents(contact, data)

  const filteredEvents = filter === 'all' ? allEvents : allEvents.filter((e: any) => {
    if (filter === 'deal') return e.type === 'deal'
    if (filter === 'task') return e.type === 'task'
    if (filter === 'invoice') return e.type === 'invoice'
    if (filter === 'note') return e.type === 'interaction' && e.interactionType === 'note'
    if (filter === 'call') return e.type === 'interaction' && e.interactionType === 'call'
    if (filter === 'email') return e.type === 'interaction' && e.interactionType === 'email'
    if (filter === 'meeting') return e.type === 'interaction' && e.interactionType === 'meeting'
    if (filter === 'sms') return e.type === 'interaction' && e.interactionType === 'sms'
    if (filter === 'proposal') return e.type === 'interaction' && e.interactionType === 'proposal'
    return false
  })

  const handleAdd = async () => {
    if (!newContent.trim()) return
    try {
      await createMutation.mutateAsync({ contactId: contact.id, content: newContent.trim(), type: newType })
      setNewContent('')
      setNewType('note')
      queryClient.invalidateQueries({ queryKey: ['contactTimeline', contact.id] })
      toast.success('Interaction logged')
    } catch {
      toast.error('Failed to log interaction')
    }
  }

  const handleUpdate = async (id: string) => {
    if (!editContent.trim()) return
    try {
      await updateMutation.mutateAsync({ id, content: editContent.trim(), contactId: contact.id })
      setEditingId(null)
      queryClient.invalidateQueries({ queryKey: ['contactTimeline', contact.id] })
      toast.success('Updated')
    } catch {
      toast.error('Failed to update')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync({ id, contactId: contact.id })
      queryClient.invalidateQueries({ queryKey: ['contactTimeline', contact.id] })
      toast.success('Deleted')
    } catch {
      toast.error('Failed to delete')
    }
  }

  const filterOptions = [
    { key: 'all', label: 'All' },
    { key: 'note', label: 'Notes' },
    { key: 'call', label: 'Calls' },
    { key: 'email', label: 'Emails' },
    { key: 'meeting', label: 'Meetings' },
    { key: 'deal', label: 'Deals' },
    { key: 'task', label: 'Tasks' },
    { key: 'invoice', label: 'Invoices' },
  ]

  return (
    <Dialog open={true} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-[95vw] sm:max-w-6xl min-w-[640px] max-h-[92vh] flex flex-col p-0 overflow-hidden" style={{ resize: 'both' }}>
        <DialogHeader className="px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-slate-900 text-lg font-semibold">
            <User className="w-5 h-5 text-indigo-500" />
            Contact Profile
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto grid grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-100 min-h-0">
          {/* LEFT COLUMN: Profile Card */}
          <div className="col-span-12 md:col-span-4 p-0 bg-slate-50/50 flex flex-col">
            {/* Gradient Header */}
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 text-center">
              <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-3xl font-bold text-white mx-auto mb-3 border-4 border-white/30">
                {contact.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <h2 className="text-xl font-bold text-white">{contact.name}</h2>
              <p className="text-indigo-100 text-sm mt-1">{contact.title || 'No Title'}</p>
              {contact.expand?.companyId ? (
                <button
                  onClick={() => { onClose(); navigate(`/companies/${contact.expand.companyId.id}`) }}
                  className="inline-block mt-2 text-white/80 text-sm hover:text-white underline"
                >
                  {contact.expand.companyId.name}
                </button>
              ) : (
                <p className="text-indigo-100/70 text-sm mt-1">{contact.companyName || 'No Company'}</p>
              )}
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100 bg-white">
              <div className="p-4 text-center">
                <div className="text-lg font-bold text-slate-900">${(openDealsValue / 1000).toFixed(0)}K</div>
                <div className="text-xs text-slate-500 mt-0.5">Open Deals</div>
              </div>
              <div className="p-4 text-center">
                <div className="text-lg font-bold text-slate-900">{pendingTasks}</div>
                <div className="text-xs text-slate-500 mt-0.5">Pending</div>
              </div>
              <div className="p-4 text-center">
                <div className="text-lg font-bold text-slate-900">{daysSince !== null ? `${daysSince}d` : '—'}</div>
                <div className="text-xs text-slate-500 mt-0.5">Last Contact</div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="p-4 space-y-3 bg-white">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="text-slate-700 truncate">{contact.email || '—'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="text-slate-700">{contact.phone || '—'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Building className="w-4 h-4 text-slate-400 flex-shrink-0" />
                {contact.expand?.companyId ? (
                  <button onClick={() => { onClose(); navigate(`/companies/${contact.expand.companyId.id}`) }} className="text-indigo-600 hover:underline">
                    {contact.expand.companyId.name}
                  </button>
                ) : (
                  <span className="text-slate-700">{contact.companyName || '—'}</span>
                )}
              </div>
            </div>

            {/* Custom Fields */}
            <div className="px-4 pb-2 bg-white">
              <DynamicCustomFieldsViewer entityType="contacts" values={contact.customFields} />
            </div>

            {/* Quick Actions */}
            <div className="px-4 pb-4 bg-white">
              <div className="grid grid-cols-2 gap-2">
                <button
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors"
                  onClick={() => window.open(`mailto:${contact.email}`)}
                >
                  <Mail className="w-4 h-4" /> Email
                </button>
                <button
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-100 transition-colors"
                  onClick={() => window.open(`tel:${contact.phone}`)}
                >
                  <Phone className="w-4 h-4" /> Call
                </button>
                <Dialog open={false}>
                  <button className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-50 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors border border-slate-200">
                    <Pencil className="w-4 h-4" /> Edit
                  </button>
                </Dialog>
                <button
                  onClick={() => { onClose(); navigate('/crm/deals', { state: { openCreate: true, contactId: contact.id } }) }}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-violet-50 text-violet-700 rounded-lg text-sm font-medium hover:bg-violet-100 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add Deal
                </button>
              </div>
            </div>

            {/* Active Deals */}
            {data?.deals && data.deals.length > 0 && (
              <div className="mt-4 mx-4 mb-4 bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Active Deals</h3>
                <div className="space-y-2">
                  {data.deals.slice(0, 3).map((deal: any) => (
                    <div
                      key={deal.id}
                      className="flex items-center justify-between p-2 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors"
                      onClick={() => { onClose(); navigate(`/crm/deals/${deal.id}`) }}
                    >
                      <span className="text-xs font-medium text-slate-700 truncate max-w-[120px]">{deal.title}</span>
                      <span className={`text-xs font-bold ${deal.stage === 'won' ? 'text-green-600' : deal.stage === 'lost' ? 'text-red-500' : 'text-indigo-600'}`}>
                        ${(deal.value || 0).toLocaleString()}
                      </span>
                    </div>
                  ))}
                  {data.deals.length > 3 && (
                    <p className="text-xs text-slate-400 text-center">+{data.deals.length - 3} more</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Unified Timeline */}
          <div className="col-span-12 md:col-span-8 p-0 flex flex-col min-h-0 bg-white">
            {/* Timeline Header with Filters */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-lg font-semibold text-slate-900">Activity Timeline</h3>
              <div className="flex items-center gap-1 flex-wrap justify-end">
                {filterOptions.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                      filter === f.key
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Timeline Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <span className="text-xs font-medium">Loading activity...</span>
                </div>
              ) : filteredEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  <Activity className="w-8 h-8 text-slate-300 mb-2.5" />
                  <p className="text-sm font-medium text-slate-600">No activity yet</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs text-center leading-relaxed">
                    Log an interaction or create deals/tasks to see activity here.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {filteredEvents.map((event: any, idx: number) => {
                    const Icon = event.type === 'interaction' 
                      ? (TYPE_CONFIG[event.interactionType as InteractionType]?.icon || Activity)
                      : event.type === 'deal' ? Briefcase
                      : event.type === 'invoice' ? FileText
                      : event.type === 'task' ? CheckSquare
                      : User

                    const iconBg = event.type === 'interaction'
                      ? (TYPE_CONFIG[event.interactionType as InteractionType]?.color.split(' ')[0] || 'bg-slate-50')
                      : event.type === 'deal' ? 'bg-blue-50'
                      : event.type === 'invoice' ? 'bg-amber-50'
                      : event.type === 'task' ? 'bg-emerald-50'
                      : 'bg-indigo-50'

                    const iconColor = event.type === 'interaction'
                      ? (TYPE_CONFIG[event.interactionType as InteractionType]?.color.split(' ')[1] || 'text-slate-700')
                      : event.type === 'deal' ? 'text-blue-500'
                      : event.type === 'invoice' ? 'text-amber-500'
                      : event.type === 'task' ? 'text-emerald-500'
                      : 'text-indigo-500'

                    return (
                      <div key={`${event.type}-${event.id}-${idx}`} className="flex gap-4 group/item">
                        {/* Icon Circle */}
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full ${iconBg} border-2 border-white shadow-sm flex items-center justify-center`}>
                          <Icon className={`w-5 h-5 ${iconColor}`} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${event.badgeColor}`}>
                              {event.title}
                            </span>
                            <span className="text-[10px] text-slate-400">{timeAgo(event.date)}</span>
                          </div>

                          {event.type === 'interaction' && editingId === event.id ? (
                            <div className="space-y-1 mt-1">
                              <Textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="text-xs min-h-[60px]"
                                autoFocus
                              />
                              <div className="flex gap-1">
                                <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => handleUpdate(event.id)}>
                                  <Check className="w-3 h-3 mr-1" /> Save
                                </Button>
                                <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => setEditingId(null)}>
                                  <X className="w-3 h-3 mr-1" /> Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <p className="text-sm text-slate-700">{event.description}</p>
                              <div className="flex items-center gap-3 mt-1.5">
                                {event.isManual && (
                                  <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                    <button
                                      className="text-[10px] text-slate-400 hover:text-slate-600 underline"
                                      onClick={() => { setEditingId(event.id); setEditContent(event.raw.content) }}
                                    >
                                      Edit
                                    </button>
                                    <button
                                      className="text-[10px] text-slate-400 hover:text-red-500 underline"
                                      onClick={() => handleDelete(event.id)}
                                    >
                                      Delete
                                    </button>
                                  </div>
                                )}
                                {event.navigateTo && (
                                  <button
                                    className="text-[10px] text-indigo-600 hover:text-indigo-800 underline"
                                    onClick={() => { onClose(); navigate(event.navigateTo) }}
                                  >
                                    View {event.type.charAt(0).toUpperCase() + event.type.slice(1)} →
                                  </button>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Add Interaction Form */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                {TYPE_OPTIONS.map((t) => {
                  const config = TYPE_CONFIG[t]
                  const Icon = config.icon
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setNewType(t)}
                      className={`flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full border transition-colors ${
                        newType === t
                          ? `${config.color} ring-1 ring-offset-0`
                          : 'border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      {config.label}
                    </button>
                  )
                })}
              </div>
              <div className="flex gap-2">
                <Textarea
                  placeholder="Log an interaction..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="text-xs min-h-[60px] flex-1 bg-white"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault()
                      handleAdd()
                    }
                  }}
                />
                <Button
                  size="sm"
                  className="h-auto px-3 self-end"
                  onClick={handleAdd}
                  disabled={!newContent.trim() || createMutation.isPending}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add
                </Button>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Ctrl+Enter to submit</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

