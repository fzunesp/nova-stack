import { useState, useCallback, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import pb from '@/lib/pocketbase'

interface UsePaginatedQueryOptions {
  collection: string
  perPage?: number
  searchFields?: string[]
  defaultSort?: string
  expand?: string
  initialSearch?: string
}

export function usePaginatedQuery({
  collection,
  perPage = 10,
  searchFields = ['name'],
  defaultSort = '-id',
  expand,
  initialSearch = '',
}: UsePaginatedQueryOptions) {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState(initialSearch)
  const [sortField, setSortField] = useState(defaultSort)

  useEffect(() => {
    if (initialSearch !== undefined) {
      setSearch(initialSearch)
      setPage(1)
    }
  }, [initialSearch])

  const buildFilter = useCallback(() => {
    if (!search.trim()) return ''
    const terms = searchFields.map((f) => `${f}~"${search.trim()}"`)
    return `(${terms.join('||')})`
  }, [search, searchFields])

  const { data, isLoading, error } = useQuery({
    queryKey: [collection, page, perPage, search, sortField],
    queryFn: async () => {
      const filter = buildFilter()
      return pb.collection(collection).getList(page, perPage, {
        sort: sortField,
        filter: filter || undefined,
        expand: expand || undefined,
      })
    },
  })

  const toggleSort = useCallback(
    (field: string) => {
      setSortField((current) => {
        const base = field.replace(/^-/, '')
        if (current === base) return `-${base}`
        return base
      })
      setPage(1)
    },
    []
  )

  const goToPage = useCallback((p: number) => {
    setPage(p)
  }, [])

  const updateSearch = useCallback((s: string) => {
    setSearch(s)
    setPage(1)
  }, [])

  return {
    items: data?.items || [],
    totalItems: data?.totalItems || 0,
    totalPages: data?.totalPages || 0,
    page,
    perPage,
    search,
    sortField,
    isLoading,
    error,
    toggleSort,
    goToPage,
    updateSearch,
  }
}
