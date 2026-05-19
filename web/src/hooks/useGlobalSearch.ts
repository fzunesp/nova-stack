import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import pb from '@/lib/pocketbase'

export interface SearchResult {
  id: string
  title: string
  subtitle: string
  type: 'contact' | 'deal' | 'task' | 'invoice' | 'intake' | 'product' | 'company'
  link: string
  status?: string
}

export interface GroupedResults {
  companies: SearchResult[]
  contacts: SearchResult[]
  deals: SearchResult[]
  tasks: SearchResult[]
  invoices: SearchResult[]
  intake: SearchResult[]
  products: SearchResult[]
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  active: 'Active',
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  archived: 'Archived',
}

async function searchAll(query: string): Promise<GroupedResults> {
  const q = query.trim()

  const [companies, contacts, deals, tasks, invoices, intakes, products] = await Promise.allSettled([
    pb.collection('companies').getList(1, 5, {
      filter: `name~"${q}" || industry~"${q}" || city~"${q}"`,
      sort: '-id',
    }),
    pb.collection('contacts').getList(1, 5, {
      filter: `name~"${q}" || email~"${q}" || companyName~"${q}"`,
      sort: '-id',
    }),
    pb.collection('deals').getList(1, 5, {
      filter: `title~"${q}"`,
      sort: '-id',
    }),
    pb.collection('tasks').getList(1, 5, {
      filter: `title~"${q}" || description~"${q}"`,
      sort: '-id',
    }),
    pb.collection('invoices').getList(1, 5, {
      filter: `title~"${q}"`,
      sort: '-id',
    }),
    pb.collection('intake_submissions').getList(1, 5, {
      filter: `name~"${q}" || email~"${q}" || message~"${q}"`,
      sort: '-id',
    }),
    pb.collection('products').getList(1, 5, {
      filter: `name~"${q}" || sku~"${q}"`,
      sort: '-id',
    }),
  ])

  const get = <T>(r: PromiseSettledResult<{ items: T[] }>) =>
    r.status === 'fulfilled' ? r.value.items : []

  return {
    companies: get(companies).map((c: any): SearchResult => ({
      id: c.id,
      title: c.name,
      subtitle: [c.industry, c.city, c.country].filter(Boolean).join(' · '),
      type: 'company',
      link: `/companies/${c.id}`,
      status: c.status,
    })),
    contacts: get(contacts).map((c: any): SearchResult => ({
      id: c.id,
      title: c.name,
      subtitle: [c.companyName, c.email].filter(Boolean).join(' · '),
      type: 'contact',
      link: `/crm/contacts/${c.id}`,
      status: STATUS_LABELS[c.status] || c.status,
    })),
    deals: get(deals).map((d: any): SearchResult => ({
      id: d.id,
      title: d.title,
      subtitle: `${d.stage} · $${(d.value || 0).toLocaleString()}`,
      type: 'deal',
      link: `/crm/deals/${d.id}`,
      status: d.stage,
    })),
    tasks: get(tasks).map((t: any): SearchResult => ({
      id: t.id,
      title: t.title,
      subtitle: t.description || '',
      type: 'task',
      link: '/tasks',
      status: STATUS_LABELS[t.status] || t.status,
    })),
    invoices: get(invoices).map((i: any): SearchResult => ({
      id: i.id,
      title: i.title,
      subtitle: `$${(i.amount || 0).toLocaleString()} · ${STATUS_LABELS[i.status] || i.status}`,
      type: 'invoice',
      link: `/invoices/${i.id}`,
      status: STATUS_LABELS[i.status] || i.status,
    })),
    intake: get(intakes).map((s: any): SearchResult => ({
      id: s.id,
      title: s.name,
      subtitle: `${s.type} · ${s.source}`,
      type: 'intake',
      link: '/intake',
      status: STATUS_LABELS[s.status] || s.status,
    })),
    products: get(products).map((p: any): SearchResult => ({
      id: p.id,
      title: p.name,
      subtitle: `${p.sku ? p.sku + ' · ' : ''}$${(p.price || 0).toLocaleString()}`,
      type: 'product',
      link: '/products',
      status: STATUS_LABELS[p.status] || p.status,
    })),
  }
}

export function useGlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  // Debounce query by 200ms
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 200)
    return () => clearTimeout(t)
  }, [query])

  // CTRL+K / CMD+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  // Reset query when closed
  useEffect(() => {
    if (!open) {
      setQuery('')
      setDebouncedQuery('')
    }
  }, [open])

  const { data, isLoading } = useQuery({
    queryKey: ['global-search', debouncedQuery],
    queryFn: () => searchAll(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
    staleTime: 30_000,
  })

  const hasResults = data && Object.values(data).some((arr) => arr.length > 0)

  return { open, setOpen, query, setQuery, data, isLoading, hasResults, debouncedQuery }
}
