import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getContactInteractions,
  createContactInteraction,
  updateContactInteraction,
  deleteContactInteraction,
} from '@/services/contact-interactions'
import type { InteractionType } from '@/services/types'

export function useContactInteractions(contactId: string | undefined) {
  return useQuery({
    queryKey: ['contactInteractions', contactId],
    queryFn: () => getContactInteractions(contactId!),
    enabled: !!contactId,
    staleTime: 30_000,
  })
}

export function useCreateInteraction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { contactId: string; content: string; type: InteractionType }) =>
      createContactInteraction(data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contactInteractions', variables.contactId] })
    },
  })
}

export function useUpdateInteraction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { id: string; content?: string; type?: InteractionType; contactId: string }) =>
      updateContactInteraction(data.id, { content: data.content, type: data.type }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contactInteractions', variables.contactId] })
    },
  })
}

export function useDeleteInteraction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { id: string; contactId: string }) => deleteContactInteraction(data.id),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contactInteractions', variables.contactId] })
    },
  })
}
