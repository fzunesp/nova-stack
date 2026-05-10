import { useState } from 'react'
import { Users, Search, Trash2, Pencil, ArrowUpDown, Briefcase } from 'lucide-react'
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
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useLocation } from 'react-router'

export function CrmPage() {
  const location = useLocation()
  const initialTab = location.state?.tab === 'deals' ? 'deals' : 'contacts'
  const [activeTab, setActiveTab] = useState<'contacts' | 'deals'>(initialTab)

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-900">CRM</h2>
        <p className="text-sm text-slate-500 mt-0.5">Manage your contacts and pipeline</p>
      </div>
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'contacts' | 'deals')}>
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
  const { items, totalItems, totalPages, page, perPage, search, isLoading, toggleSort, goToPage, updateSearch } =
    usePaginatedQuery({ collection: 'contacts', searchFields: ['name', 'email'] })

  const [formData, setFormData] = useState({ name: '', email: '', phone: '', companyName: '', notes: '' })
  const [creating, setCreating] = useState(autoOpen)
  const [editing, setEditing] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', companyName: '', notes: '' })

  const createContact = useMutation({
    mutationFn: (data: typeof formData) => pb.collection('contacts').create({ ...data, userId: pb.authStore.record?.id }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['contacts'] }); setFormData({ name: '', email: '', phone: '', companyName: '', notes: '' }); setCreating(false); toast.success('Contact added') },
    onError: () => toast.error('Failed to add contact'),
  })

  const updateContact = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof editForm }) => pb.collection('contacts').update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['contacts'] }); setEditing(null); toast.success('Contact updated') },
    onError: () => toast.error('Failed to update contact'),
  })

  const deleteContact = useMutation({
    mutationFn: (id: string) => pb.collection('contacts').delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['contacts'] }); toast.success('Contact deleted') },
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
            <form onSubmit={(e) => { e.preventDefault(); createContact.mutate(formData) }} className="space-y-4">
              <div className="space-y-2"><Label>Name</Label><Input placeholder="Full name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div>
              <div className="space-y-2"><Label>Email</Label><Input type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required /></div>
              <div className="space-y-2"><Label>Phone</Label><Input placeholder="Phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} /></div>
              <div className="space-y-2"><Label>Company</Label><Input placeholder="Company" value={formData.companyName} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} /></div>
              <div className="space-y-2"><Label>Notes</Label><Input placeholder="Notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} /></div>
              <DialogFooter><Button type="submit" disabled={createContact.isPending}>Add Contact</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? <TableSkeleton rows={5} /> : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wide">
            <button className="col-span-4 flex items-center gap-1 hover:text-slate-600" onClick={() => toggleSort('name')}>Name <ArrowUpDown className="w-3 h-3" /></button>
            <button className="col-span-4 flex items-center gap-1 hover:text-slate-600" onClick={() => toggleSort('email')}>Email <ArrowUpDown className="w-3 h-3" /></button>
            <div className="col-span-2">Company</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>
          {items.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-10 h-10 mx-auto mb-3 text-slate-200" />
              <p className="text-sm font-medium text-slate-500 mb-4">No contacts yet</p>
              <Button size="sm" variant="outline" onClick={() => setCreating(true)}>Add your first contact</Button>
            </div>
          ) : (
            items.map((contact: any) => (
              <div key={contact.id} className="group grid grid-cols-12 gap-4 px-4 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors items-center">
                <div className="col-span-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold flex-shrink-0">
                      {contact.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <span className="font-medium text-slate-900 truncate">{contact.name}</span>
                  </div>
                </div>
                <div className="col-span-4 text-sm text-slate-500 truncate">{contact.email}</div>
                <div className="col-span-2 text-sm text-slate-400 truncate">{contact.companyName || '—'}</div>
                <div className="col-span-2 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Dialog open={editing === contact.id} onOpenChange={(open) => {
                    if (open) { setEditing(contact.id); setEditForm({ name: contact.name || '', email: contact.email || '', phone: contact.phone || '', companyName: contact.companyName || '', notes: contact.notes || '' }) }
                    else setEditing(null)
                  }}>
                    <DialogTrigger asChild><Button variant="ghost" size="icon"><Pencil className="w-3.5 h-3.5" /></Button></DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Edit Contact</DialogTitle></DialogHeader>
                      <form onSubmit={(e) => { e.preventDefault(); updateContact.mutate({ id: contact.id, data: editForm }) }} className="space-y-4">
                        <div className="space-y-2"><Label>Name</Label><Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required /></div>
                        <div className="space-y-2"><Label>Email</Label><Input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} required /></div>
                        <div className="space-y-2"><Label>Phone</Label><Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} /></div>
                        <div className="space-y-2"><Label>Company</Label><Input value={editForm.companyName} onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })} /></div>
                        <div className="space-y-2"><Label>Notes</Label><Input value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} /></div>
                        <DialogFooter><Button type="submit" disabled={updateContact.isPending}>Save</Button></DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                  <Button variant="ghost" size="icon" onClick={() => { if (confirm('Delete this contact?')) deleteContact.mutate(contact.id) }}>
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
  const { items, totalItems, totalPages, page, perPage, search, isLoading, toggleSort, goToPage, updateSearch } =
    usePaginatedQuery({ collection: 'deals', searchFields: ['title'] })

  const [formData, setFormData] = useState({ title: '', value: '', stage: 'lead' })
  const [creating, setCreating] = useState(autoOpen)
  const [editing, setEditing] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ title: '', value: '', stage: 'lead' })

  const stages = ['lead', 'contacted', 'quoted', 'won', 'lost']

  const createDeal = useMutation({
    mutationFn: (data: typeof formData) => pb.collection('deals').create({ ...data, value: parseFloat(data.value) || 0, userId: pb.authStore.record?.id }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['deals'] }); setFormData({ title: '', value: '', stage: 'lead' }); setCreating(false); toast.success('Deal added') },
    onError: () => toast.error('Failed to add deal'),
  })

  const updateDeal = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof editForm }) => pb.collection('deals').update(id, { ...data, value: parseFloat(data.value) || 0 }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['deals'] }); setEditing(null); toast.success('Deal updated') },
    onError: () => toast.error('Failed to update deal'),
  })

  const deleteDeal = useMutation({
    mutationFn: (id: string) => pb.collection('deals').delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['deals'] }); toast.success('Deal deleted') },
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
                <Select value={formData.stage} onValueChange={(v) => setFormData({ ...formData, stage: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{stages.map((s) => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <DialogFooter><Button type="submit" disabled={createDeal.isPending}>Add Deal</Button></DialogFooter>
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
                <div className="col-span-5 font-medium text-slate-900">{deal.title}</div>
                <div className="col-span-2 text-sm font-semibold text-slate-700">${deal.value?.toLocaleString()}</div>
                <div className="col-span-3">
                  <Badge className={`${stageColors[deal.stage] || ''} inline-flex items-center gap-1.5 text-xs`}>
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${stageDots[deal.stage] || 'bg-gray-400'}`} />
                    {deal.stage}
                  </Badge>
                </div>
                <div className="col-span-2 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Dialog open={editing === deal.id} onOpenChange={(open) => {
                    if (open) { setEditing(deal.id); setEditForm({ title: deal.title || '', value: String(deal.value || ''), stage: deal.stage || 'lead' }) }
                    else setEditing(null)
                  }}>
                    <DialogTrigger asChild><Button variant="ghost" size="icon"><Pencil className="w-3.5 h-3.5" /></Button></DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Edit Deal</DialogTitle></DialogHeader>
                      <form onSubmit={(e) => { e.preventDefault(); updateDeal.mutate({ id: deal.id, data: editForm }) }} className="space-y-4">
                        <div className="space-y-2"><Label>Title</Label><Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} required /></div>
                        <div className="space-y-2"><Label>Value ($)</Label><Input type="number" value={editForm.value} onChange={(e) => setEditForm({ ...editForm, value: e.target.value })} /></div>
                        <div className="space-y-2"><Label>Stage</Label>
                          <Select value={editForm.stage} onValueChange={(v) => setEditForm({ ...editForm, stage: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>{stages.map((s) => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <DialogFooter><Button type="submit" disabled={updateDeal.isPending}>Save</Button></DialogFooter>
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
