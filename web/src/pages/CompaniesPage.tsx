import { useState } from 'react'
import { Building2, Search, Trash2, Pencil, ArrowUpDown, Plus, Users, Briefcase, FileText, Globe, Phone, MapPin } from 'lucide-react'
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
import { companyService, isAppError } from '@/services'

type CompanyStatus = 'lead' | 'active' | 'inactive'

const statusColors: Record<CompanyStatus, string> = {
  lead:     'bg-blue-50 text-blue-700 border-blue-100',
  active:   'bg-emerald-50 text-emerald-700 border-emerald-100',
  inactive: 'bg-slate-100 text-slate-500 border-slate-200',
}

const industries = [
  'Technology', 'Finance', 'Healthcare', 'Retail', 'Manufacturing',
  'Real Estate', 'Education', 'Consulting', 'Media', 'Other'
]

export function CompaniesPage() {
  const queryClient = useQueryClient()
  const { items, totalItems, totalPages, page, perPage, search, isLoading, toggleSort, goToPage, updateSearch } =
    usePaginatedQuery({ collection: 'companies', searchFields: ['name', 'industry', 'city'] })

  const emptyForm = { name: '', industry: '', website: '', phone: '', address: '', city: '', country: '', notes: '', status: 'active' as CompanyStatus }
  const [formData, setFormData] = useState(emptyForm)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [editForm, setEditForm] = useState(emptyForm)
  const [selectedCompany, setSelectedCompany] = useState<any | null>(null)

  const actorId = pb.authStore.record?.id || ''

  const createCompany = useMutation({
    mutationFn: (data: typeof formData) =>
      companyService.create({ ...data, userId: pb.authStore.record?.id }, actorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      setFormData(emptyForm)
      setCreating(false)
      toast.success('Company added')
    },
    onError: (err) => toast.error(isAppError(err) ? err.message : 'Failed to add company'),
  })

  const updateCompany = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof editForm }) =>
      companyService.update(id, data, actorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      setEditing(null)
      toast.success('Company updated')
    },
    onError: (err) => toast.error(isAppError(err) ? err.message : 'Failed to update company'),
  })

  const deleteCompany = useMutation({
    mutationFn: (id: string) => companyService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      toast.success('Company deleted')
    },
    onError: () => toast.error('Failed to delete company'),
  })

  const CompanyForm = ({ data, onChange, onSubmit, isPending, label }: any) => (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit() }} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1"><Label>Company Name *</Label><Input placeholder="Acme Corp" value={data.name} onChange={(e) => onChange({ ...data, name: e.target.value })} required /></div>
        <div className="space-y-1"><Label>Industry</Label>
          <Select value={data.industry || 'none'} onValueChange={(v) => onChange({ ...data, industry: v === 'none' ? '' : v })}>
            <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">— Select —</SelectItem>
              {industries.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1"><Label>Status</Label>
          <Select value={data.status} onValueChange={(v) => onChange({ ...data, status: v as CompanyStatus })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="lead">Lead</SelectItem>
              <SelectItem value="active">Active Client</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1"><Label>Website</Label><Input placeholder="https://acme.com" value={data.website} onChange={(e) => onChange({ ...data, website: e.target.value })} /></div>
        <div className="space-y-1"><Label>Phone</Label><Input placeholder="+1 555 000 0000" value={data.phone} onChange={(e) => onChange({ ...data, phone: e.target.value })} /></div>
        <div className="col-span-2 space-y-1"><Label>Address</Label><Input placeholder="123 Main St" value={data.address} onChange={(e) => onChange({ ...data, address: e.target.value })} /></div>
        <div className="space-y-1"><Label>City</Label><Input placeholder="San Francisco" value={data.city} onChange={(e) => onChange({ ...data, city: e.target.value })} /></div>
        <div className="space-y-1"><Label>Country</Label><Input placeholder="USA" value={data.country} onChange={(e) => onChange({ ...data, country: e.target.value })} /></div>
        <div className="col-span-2 space-y-1"><Label>Notes</Label><Input placeholder="Internal notes..." value={data.notes} onChange={(e) => onChange({ ...data, notes: e.target.value })} /></div>
      </div>
      <DialogFooter><Button type="submit" disabled={isPending} className="bg-[rgb(var(--ns-accent))] hover:bg-[rgb(var(--ns-accent-dk))] text-white">{label}</Button></DialogFooter>
    </form>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Companies</h2>
          <p className="text-sm text-slate-500 mt-0.5">{totalItems} compan{totalItems !== 1 ? 'ies' : 'y'} total</p>
        </div>
        <Dialog open={creating} onOpenChange={setCreating}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-1.5" />Add Company</Button></DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>Add New Company</DialogTitle></DialogHeader>
            <CompanyForm data={formData} onChange={setFormData} onSubmit={() => createCompany.mutate(formData)} isPending={createCompany.isPending} label="Add Company" />
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input value={search} onChange={(e) => updateSearch(e.target.value)} placeholder="Search companies..." className="pl-10" />
      </div>

      {isLoading ? <TableSkeleton rows={5} /> : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wide">
            <button className="col-span-4 flex items-center gap-1 hover:text-slate-600" onClick={() => toggleSort('name')}>Company <ArrowUpDown className="w-3 h-3" /></button>
            <div className="col-span-3">Industry</div>
            <div className="col-span-2">Location</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-16">
              <Building2 className="w-10 h-10 mx-auto mb-3 text-slate-200" />
              <p className="text-sm font-medium text-slate-500 mb-4">No companies yet</p>
              <Button size="sm" variant="outline" onClick={() => setCreating(true)}>Add your first company</Button>
            </div>
          ) : (
            items.map((company: any) => (
              <div key={company.id} className="group grid grid-cols-12 gap-4 px-4 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors items-center">
                <div className="col-span-4 cursor-pointer" onClick={() => setSelectedCompany(company)}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold flex-shrink-0">
                      {company.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="min-w-0">
                      <span className="font-medium text-slate-900 truncate block group-hover:text-[rgb(var(--ns-accent))] transition-colors">{company.name}</span>
                      {company.website && <span className="text-xs text-slate-400 truncate block">{company.website.replace(/^https?:\/\//, '')}</span>}
                    </div>
                  </div>
                </div>
                <div className="col-span-3 text-sm text-slate-500">{company.industry || '—'}</div>
                <div className="col-span-2 text-sm text-slate-400 truncate">{[company.city, company.country].filter(Boolean).join(', ') || '—'}</div>
                <div className="col-span-1">
                  <Badge className={`${statusColors[company.status as CompanyStatus] || statusColors.active} text-[10px] px-1.5 py-0.5 capitalize`}>
                    {company.status || 'active'}
                  </Badge>
                </div>
                <div className="col-span-2 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Dialog open={editing === company.id} onOpenChange={(open) => {
                    if (open) {
                      setEditing(company.id)
                      setEditForm({ name: company.name || '', industry: company.industry || '', website: company.website || '', phone: company.phone || '', address: company.address || '', city: company.city || '', country: company.country || '', notes: company.notes || '', status: company.status || 'active' })
                    } else setEditing(null)
                  }}>
                    <DialogTrigger asChild><Button variant="ghost" size="icon"><Pencil className="w-3.5 h-3.5" /></Button></DialogTrigger>
                    <DialogContent className="sm:max-w-lg">
                      <DialogHeader><DialogTitle>Edit Company</DialogTitle></DialogHeader>
                      <CompanyForm data={editForm} onChange={setEditForm} onSubmit={() => updateCompany.mutate({ id: company.id, data: editForm })} isPending={updateCompany.isPending} label="Save Changes" />
                    </DialogContent>
                  </Dialog>
                  <Button variant="ghost" size="icon" onClick={() => { if (confirm('Delete this company? Contacts linked to it will not be deleted.')) deleteCompany.mutate(company.id) }}>
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </Button>
                </div>
              </div>
            ))
          )}
          <DataTablePagination page={page} totalPages={totalPages} totalItems={totalItems} perPage={perPage} onPageChange={goToPage} />
        </div>
      )}

      {/* Company Detail Drawer */}
      {selectedCompany && (
        <CompanyDetailDialog company={selectedCompany} onClose={() => setSelectedCompany(null)} />
      )}
    </div>
  )
}

function CompanyDetailDialog({ company, onClose }: { company: any; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['companyDetail', company.id],
    queryFn: async () => {
      const [contacts, deals, invoices] = await Promise.all([
        pb.collection('contacts').getFullList({ filter: `companyId = "${company.id}"`, sort: 'name' }),
        pb.collection('deals').getFullList({ filter: `companyId = "${company.id}"`, sort: '-created' }),
        pb.collection('invoices').getFullList({ filter: `companyId = "${company.id}"`, sort: '-created' }),
      ])
      return { contacts, deals, invoices }
    }
  })

  const totalRevenue = (data?.invoices || []).filter((i: any) => i.status === 'approved').reduce((s: number, i: any) => s + (i.amount || 0), 0)
  const wonDeals = (data?.deals || []).filter((d: any) => d.stage === 'won').length

  return (
    <Dialog open={true} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-slate-900">
            <Building2 className="w-5 h-5 text-indigo-500" />
            {company.name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto grid grid-cols-12 divide-x divide-slate-100 min-h-0">
          {/* Left: Company Info */}
          <div className="col-span-4 p-5 bg-slate-50/50 space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 bg-white rounded-lg border border-slate-100 p-3 text-center">
                <div className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-1">Revenue</div>
                <div className="text-lg font-bold text-emerald-600">${totalRevenue.toLocaleString()}</div>
              </div>
              <div className="bg-white rounded-lg border border-slate-100 p-3 text-center">
                <div className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-1">Contacts</div>
                <div className="text-xl font-bold text-slate-800">{isLoading ? '—' : data?.contacts.length}</div>
              </div>
              <div className="bg-white rounded-lg border border-slate-100 p-3 text-center">
                <div className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-1">Won Deals</div>
                <div className="text-xl font-bold text-slate-800">{isLoading ? '—' : wonDeals}</div>
              </div>
            </div>

            {company.industry && <div className="flex items-center gap-2 text-slate-600"><Briefcase className="w-3.5 h-3.5 text-slate-400" />{company.industry}</div>}
            {company.phone && <div className="flex items-center gap-2 text-slate-600"><Phone className="w-3.5 h-3.5 text-slate-400" />{company.phone}</div>}
            {company.website && <div className="flex items-center gap-2 text-slate-600"><Globe className="w-3.5 h-3.5 text-slate-400" /><a href={company.website} target="_blank" rel="noreferrer" className="hover:underline text-indigo-600 truncate">{company.website}</a></div>}
            {(company.city || company.country) && <div className="flex items-center gap-2 text-slate-600"><MapPin className="w-3.5 h-3.5 text-slate-400" />{[company.city, company.country].filter(Boolean).join(', ')}</div>}
            {company.notes && <p className="text-xs text-slate-500 italic border-t border-slate-100 pt-3">{company.notes}</p>}
          </div>

          {/* Right: Linked Contacts & Deals */}
          <div className="col-span-8 p-5 space-y-5 overflow-y-auto">
            {/* Contacts */}
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Contacts ({data?.contacts.length || 0})</h4>
              {isLoading ? <div className="text-xs text-slate-400">Loading...</div> : data?.contacts.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No contacts linked to this company yet.</p>
              ) : (
                <div className="space-y-1.5">
                  {data?.contacts.map((c: any) => (
                    <div key={c.id} className="flex items-center gap-2.5 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                      <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center flex-shrink-0">{c.name?.charAt(0)?.toUpperCase()}</div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-slate-800 truncate">{c.name}</div>
                        {c.title && <div className="text-xs text-slate-400">{c.title}</div>}
                      </div>
                      <div className="ml-auto text-xs text-slate-400 truncate">{c.email}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Deals */}
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5" /> Deals ({data?.deals.length || 0})</h4>
              {isLoading ? <div className="text-xs text-slate-400">Loading...</div> : data?.deals.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No deals linked yet.</p>
              ) : (
                <div className="space-y-1.5">
                  {data?.deals.map((d: any) => (
                    <div key={d.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                      <span className="text-sm font-medium text-slate-800 truncate">{d.title}</span>
                      <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                        <span className="text-xs font-semibold text-slate-600">${(d.value || 0).toLocaleString()}</span>
                        <Badge className="text-[10px] capitalize px-1.5">{d.stage}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Invoices */}
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Invoices ({data?.invoices.length || 0})</h4>
              {isLoading ? <div className="text-xs text-slate-400">Loading...</div> : data?.invoices.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No invoices linked yet.</p>
              ) : (
                <div className="space-y-1.5">
                  {data?.invoices.map((i: any) => (
                    <div key={i.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                      <span className="text-sm font-medium text-slate-800 truncate">{i.title}</span>
                      <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                        <span className="text-xs font-semibold text-slate-600">${(i.amount || 0).toLocaleString()}</span>
                        <Badge className="text-[10px] capitalize px-1.5">{i.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
