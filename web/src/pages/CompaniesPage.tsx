import { useState } from 'react'
import { Building2, Search, Trash2, Pencil, ArrowUpDown, Plus, Users, Briefcase, FileText, Globe, Phone, MapPin, Activity, HelpCircle } from 'lucide-react'
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

import { useNavigate, useParams } from 'react-router'

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
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const { items, totalItems, totalPages, page, perPage, search, isLoading, toggleSort, goToPage, updateSearch } =
    usePaginatedQuery({ collection: 'companies', searchFields: ['name', 'industry', 'city'] })

  const { data: routeCompany } = useQuery({
    queryKey: ['company', id],
    queryFn: async () => {
      try {
        return await pb.collection('companies').getOne(id!)
      } catch (err) {
        toast.error('Company not found')
        navigate('/companies', { replace: true })
        return null
      }
    },
    enabled: !!id,
  })

  const emptyForm = { name: '', industry: '', website: '', phone: '', address: '', city: '', country: '', notes: '', status: 'active' as CompanyStatus }
  const [formData, setFormData] = useState(emptyForm)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [editForm, setEditForm] = useState(emptyForm)
  const [selectedCompany, setSelectedCompany] = useState<any | null>(null)

  const createCompany = useMutation({
    mutationFn: (data: typeof formData) =>
      pb.collection('companies').create({ ...data, userId: pb.authStore.record?.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      setFormData(emptyForm)
      setCreating(false)
      toast.success('Company added')
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to add company'),
  })

  const updateCompany = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof editForm }) =>
      pb.collection('companies').update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      setEditing(null)
      toast.success('Company updated')
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to update company'),
  })

  const deleteCompany = useMutation({
    mutationFn: (id: string) => pb.collection('companies').delete(id),
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
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/help?tab=companies')}
            className="cursor-pointer flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-lg px-3 py-2 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Help
          </button>
          <Dialog open={creating} onOpenChange={setCreating}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-1.5" />Add Company</Button></DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader><DialogTitle>Add New Company</DialogTitle></DialogHeader>
              <CompanyForm data={formData} onChange={setFormData} onSubmit={() => createCompany.mutate(formData)} isPending={createCompany.isPending} label="Add Company" />
            </DialogContent>
          </Dialog>
        </div>
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
                <div className="col-span-4 cursor-pointer" onClick={() => navigate(`/companies/${company.id}`)}>
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
      {(selectedCompany || routeCompany) && (
        <CompanyDetailDialog
          company={selectedCompany || routeCompany}
          onClose={() => {
            setSelectedCompany(null)
            if (id) navigate('/companies')
          }}
        />
      )}
    </div>
  )
}

function CompanyDetailDialog({ company, onClose }: { company: any; onClose: () => void }) {
  const navigate = useNavigate()
  const { data, isLoading } = useQuery({
    queryKey: ['companyDetail', company.id],
    queryFn: async () => {
      const [contacts, deals, invoices] = await Promise.all([
        pb.collection('contacts').getFullList({ filter: `companyId = "${company.id}"`, sort: 'name' }),
        pb.collection('deals').getFullList({ filter: `companyId = "${company.id}"`, sort: '-id' }),
        pb.collection('invoices').getFullList({ filter: `companyId = "${company.id}"`, sort: '-id' }),
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

          {/* Right: Chronological Timeline */}
          <div className="col-span-8 p-6 space-y-6 overflow-y-auto min-h-0 flex flex-col">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" /> Company Activity Timeline
            </h4>
            
            {isLoading ? (
              <div className="text-xs text-slate-400">Loading timeline...</div>
            ) : (() => {
              const timelineEvents: any[] = []

              data?.contacts.forEach((c: any) => {
                const rawDate = c.created || c.assignedAt
                timelineEvents.push({
                  id: c.id,
                  type: 'contact',
                  date: rawDate ? new Date(rawDate) : new Date(),
                  title: c.name,
                  subtitle: c.title || 'Contact added',
                  meta: c.email,
                  badge: null,
                })
              })

              data?.deals.forEach((d: any) => {
                const rawDate = d.created || d.expectedCloseDate || d.assignedAt
                timelineEvents.push({
                  id: d.id,
                  type: 'deal',
                  date: rawDate ? new Date(rawDate) : new Date(),
                  title: d.title,
                  subtitle: 'Deal created',
                  meta: `$${(d.value || 0).toLocaleString()}`,
                  badge: d.stage,
                })
              })

              data?.invoices.forEach((i: any) => {
                const rawDate = i.created || i.issuedDate || i.assignedAt
                timelineEvents.push({
                  id: i.id,
                  type: 'invoice',
                  date: rawDate ? new Date(rawDate) : new Date(),
                  title: i.title,
                  subtitle: 'Invoice issued',
                  meta: `$${(i.amount || 0).toLocaleString()}`,
                  badge: i.status,
                })
              })

              timelineEvents.sort((a, b) => b.date.getTime() - a.date.getTime())

              if (timelineEvents.length === 0) {
                return (
                  <p className="text-xs text-slate-400 italic py-6">
                    No activity, contacts, or financial transactions found for this company yet.
                  </p>
                )
              }

              return (
                <div className="relative pl-6 ml-4 border-l-2 border-slate-100 space-y-6 flex-1 py-2">
                  {timelineEvents.map((event) => {
                    const Icon = {
                      contact: Users,
                      deal: Briefcase,
                      invoice: FileText,
                    }[event.type as 'contact' | 'deal' | 'invoice'] as any

                    const colors = {
                      contact: 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:border-indigo-300',
                      deal: 'bg-orange-50 text-orange-600 border-orange-100 hover:border-orange-300',
                      invoice: 'bg-violet-50 text-violet-600 border-violet-100 hover:border-violet-300',
                    }[event.type as 'contact' | 'deal' | 'invoice']

                    const dotColors = {
                      contact: 'bg-indigo-100 text-indigo-600 border-indigo-200',
                      deal: 'bg-orange-100 text-orange-600 border-orange-200',
                      invoice: 'bg-violet-100 text-violet-600 border-violet-200',
                    }[event.type as 'contact' | 'deal' | 'invoice']

                    const dateString = event.date.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })

                    const handleClick = () => {
                      onClose()
                      if (event.type === 'contact') {
                        navigate(`/crm/contacts/${event.id}`)
                      } else if (event.type === 'deal') {
                        navigate(`/crm/deals/${event.id}`)
                      } else if (event.type === 'invoice') {
                        navigate(`/invoices/${event.id}`)
                      }
                    }

                    return (
                      <div key={event.id} className="relative group/item">
                        {/* Timeline Node Icon Dot */}
                        <div className={`absolute -left-[35px] top-1.5 w-6.5 h-6.5 rounded-full border-2 border-white flex items-center justify-center shadow-sm z-10 transition-transform group-hover/item:scale-110 ${dotColors}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>

                        {/* Interactive Event Card */}
                        <div
                          onClick={handleClick}
                          className={`p-3.5 rounded-xl border bg-white shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${colors}`}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">
                                {event.type}
                              </span>
                              <span className="text-[10px] opacity-40">•</span>
                              <span className="text-[10px] opacity-60 font-medium">
                                {dateString}
                              </span>
                            </div>
                            <h5 className="text-sm font-semibold text-slate-800 truncate mt-1">
                              {event.title}
                            </h5>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {event.subtitle}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-auto">
                            {event.meta && (
                              <span className="text-xs font-bold text-slate-700 bg-slate-100/80 px-2 py-1 rounded-md">
                                {event.meta}
                              </span>
                            )}
                            {event.badge && (
                              <Badge className="text-[9px] font-bold capitalize px-2 py-0.5 tracking-wider shadow-none">
                                {event.badge}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })()}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
