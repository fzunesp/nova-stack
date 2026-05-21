import { useState, useEffect } from 'react'
import { FileText, Search, Trash2, Pencil, ArrowUpDown, Plus, X, ChevronDown, ChevronRight, Download, Send, Copy } from 'lucide-react'
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
import { useLocation, useNavigate, useParams } from 'react-router'
import type { Status } from '@/services'
import { generateInvoicePdf } from '@/lib/pdf'

const statusLabels: Record<Status, string> = {
  draft: 'Draft',
  active: 'Active',
  pending: 'Pending payment',
  approved: 'Paid',
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

interface LineItem {
  productId: string
  name: string
  price: number
  quantity: number
  total: number
}

export function InvoicesPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const initialSearch = location.state?.search || ''
  const { items, totalItems, totalPages, page, perPage, search, isLoading, toggleSort, goToPage, updateSearch } =
    usePaginatedQuery({ collection: 'invoices', searchFields: ['title'], expand: 'dealId,dealId.contactId,dealId.contactId.companyId', initialSearch })

  const [formData, setFormData] = useState({ title: '', amount: '', status: 'draft' as Status, dueDate: '', dealId: '' })
  const [creating, setCreating] = useState(location.state?.openCreate === true)
  const [createLineItems, setCreateLineItems] = useState<LineItem[]>([])
  
  const [editing, setEditing] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ title: '', amount: '', status: 'draft' as Status, dueDate: '', dealId: '' })
  const [editLineItems, setEditLineItems] = useState<LineItem[]>([])
  const [expandedInvoices, setExpandedInvoices] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (id) {
      setExpandedInvoices(prev => ({ ...prev, [id]: true }))
    }
  }, [id])

  useEffect(() => {
    if (location.state?.openCreate && location.state?.dealId) {
      setFormData({
        title: `Invoice for Deal: ${location.state.dealTitle || 'Opportunity'}`,
        amount: String(location.state.dealValue || ''),
        status: 'draft',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        dealId: location.state.dealId,
      })
      setCreateLineItems([
        {
          productId: '',
          name: location.state.dealTitle || 'Project Delivery',
          price: Number(location.state.dealValue) || 0,
          quantity: 1,
          total: Number(location.state.dealValue) || 0,
        }
      ])
      setCreating(true)
      // Clean up the state so the dialog doesn't re-trigger on subsequent re-renders/navs
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.state])

  const toggleExpand = (invoiceId: string) => {
    const isCurrentlyExpanded = !!expandedInvoices[invoiceId]
    setExpandedInvoices(prev => ({ ...prev, [invoiceId]: !prev[invoiceId] }))
    if (!isCurrentlyExpanded) {
      navigate(`/invoices/${invoiceId}`)
    } else if (id === invoiceId) {
      navigate('/invoices')
    }
  }

  // Fetch active products
  const { data: productsData } = useQuery({
    queryKey: ['products-all'],
    queryFn: () => pb.collection('products').getFullList({ filter: "status = 'active'", sort: 'name' })
  })
  const products = productsData || []

  // Fetch deals for dropdown
  const { data: dealsData } = useQuery({
    queryKey: ['deals-all'],
    queryFn: () => pb.collection('deals').getFullList({ expand: 'contactId', sort: '-id' })
  })
  const deals = dealsData || []

  const createInvoice = useMutation({
    mutationFn: (data: typeof formData & { lineItems: LineItem[] }) =>
      pb.collection('invoices').create({ 
        ...data, 
        amount: parseFloat(data.amount) || 0, 
        userId: pb.authStore.record?.id,
        lineItems: data.lineItems,
        dealId: data.dealId || undefined
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      setFormData({ title: '', amount: '', status: 'draft', dueDate: '', dealId: '' })
      setCreateLineItems([])
      setCreating(false)
      toast.success('Invoice created')
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to create invoice'),
  })

  const updateInvoice = useMutation({
    mutationFn: ({ id, data, lineItems }: { id: string; data: typeof editForm; lineItems: LineItem[] }) =>
      pb.collection('invoices').update(id, { 
        ...data, 
        amount: parseFloat(data.amount) || 0,
        lineItems,
        dealId: data.dealId || undefined
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      setEditing(null)
      setEditLineItems([])
      toast.success('Invoice updated')
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to update invoice'),
  })

  const deleteInvoice = useMutation({
    mutationFn: (id: string) => pb.collection('invoices').delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      toast.success('Invoice deleted')
    },
    onError: () => toast.error('Failed to delete invoice'),
  })

  // Templates query
  const { data: templates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: () => pb.collection('templates').getFullList({ sort: '-created' })
  })

  // Send Invoice Dialog States
  const [sendingInvoice, setSendingInvoice] = useState<any>(null)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [emailSubject, setEmailSubject] = useState<string>('')
  const [emailBody, setEmailBody] = useState<string>('')

  // Template Formatter Helper
  const formatTemplate = (templateSubject: string, templateContent: string, invoice: any) => {
    if (!invoice) return { subject: '', content: '' }

    const contactName = invoice.expand?.dealId?.expand?.contactId?.name || invoice.expand?.contactId?.name || 'Valued Client'
    const companyName = invoice.expand?.dealId?.expand?.contactId?.expand?.companyId?.name || invoice.expand?.contactId?.expand?.companyId?.name || ''
    const dealTitle = invoice.expand?.dealId?.title || ''
    const invoiceNumber = invoice.title || invoice.id
    const invoiceAmount = invoice.amount ? `$${invoice.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}` : '$0.00'
    const dueDate = invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '—'
    const senderName = pb.authStore.record?.name || 'Our Team'

    const replacements: Record<string, string> = {
      '{client_name}': contactName,
      '{contact_name}': contactName,
      '{company_name}': companyName,
      '{deal_title}': dealTitle,
      '{invoice_number}': invoiceNumber,
      '{invoice_amount}': invoiceAmount,
      '{due_date}': dueDate,
      '{sender_name}': senderName,
    }

    let sub = templateSubject
    let body = templateContent

    Object.entries(replacements).forEach(([placeholder, value]) => {
      sub = sub.replaceAll(placeholder, value)
      body = body.replaceAll(placeholder, value)
    })

    return { subject: sub, content: body }
  }

  const handleSendInvoiceInit = (invoice: any) => {
    setSendingInvoice(invoice)
    const defaultTemplate = templates.find((t: any) => t.category === 'invoice_reminder')
    if (defaultTemplate) {
      setSelectedTemplateId(defaultTemplate.id)
      const formatted = formatTemplate(defaultTemplate.subject || '', defaultTemplate.content || '', invoice)
      setEmailSubject(formatted.subject)
      setEmailBody(formatted.content)
    } else {
      setSelectedTemplateId('__default__')
      setEmailSubject(`Invoice ${invoice.title || invoice.id} from Nova Stack`)
      setEmailBody(`Hi,\n\nPlease find attached our invoice ${invoice.title || invoice.id} for $${invoice.amount?.toLocaleString()}.\n\nBest regards,\n${pb.authStore.record?.name || 'Our Team'}`)
    }
  }

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId)
    if (templateId === '__default__') {
      setEmailSubject(`Invoice ${sendingInvoice.title || sendingInvoice.id} from Nova Stack`)
      setEmailBody(`Hi,\n\nPlease find attached our invoice ${sendingInvoice.title || sendingInvoice.id} for $${sendingInvoice.amount?.toLocaleString()}.\n\nBest regards,\n${pb.authStore.record?.name || 'Our Team'}`)
      return
    }
    const template = templates.find((t: any) => t.id === templateId)
    if (template) {
      const formatted = formatTemplate(template.subject || '', template.content || '', sendingInvoice)
      setEmailSubject(formatted.subject)
      setEmailBody(formatted.content)
    }
  }

  const sendInvoice = useMutation({
    mutationFn: async ({ id, subject, body }: { id: string; subject?: string; body?: string }) => {
      const token = pb.authStore.token
      const res = await fetch(`${pb.baseUrl || 'http://localhost:8090'}/api/send-invoice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ invoiceId: id, subject, body })
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || 'Failed to send invoice')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      toast.success('Invoice sent and marked as pending')
      setSendingInvoice(null)
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to send invoice')
    }
  })

  const addCreateLineItem = () => {
    setCreateLineItems([...createLineItems, { productId: '', name: '', price: 0, quantity: 1, total: 0 }])
  }

  const updateCreateLineItem = (index: number, field: keyof LineItem, value: any) => {
    const updated = createLineItems.map((item, idx) => {
      if (idx !== index) return item
      const newItem = { ...item, [field]: value }
      if (field === 'productId') {
        const prod = products.find(p => p.id === value)
        if (prod) {
          newItem.name = prod.name
          newItem.price = prod.price
        }
      }
      newItem.total = (Number(newItem.price) || 0) * (Number(newItem.quantity) || 0)
      return newItem
    })
    setCreateLineItems(updated)
    const totalAmount = updated.reduce((sum, item) => sum + item.total, 0)
    setFormData(prev => ({ ...prev, amount: totalAmount.toString() }))
  }

  const removeCreateLineItem = (index: number) => {
    const updated = createLineItems.filter((_, idx) => idx !== index)
    setCreateLineItems(updated)
    const totalAmount = updated.reduce((sum, item) => sum + item.total, 0)
    setFormData(prev => ({ ...prev, amount: totalAmount.toString() }))
  }

  const addEditLineItem = () => {
    setEditLineItems([...editLineItems, { productId: '', name: '', price: 0, quantity: 1, total: 0 }])
  }

  const updateEditLineItem = (index: number, field: keyof LineItem, value: any) => {
    const updated = editLineItems.map((item, idx) => {
      if (idx !== index) return item
      const newItem = { ...item, [field]: value }
      if (field === 'productId') {
        const prod = products.find(p => p.id === value)
        if (prod) {
          newItem.name = prod.name
          newItem.price = prod.price
        }
      }
      newItem.total = (Number(newItem.price) || 0) * (Number(newItem.quantity) || 0)
      return newItem
    })
    setEditLineItems(updated)
    const totalAmount = updated.reduce((sum, item) => sum + item.total, 0)
    setEditForm(prev => ({ ...prev, amount: totalAmount.toString() }))
  }

  const removeEditLineItem = (index: number) => {
    const updated = editLineItems.filter((_, idx) => idx !== index)
    setEditLineItems(updated)
    const totalAmount = updated.reduce((sum, item) => sum + item.total, 0)
    setEditForm(prev => ({ ...prev, amount: totalAmount.toString() }))
  }

  const allInvoices = items as any[]
  const totalOutstanding = allInvoices.filter((i) => i.status === 'pending' || i.status === 'draft' || i.status === 'active').reduce((s, i) => s + (i.amount || 0), 0)
  const totalPaid = allInvoices.filter((i) => i.status === 'approved').reduce((s, i) => s + (i.amount || 0), 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Invoices</h2>
          <p className="text-sm text-slate-500 mt-0.5">{totalItems} invoice{totalItems !== 1 ? 's' : ''} total</p>
        </div>
        <Dialog open={creating} onOpenChange={setCreating}>
          <DialogTrigger asChild><Button>Add Invoice</Button></DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader><DialogTitle>Add New Invoice</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); createInvoice.mutate({ ...formData, lineItems: createLineItems }) }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1"><Label>Title</Label><Input placeholder="Invoice title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required /></div>
                
                <div className="col-span-2 space-y-1">
                  <Label>Deal / Project *</Label>
                  <Select value={formData.dealId} onValueChange={(v) => setFormData({ ...formData, dealId: v })}>
                    <SelectTrigger className={!formData.dealId ? 'border-red-200' : ''}>
                      <SelectValue placeholder="— Select a deal —" />
                    </SelectTrigger>
                    <SelectContent>
                      {deals.map((d: any) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.title} {d.expand?.contactId ? `— ${d.expand.contactId.name}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1"><Label>Due Date</Label><Input type="date" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} /></div>
                <div className="space-y-1"><Label>Status</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as Status })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(statusLabels) as Status[]).map((s) => (
                        <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Line Items */}
              <div className="space-y-2 mt-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <Label className="text-sm font-semibold text-slate-700">Line Items</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addCreateLineItem} className="h-8 text-xs">
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Item
                  </Button>
                </div>
                
                {createLineItems.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-slate-200 rounded-lg text-slate-400 text-xs">
                    No items added yet. Click 'Add Item' to start building this invoice.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {createLineItems.map((item, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-5">
                          <Select value={item.productId} onValueChange={(v) => updateCreateLineItem(index, 'productId', v)}>
                            <SelectTrigger className="h-9"><SelectValue placeholder="Select Product" /></SelectTrigger>
                            <SelectContent>
                              {products.map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2">
                          <Input type="number" min="1" placeholder="Qty" value={item.quantity} onChange={e => updateCreateLineItem(index, 'quantity', parseInt(e.target.value) || 0)} className="h-9" />
                        </div>
                        <div className="col-span-3">
                          <Input type="number" step="0.01" min="0" placeholder="Price" value={item.price} onChange={e => updateCreateLineItem(index, 'price', parseFloat(e.target.value) || 0)} className="h-9" />
                        </div>
                        <div className="col-span-2 flex items-center justify-between gap-1 pl-1">
                          <span className="text-xs font-mono font-semibold text-slate-600">${item.total.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
                          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50" onClick={() => removeCreateLineItem(index)}>
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-2">
                <span className="text-sm font-semibold text-slate-700">Total Invoice Amount:</span>
                <span className="text-lg font-bold text-slate-900">${(parseFloat(formData.amount) || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>

              <DialogFooter className="pt-2"><Button type="submit" disabled={createInvoice.isPending || !formData.dealId} className="bg-[rgb(var(--ns-accent))] hover:bg-[rgb(var(--ns-accent-dk))] text-white">{createInvoice.isPending ? 'Adding...' : 'Add Invoice'}</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Outstanding</p>
          <p className="text-2xl font-bold text-indigo-600">${totalOutstanding.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Paid</p>
          <p className="text-2xl font-bold text-emerald-600">${totalPaid.toLocaleString()}</p>
        </div>
      </div>

      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input value={search} onChange={(e) => updateSearch(e.target.value)} placeholder="Search invoices..." className="pl-10" />
      </div>

      {isLoading ? <TableSkeleton rows={5} /> : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wide">
            <button className="col-span-5 flex items-center gap-1 hover:text-slate-600" onClick={() => toggleSort('title')}>Title <ArrowUpDown className="w-3 h-3" /></button>
            <button className="col-span-2 flex items-center gap-1 hover:text-slate-600" onClick={() => toggleSort('amount')}>Amount <ArrowUpDown className="w-3 h-3" /></button>
            <div className="col-span-3">Status</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="w-10 h-10 mx-auto mb-3 text-slate-200" />
              <p className="text-sm font-medium text-slate-500 mb-4">No invoices yet</p>
              <Button size="sm" variant="outline" onClick={() => setCreating(true)}>Create your first invoice</Button>
            </div>
          ) : (
            items.map((invoice: any) => (
              <div key={invoice.id} className="border-b border-slate-50 last:border-0">
                <div className="group grid grid-cols-12 gap-4 px-4 py-3 hover:bg-slate-50 transition-colors items-center">
                  <div className="col-span-5 flex items-start gap-2">
                    <button 
                      onClick={() => toggleExpand(invoice.id)}
                      className="p-1 mt-0.5 rounded hover:bg-slate-200/50 text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0"
                    >
                      {expandedInvoices[invoice.id] ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <div className="min-w-0">
                      <span 
                        onClick={() => toggleExpand(invoice.id)}
                        className="font-medium text-slate-900 cursor-pointer hover:text-[rgb(var(--ns-accent))] transition-colors block truncate"
                      >
                        {invoice.title}
                      </span>
                      {invoice.expand?.dealId && (
                        <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5 font-medium truncate">
                          <span>Project:</span>
                          <button
                            onClick={() => navigate(`/crm/deals/${invoice.expand.dealId.id}`)}
                            className="text-indigo-500 hover:text-indigo-700 hover:underline font-semibold"
                          >
                            {invoice.expand.dealId.title}
                          </button>
                          {invoice.expand.dealId.expand?.contactId && (
                            <>
                              <span className="text-slate-300">|</span>
                              <button
                                onClick={() => navigate(`/crm/contacts/${invoice.expand.dealId.expand.contactId.id}`)}
                                className="text-indigo-500 hover:text-indigo-700 hover:underline font-semibold"
                              >
                                ({invoice.expand.dealId.expand.contactId.name})
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="col-span-2 text-sm font-semibold text-slate-700">${invoice.amount?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                  <div className="col-span-3">
                    <Badge className={`${statusColors[invoice.status as Status] || statusColors.draft} inline-flex items-center gap-1.5 text-xs`}>
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusDots[invoice.status as Status] || statusDots.draft}`} />
                      {statusLabels[invoice.status as Status] || invoice.status}
                    </Badge>
                  </div>
                  <div className="col-span-2 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Dialog open={editing === invoice.id} onOpenChange={(open) => {
                      if (open) { 
                        setEditing(invoice.id)
                        setEditForm({ title: invoice.title || '', amount: String(invoice.amount || ''), status: invoice.status || 'draft', dueDate: invoice.dueDate?.split('T')[0] || '', dealId: invoice.dealId || '' })
                        setEditLineItems(Array.isArray(invoice.lineItems) ? invoice.lineItems : [])
                      } else {
                        setEditing(null)
                      }
                    }}>
                      <DialogTrigger asChild><Button variant="ghost" size="icon"><Pencil className="w-3.5 h-3.5" /></Button></DialogTrigger>
                      <DialogContent className="sm:max-w-2xl">
                        <DialogHeader><DialogTitle>Edit Invoice</DialogTitle></DialogHeader>
                        <form onSubmit={(e) => { e.preventDefault(); updateInvoice.mutate({ id: invoice.id, data: editForm, lineItems: editLineItems }) }} className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 space-y-1"><Label>Title</Label><Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} required /></div>
                            
                            <div className="col-span-2 space-y-1">
                              <Label>Deal / Project *</Label>
                              <Select value={editForm.dealId} onValueChange={(v) => setEditForm({ ...editForm, dealId: v })}>
                                <SelectTrigger className={!editForm.dealId ? 'border-red-200' : ''}>
                                  <SelectValue placeholder="— Select a deal —" />
                                </SelectTrigger>
                                <SelectContent>
                                  {deals.map((d: any) => (
                                    <SelectItem key={d.id} value={d.id}>
                                      {d.title} {d.expand?.contactId ? `— ${d.expand.contactId.name}` : ''}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-1"><Label>Due Date</Label><Input type="date" value={editForm.dueDate} onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })} /></div>
                            <div className="space-y-1"><Label>Status</Label>
                              <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v as Status })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {(Object.keys(statusLabels) as Status[]).map((s) => (
                                    <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {/* Line Items */}
                          <div className="space-y-2 mt-4">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                              <Label className="text-sm font-semibold text-slate-700">Line Items</Label>
                              <Button type="button" variant="outline" size="sm" onClick={addEditLineItem} className="h-8 text-xs">
                                <Plus className="w-3.5 h-3.5 mr-1" /> Add Item
                              </Button>
                            </div>
                            
                            {editLineItems.length === 0 ? (
                              <div className="text-center py-6 border border-dashed border-slate-200 rounded-lg text-slate-400 text-xs">
                                No items added yet. Click 'Add Item' to start building this invoice.
                              </div>
                            ) : (
                              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                {editLineItems.map((item, index) => (
                                  <div key={index} className="grid grid-cols-12 gap-2 items-center">
                                    <div className="col-span-5">
                                      <Select value={item.productId} onValueChange={(v) => updateEditLineItem(index, 'productId', v)}>
                                        <SelectTrigger className="h-9"><SelectValue placeholder="Select Product" /></SelectTrigger>
                                        <SelectContent>
                                          {products.map(p => (
                                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="col-span-2">
                                      <Input type="number" min="1" placeholder="Qty" value={item.quantity} onChange={e => updateEditLineItem(index, 'quantity', parseInt(e.target.value) || 0)} className="h-9" />
                                    </div>
                                    <div className="col-span-3">
                                      <Input type="number" step="0.01" min="0" placeholder="Price" value={item.price} onChange={e => updateEditLineItem(index, 'price', parseFloat(e.target.value) || 0)} className="h-9" />
                                    </div>
                                    <div className="col-span-2 flex items-center justify-between gap-1 pl-1">
                                      <span className="text-xs font-mono font-semibold text-slate-600">${item.total.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
                                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50" onClick={() => removeEditLineItem(index)}>
                                        <X className="w-3.5 h-3.5" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-2">
                            <span className="text-sm font-semibold text-slate-700">Total Invoice Amount:</span>
                            <span className="text-lg font-bold text-slate-900">${(parseFloat(editForm.amount) || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                          </div>

                          <DialogFooter className="pt-2"><Button type="submit" disabled={updateInvoice.isPending || !editForm.dealId} className="bg-[rgb(var(--ns-accent))] hover:bg-[rgb(var(--ns-accent-dk))] text-white">Save</Button></DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                    <Button variant="ghost" size="icon" onClick={() => generateInvoicePdf(invoice)} title="Download PDF">
                      <Download className="w-3.5 h-3.5 text-slate-400 hover:text-[rgb(var(--ns-accent))]" />
                    </Button>
                    {invoice.status === 'draft' && (
                      <Button variant="ghost" size="icon" onClick={() => handleSendInvoiceInit(invoice)} disabled={sendInvoice.isPending} title="Send Invoice">
                        <Send className="w-3.5 h-3.5 text-indigo-500 hover:text-indigo-600" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => { if (confirm('Delete this invoice?')) deleteInvoice.mutate(invoice.id) }}>
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </Button>
                  </div>
                </div>

                {expandedInvoices[invoice.id] && (
                  <div className="px-12 pb-4 pt-1 bg-slate-50/50 border-t border-slate-100/50">
                    <div className="max-w-2xl mt-2 space-y-2">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Line Items Breakdown</div>
                      {(!invoice.lineItems || invoice.lineItems.length === 0) ? (
                        <p className="text-xs text-slate-400 italic">No line items added to this invoice.</p>
                      ) : (
                        <div className="border border-slate-100 rounded-lg overflow-hidden bg-white shadow-sm">
                          <table className="min-w-full divide-y divide-slate-100 text-xs">
                            <thead className="bg-slate-50 text-slate-500 font-medium">
                              <tr>
                                <th className="px-4 py-2.5 text-left">Item / Product</th>
                                <th className="px-4 py-2.5 text-right w-16">Qty</th>
                                <th className="px-4 py-2.5 text-right w-24">Price</th>
                                <th className="px-4 py-2.5 text-right w-28">Total</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 text-slate-700">
                              {invoice.lineItems.map((item: any, idx: number) => (
                                <tr key={idx} className="hover:bg-slate-50/30">
                                  <td className="px-4 py-2 font-medium text-slate-900">{item.name || 'Unknown Item'}</td>
                                  <td className="px-4 py-2 text-right">{item.quantity}</td>
                                  <td className="px-4 py-2 text-right">${(item.price || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                                  <td className="px-4 py-2 text-right font-semibold text-slate-900">${(item.total || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                                </tr>
                              ))}
                              <tr className="bg-slate-50/50 font-semibold text-slate-900 border-t border-slate-100">
                                <td colSpan={3} className="px-4 py-2 text-right text-slate-500">Total:</td>
                                <td className="px-4 py-2 text-right text-xs font-bold text-[rgb(var(--ns-accent))]">${(invoice.amount || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
          <DataTablePagination page={page} totalPages={totalPages} totalItems={totalItems} perPage={perPage} onPageChange={goToPage} />
        </div>
      )}
      {/* Send Invoice Dialog with Template Selector */}
      <Dialog open={sendingInvoice !== null} onOpenChange={(o) => { if (!o) setSendingInvoice(null) }}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-4 h-4 text-[rgb(var(--ns-accent))]" />
              Send Invoice & Email Notification
            </DialogTitle>
          </DialogHeader>

          {sendingInvoice && (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                sendInvoice.mutate({
                  id: sendingInvoice.id,
                  subject: emailSubject,
                  body: emailBody
                })
              }}
              className="space-y-4 pt-2"
            >
              {/* Info Banner */}
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-xs text-slate-600 space-y-1">
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">Invoice:</span>
                  <span className="font-semibold text-slate-800">{sendingInvoice.title || sendingInvoice.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">Amount:</span>
                  <span className="font-semibold text-slate-800">${sendingInvoice.amount?.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
                {sendingInvoice.expand?.dealId?.expand?.contactId && (
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-500">Recipient:</span>
                    <span className="font-semibold text-indigo-600">
                      {sendingInvoice.expand.dealId.expand.contactId.name} ({sendingInvoice.expand.dealId.expand.contactId.email})
                    </span>
                  </div>
                )}
              </div>

              {/* Template Selector */}
              <div className="space-y-1.5">
                <Label>Choose Message Template</Label>
                <Select value={selectedTemplateId} onValueChange={handleTemplateChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="— Select a template —" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__default__">— Use Default System Notification —</SelectItem>
                    {templates
                      .filter((t: any) => ['invoice_reminder', 'email', 'other'].includes(t.category))
                      .map((t: any) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.title} ({t.category === 'invoice_reminder' ? 'Reminder' : 'Email'})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Email Subject */}
              <div className="space-y-1.5">
                <Label>Email Subject *</Label>
                <input
                  type="text"
                  required
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ns-accent))] focus:border-transparent bg-white placeholder-slate-400"
                />
              </div>

              {/* Email Body */}
              <div className="space-y-1.5">
                <Label>Email Body *</Label>
                <textarea
                  required
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ns-accent))] focus:border-transparent bg-white placeholder-slate-400 min-h-[160px] resize-y font-mono"
                />
              </div>

              <DialogFooter className="pt-2 flex flex-col sm:flex-row gap-2 sm:justify-between items-center w-full">
                {/* Copy Button */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const text = `Subject: ${emailSubject}\n\n${emailBody}`
                    navigator.clipboard.writeText(text)
                    toast.success('Subject and body copied to clipboard!')
                  }}
                  className="w-full sm:w-auto h-9 text-xs flex items-center gap-1.5 border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copy Email Text
                </Button>

                {/* Cancel & Send Action Buttons */}
                <div className="flex gap-2 w-full sm:w-auto sm:justify-end">
                  <Button type="button" variant="ghost" onClick={() => setSendingInvoice(null)} className="h-9 text-xs">
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={sendInvoice.isPending || !emailSubject || !emailBody}
                    className="bg-[rgb(var(--ns-accent))] hover:bg-[rgb(var(--ns-accent-dk))] text-white h-9 text-xs font-semibold px-4"
                  >
                    {sendInvoice.isPending ? 'Sending...' : 'Send Invoice'}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
