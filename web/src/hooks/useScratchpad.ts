import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState, useCallback, useRef } from 'react'
import { getScratchpad, upsertScratchpad, updateScratchpad } from '@/services/scratchpad'
import pb from '@/lib/pocketbase'
import { toast } from 'sonner'

const SCRATCHPAD_KEY = 'scratchpad'

export function useScratchpad() {
  const userId = pb.authStore.record?.id
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: [SCRATCHPAD_KEY, userId],
    queryFn: () => (userId ? getScratchpad(userId) : null),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  })

  const upsertMutation = useMutation({
    mutationFn: ({ userId, content }: { userId: string; content: string }) => upsertScratchpad(userId, content),
    onSuccess: (result) => {
      queryClient.setQueryData([SCRATCHPAD_KEY, userId], result)
    },
    onError: () => {
      toast.error('Failed to save scratchpad')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) => updateScratchpad(id, { content }),
    onSuccess: (result) => {
      queryClient.setQueryData([SCRATCHPAD_KEY, userId], result)
    },
    onError: () => {
      toast.error('Failed to save scratchpad')
    },
  })

  return {
    data,
    isLoading,
    upsert: upsertMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    isSaving: upsertMutation.isPending || updateMutation.isPending,
  }
}

export function useDebouncedScratchpadSave(delay = 800) {
  const { data, isLoading, upsert, update, isSaving } = useScratchpad()
  const [localContent, setLocalContent] = useState('')
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const userId = pb.authStore.record?.id

  useEffect(() => {
    if (data && localContent === '' && !isLoading) {
      setLocalContent(data.content)
    }
  }, [data, isLoading])

  const save = useCallback(async (content: string) => {
    if (!userId) return
    try {
      if (data?.id) {
        await update({ id: data.id, content })
      } else {
        await upsert({ userId, content })
      }
      setLastSaved(new Date())
    } catch {
      // Error handled by mutation
    }
  }, [data, userId, update, upsert])

  const setContent = useCallback((content: string) => {
    setLocalContent(content)

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      save(content)
    }, delay)
  }, [save, delay])

  const clear = useCallback(() => {
    setLocalContent('')
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    if (data?.id && userId) {
      update({ id: data.id, content: '' })
    } else if (userId) {
      upsert({ userId, content: '' })
    }
  }, [data, userId, update, upsert])

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  return {
    content: localContent,
    setContent,
    clear,
    isLoading,
    isSaving,
    lastSaved,
  }
}
