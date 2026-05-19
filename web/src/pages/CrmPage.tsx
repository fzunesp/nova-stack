import { useState, useEffect } from 'react'
import { Users, Search, Trash2, Pencil, ArrowUpDown, Briefcase, FileText, CheckSquare, User, Calendar, Activity, Info, Phone, Mail, Building, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
import { useLocation, useNavigate, useParams } from 'react-router'
import { contactService, dealService, isAppError } from '@/services'
import type { Status } from '@/services'

export function CrmPage() {
  const location = useLocation()
  const navigate = useNavigate()

  const isDealsRoute = location.pathname.startsWith('/crm/deals')
  const isContactsRoute = location.pathname.startsWith('/crm/contacts')

  const initialTab = isDealsRoute ? 'deals' : (isContactsRoute ? 'contacts' : (location.state?.tab === 'deals' ? 'deals' : 'contacts'))
  const [activeTab, setActiveTab] = useState<'contacts' | 'deals'>(initialTab)

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
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-900">CRM</h2>
        <p className="text-sm text-slate-500 mt-0.5">Manage your contacts and pipeline</p>
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

  const [formData, setFormData] = useState({ name: '', email: '', phone: '', title: '', companyId: '', notes: '', status: 'active' as Status })
  const [creating, setCreating] = useState(autoOpen)
  const [editing, setEditing] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', title: '', companyId: '', notes: '', status: 'active' as Status })
  const [selectedContact, setSelectedContact] = useState<any | null>(null)

  const actorId = pb.authStore.record?.id || ''

  // Fetch companies for the dropdown
  const { data: companiesList } = useQuery({
    queryKey: ['companies-all'],
    queryFn: () => pb.collection('companies').getFullList({ sort: 'name' })
  })

  const createContact = useMutation({
    mutationFn: (data: typeof formData) => contactService.create({ ...data, userId: pb.authStore.record?.id, companyId: data.companyId || undefined }, actorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      setFormData({ name: '', email: '', phone: '', title: '', companyId: '', notes: '', status: 'active' })
      setCreating(false)
      toast.success('Contact added')
    },
    onError: (err) => toast.error(isAppError(err) ? err.message : 'Failed to add contact'),
  })

  const updateContact = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof editForm }) => contactService.update(id, { ...data, companyId: data.companyId || undefined }, actorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      setEditing(null)
      toast.success('Contact updated')
    },
    onError: (err) => toast.error(isAppError(err) ? err.message : 'Failed to update contact'),
  })

  const deleteContact = useMutation({
    mutationFn: (id: string) => contactService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      toast.success('Contact deleted')
    },
    onError: () => toast.error('Failed to delete contact'),
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={search} onChange={(e) => updateSearch(e.target.value)} placeholder="Search contacts..." className="pl-10" />
        </div>
        <Dialog open={creating} onOpenChange={setCreating}>
          <DialogTrigger asChild><Button>Add Contact</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add New Contact</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); createContact.mutate(formData) }} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1"><Label>Full Name *</Label><Input placeholder="Full name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div>
                <div className="space-y-1"><Label>Email *</Label><Input type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required /></div>
                <div className="space-y-1"><Label>Phone</Label><Input placeholder="Phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} /></div>
                <div className="space-y-1"><Label>Job Title</Label><Input placeholder="e.g. CEO" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} /></div>
                <div className="space-y-1">
                  <Label>Company</Label>
                  <Select value={formData.companyId || 'none'} onValueChange={(v) => setFormData({ ...formData, companyId: v === 'none' ? '' : v })}>
                    <SelectTrigger><SelectValue placeholder="Select company" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Company</SelectItem>
                      {companiesList?.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-1"><Label>Notes</Label><Input placeholder="Notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} /></div>
              </div>
              <DialogFooter><Button type="submit" disabled={createContact.isPending}>Add Contact</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? <TableSkeleton rows={5} /> : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wide">
            <button className="col-span-3 flex items-center gap-1 hover:text-slate-600" onClick={() => toggleSort('companyId')}>Company <ArrowUpDown className="w-3 h-3" /></button>
            <button className="col-span-3 flex items-center gap-1 hover:text-slate-600" onClick={() => toggleSort('name')}>Name <ArrowUpDown className="w-3 h-3" /></button>
            <button className="col-span-4 flex items-center gap-1 hover:text-slate-600" onClick={() => toggleSort('email')}>Email <ArrowUpDown className="w-3 h-3" /></button>
            <div className="col-span-2 text-right">Actions</div>
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
              <div key={contact.id} className="group grid grid-cols-12 gap-4 px-4 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors items-center">
                <div className="col-span-3 text-sm font-semibold text-slate-700 truncate">
                  {showCompany ? currentCompany : ''}
                </div>
                <div className="col-span-3 cursor-pointer" onClick={() => navigate(`/crm/contacts/${contact.id}`)}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold flex-shrink-0">
                      {contact.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <span className="font-medium text-slate-900 truncate group-hover:text-[rgb(var(--ns-accent))] transition-colors">{contact.name}</span>
                  </div>
                </div>
                <div className="col-span-4 text-sm text-slate-500 truncate">{contact.email}</div>
                <div className="col-span-2 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Dialog open={editing === contact.id} onOpenChange={(open) => {
                    if (open) { setEditing(contact.id); setEditForm({ name: contact.name || '', email: contact.email || '', phone: contact.phone || '', title: contact.title || '', companyId: contact.companyId || '', notes: contact.notes || '', status: contact.status || 'active' }) }
                    else setEditing(null)
                  }}>
                    <DialogTrigger asChild><Button variant="ghost" size="icon"><Pencil className="w-3.5 h-3.5" /></Button></DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Edit Contact</DialogTitle></DialogHeader>
                      <form onSubmit={(e) => { e.preventDefault(); updateContact.mutate({ id: contact.id, data: editForm }) }} className="space-y-3">
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
                        <DialogFooter><Button type="submit" disabled={updateContact.isPending}>Save</Button></DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                  <Button variant="ghost" size="icon" onClick={() => { if (confirm('Delete this contact?')) deleteContact.mutate(contact.id) }}>
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </Button>
                </div>
              </div>
              )
            })
          )}
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
  
  const { items, totalItems, totalPages, page, perPage, search, isLoading, toggleSort, goToPage, updateSearch } =
    usePaginatedQuery({ collection: 'deals', searchFields: ['title'], expand: 'contactId', initialSearch })

  const [formData, setFormData] = useState({ title: '', value: '', stage: 'lead' as 'lead' | 'contacted' | 'quoted' | 'won' | 'lost', status: 'active' as Status, contactId: '', companyId: '' })
  const [creating, setCreating] = useState(autoOpen)
  const [editing, setEditing] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ title: '', value: '', stage: 'lead' as 'lead' | 'contacted' | 'quoted' | 'won' | 'lost', status: 'active' as Status, contactId: '', companyId: '' })

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
        companyId: routeDeal.companyId || ''
      })
    }
  }, [routeDeal])

  const { data: contacts } = useQuery({
    queryKey: ['allContactsList'],
    queryFn: () => pb.collection('contacts').getFullList({ sort: 'name' })
  })

  const stages = ['lead', 'contacted', 'quoted', 'won', 'lost']
  const actorId = pb.authStore.record?.id || ''

  const createDeal = useMutation({
    mutationFn: (data: typeof formData) => dealService.create({ ...data, value: parseFloat(data.value) || 0, userId: pb.authStore.record?.id, contactId: data.contactId || undefined, companyId: data.companyId || undefined }, actorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] })
      setFormData({ title: '', value: '', stage: 'lead', status: 'active', contactId: '', companyId: '' })
      setCreating(false)
      toast.success('Deal added')
    },
    onError: (err) => toast.error(isAppError(err) ? err.message : 'Failed to add deal'),
  })

  const updateDeal = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof editForm }) => dealService.update(id, { ...data, value: parseFloat(data.value) || 0, contactId: data.contactId || undefined, companyId: data.companyId || undefined }, actorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] })
      setEditing(null)
      toast.success('Deal updated')
    },
    onError: (err) => toast.error(isAppError(err) ? err.message : 'Failed to update deal'),
  })

  const deleteDeal = useMutation({
    mutationFn: (id: string) => dealService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] })
      toast.success('Deal deleted')
    },
    onError: () => toast.error('Failed to delete deal'),
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={search} onChange={(e) => updateSearch(e.target.value)} placeholder="Search deals..." className="pl-10" />
        </div>
        <Dialog open={creating} onOpenChange={setCreating}>
          <DialogTrigger asChild><Button>Add Deal</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add New Deal</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); createDeal.mutate(formData) }} className="space-y-4">
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
              <DialogFooter><Button type="submit" disabled={createDeal.isPending || !formData.contactId}>Add Deal</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? <TableSkeleton rows={5} /> : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wide">
            <button className="col-span-5 flex items-center gap-1 hover:text-slate-600" onClick={() => toggleSort('title')}>Title <ArrowUpDown className="w-3 h-3" /></button>
            <button className="col-span-2 flex items-center gap-1 hover:text-slate-600" onClick={() => toggleSort('value')}>Value <ArrowUpDown className="w-3 h-3" /></button>
            <div className="col-span-3">Stage</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>
          {items.length === 0 ? (
            <div className="text-center py-16">
              <Briefcase className="w-10 h-10 mx-auto mb-3 text-slate-200" />
              <p className="text-sm font-medium text-slate-500 mb-4">No deals yet</p>
              <Button size="sm" variant="outline" onClick={() => setCreating(true)}>Add your first deal</Button>
            </div>
          ) : (
            items.map((deal: any) => (
              <div key={deal.id} className="group grid grid-cols-12 gap-4 px-4 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors items-center">
                <div className="col-span-5 cursor-pointer" onClick={() => navigate(`/crm/deals/${deal.id}`)}>
                  <span className="font-medium text-slate-900 group-hover:text-[rgb(var(--ns-accent))] transition-colors">{deal.title}</span>
                  {deal.expand?.contactId && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/crm/contacts/${deal.expand.contactId.id}`)
                      }}
                      className="text-xs text-indigo-500 hover:text-indigo-700 hover:underline block mt-0.5 font-medium truncate text-left"
                    >
                      Client: {deal.expand.contactId.name}
                    </button>
                  )}
                </div>
                <div className="col-span-2 text-sm font-semibold text-slate-700">${deal.value?.toLocaleString()}</div>
                <div className="col-span-3">
                  <Badge className={`${stageColors[deal.stage] || ''} inline-flex items-center gap-1.5 text-xs`}>
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${stageDots[deal.stage] || 'bg-gray-400'}`} />
                    {deal.stage}
                  </Badge>
                </div>
                <div className="col-span-2 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Dialog open={editing === deal.id} onOpenChange={(open) => {
                    if (open) { setEditing(deal.id); setEditForm({ title: deal.title || '', value: String(deal.value || ''), stage: deal.stage || 'lead', status: deal.status || 'active', contactId: deal.contactId || '', companyId: deal.companyId || '' }) }
                    else { setEditing(null); if (id) navigate('/crm/deals') }
                  }}>
                    <DialogTrigger asChild><Button variant="ghost" size="icon"><Pencil className="w-3.5 h-3.5" /></Button></DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Edit Deal</DialogTitle></DialogHeader>
                      <form onSubmit={(e) => { e.preventDefault(); updateDeal.mutate({ id: deal.id, data: editForm }) }} className="space-y-4">
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
                        <DialogFooter><Button type="submit" disabled={updateDeal.isPending || !editForm.contactId}>Save</Button></DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                  <Button variant="ghost" size="icon" onClick={() => { if (confirm('Delete this deal?')) deleteDeal.mutate(deal.id) }}>
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

function ContactDetailDialog({ contact, onClose }: { contact: any; onClose: () => void }) {
  const navigate = useNavigate()
  const { data, isLoading } = useQuery({
    queryKey: ['contactTimeline', contact.id],
    queryFn: async () => {
      const [deals, tasks, invoices] = await Promise.all([
        pb.collection('deals').getFullList({
          filter: `contactId = "${contact.id}"`,
          sort: '-id'
        }),
        pb.collection('tasks').getFullList({
          filter: `contactId = "${contact.id}"`,
          sort: '-id'
        }),
        pb.collection('invoices').getFullList({
          filter: `dealId.contactId = "${contact.id}"`,
          expand: 'dealId',
          sort: '-id'
        })
      ])
      return { deals, tasks, invoices }
    }
  })

  const events = getTimelineEvents(contact, data)

  return (
    <Dialog open={true} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-slate-900 text-lg font-semibold">
            <Activity className="w-5 h-5 text-indigo-500" />
            Contact Profile & Timeline
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto grid grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-100 min-h-0">
          {/* Left Column: Contact Details */}
          <div className="col-span-12 md:col-span-4 p-6 bg-slate-50/50 flex flex-col">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xl font-bold mx-auto mb-3 border-2 border-white shadow-sm">
                {contact.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <h3 className="text-lg font-bold text-slate-900 leading-tight">{contact.name}</h3>
              {contact.expand?.companyId ? (
                <button
                  onClick={() => {
                    onClose()
                    navigate(`/companies/${contact.expand.companyId.id}`)
                  }}
                  className="text-sm text-indigo-600 font-semibold hover:underline mt-1"
                >
                  {contact.expand.companyId.name}
                </button>
              ) : (
                <p className="text-sm text-slate-500 mt-1 font-medium">{contact.companyName || 'No Company'}</p>
              )}
            </div>

            <div className="space-y-4 text-sm flex-1">
              <div className="flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Email</div>
                  <div className="text-slate-700 font-medium break-all">{contact.email || '—'}</div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Phone</div>
                  <div className="text-slate-700 font-medium">{contact.phone || '—'}</div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Building className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Company</div>
                  {contact.expand?.companyId ? (
                    <button
                      onClick={() => {
                        onClose()
                        navigate(`/companies/${contact.expand.companyId.id}`)
                      }}
                      className="text-indigo-600 font-semibold hover:underline flex items-center gap-1 text-left mt-0.5"
                    >
                      {contact.expand.companyId.name}
                    </button>
                  ) : (
                    <div className="text-slate-700 font-medium">{contact.companyName || '—'}</div>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Calendar className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Created At</div>
                  <div className="text-slate-700 font-medium">
                    {contact.created ? new Date(contact.created).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '—'}
                  </div>
                </div>
              </div>

              {contact.notes && (
                <div className="pt-3 border-t border-slate-100 mt-4">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5" /> Notes
                  </div>
                  <p className="text-xs text-slate-600 bg-white border border-slate-100 rounded-lg p-2.5 italic leading-relaxed whitespace-pre-wrap">
                    {contact.notes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Unified Timeline */}
          <div className="col-span-12 md:col-span-8 p-6 flex flex-col min-h-0 bg-white">
            <h4 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-slate-400" />
              Unified Activity History
            </h4>

            {isLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="text-xs font-medium">Loading activity history...</span>
              </div>
            ) : events.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-16 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <Activity className="w-8 h-8 text-slate-300 mb-2.5" />
                <p className="text-sm font-medium text-slate-600">No activity history yet</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs text-center leading-relaxed">
                  Deals, invoices, and tasks linked to this contact will automatically compile in this visual timeline.
                </p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto pr-1">
                <div className="relative pl-6 border-l-2 border-slate-100 space-y-6 py-2 ml-3">
                  {events.map((event, idx) => {
                    const Icon = getEventIcon(event.type)
                    return (
                      <div key={idx} className="relative group/item">
                        {/* Event icon marker */}
                        <div className="absolute -left-[35px] top-0.5 w-6 h-6 rounded-full bg-white border-2 border-slate-100 flex items-center justify-center text-slate-500 shadow-sm group-hover/item:border-indigo-200 group-hover/item:text-indigo-600 transition-colors">
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        
                        {/* Event content */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-4">
                            {event.type === 'deal' ? (
                              <button
                                onClick={() => {
                                  onClose()
                                  navigate(`/crm/deals/${event.id}`)
                                }}
                                className="text-xs font-semibold text-indigo-600 hover:underline text-left"
                              >
                                {event.title}
                              </button>
                            ) : event.type === 'invoice' ? (
                              <button
                                onClick={() => {
                                  onClose()
                                  navigate(`/invoices/${event.id}`)
                                }}
                                className="text-xs font-semibold text-indigo-600 hover:underline text-left"
                              >
                                {event.title}
                              </button>
                            ) : (
                              <span className="text-xs font-semibold text-slate-900 group-hover/item:text-indigo-600 transition-colors">{event.title}</span>
                            )}
                            <span className="text-[10px] text-slate-400 font-medium">
                              {event.date.toLocaleDateString(undefined, { dateStyle: 'medium' })} @ {event.date.toLocaleTimeString(undefined, { timeStyle: 'short' })}
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between gap-4 bg-slate-50/60 group-hover/item:bg-slate-50/90 rounded-lg px-3 py-2 border border-slate-100/50 transition-colors">
                            <p className="text-xs text-slate-600 font-medium flex-1">{event.description}</p>
                            <Badge className={`${event.badgeColor} border-0 text-[10px] px-1.5 py-0.5 uppercase tracking-wider font-bold shadow-none`}>
                              {event.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function getEventIcon(type: string) {
  switch (type) {
    case 'created': return User
    case 'deal': return Briefcase
    case 'invoice': return FileText
    case 'task': return CheckSquare
    default: return Activity
  }
}

function getTimelineEvents(contact: any, data: any) {
  const events: any[] = []

  const contactDate = contact?.created || contact?.assignedAt
  events.push({
    id: 'created',
    type: 'created',
    date: contactDate ? new Date(contactDate) : new Date(),
    title: 'Contact Created',
    description: `Added to CRM list`,
    status: contact.status || 'active',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-100'
  })

  if (data) {
    data.deals?.forEach((deal: any) => {
      const dealDate = deal.created || deal.expectedCloseDate || deal.assignedAt
      events.push({
        id: deal.id,
        type: 'deal',
        date: dealDate ? new Date(dealDate) : new Date(),
        title: 'Deal Logged',
        description: `${deal.title} — Value: $${(deal.value || 0).toLocaleString()}`,
        status: deal.stage || 'lead',
        badgeColor: deal.stage === 'won' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-blue-50 text-blue-700 border-blue-100'
      })
    })

    data.invoices?.forEach((invoice: any) => {
      const invoiceDate = invoice.created || invoice.issuedDate || invoice.assignedAt
      events.push({
        id: invoice.id,
        type: 'invoice',
        date: invoiceDate ? new Date(invoiceDate) : new Date(),
        title: 'Invoice Issued',
        description: `${invoice.title} — Total: $${(invoice.amount || 0).toLocaleString()}`,
        status: invoice.status || 'pending',
        badgeColor: invoice.status === 'approved' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-amber-50 text-amber-700 border-amber-100'
      })
    })

    data.tasks?.forEach((task: any) => {
      const taskDate = task.created || task.dueDate || task.assignedAt
      events.push({
        id: task.id,
        type: 'task',
        date: taskDate ? new Date(taskDate) : new Date(),
        title: 'Task Created',
        description: task.title,
        status: task.status || 'draft',
        badgeColor: task.status === 'approved' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-slate-50 text-slate-700 border-slate-100'
      })
    })
  }

  return events.sort((a, b) => b.date.getTime() - a.date.getTime())
}

