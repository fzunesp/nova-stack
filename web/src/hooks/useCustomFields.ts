import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import pb from '@/lib/pocketbase'
import { toast } from 'sonner'
import type { CustomFieldDefinition } from '@/services/types'

export function useCustomFieldDefinitions(entityType?: string) {
  return useQuery({
    queryKey: ['custom_field_definitions', entityType],
    queryFn: async () => {
      let filter = ''
      if (entityType) {
        filter = `entityType = "${entityType}"`
      }
      const records = await pb.collection('custom_field_definitions').getFullList<CustomFieldDefinition>({
        filter,
        sort: 'created',
      })
      return records
    },
    staleTime: 1000 * 60 * 5,
  })
}

export function useCreateCustomField() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Omit<CustomFieldDefinition, 'id' | 'created' | 'updated'>) => {
      return await pb.collection('custom_field_definitions').create<CustomFieldDefinition>({
        ...data,
        created_by: pb.authStore.record?.id,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom_field_definitions'] })
      toast.success('Custom field created successfully')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to create custom field')
    },
  })
}

export function useUpdateCustomField() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CustomFieldDefinition> }) => {
      return await pb.collection('custom_field_definitions').update<CustomFieldDefinition>(id, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom_field_definitions'] })
      toast.success('Custom field updated successfully')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update custom field')
    },
  })
}

export function useDeleteCustomField() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      return await pb.collection('custom_field_definitions').delete(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom_field_definitions'] })
      toast.success('Custom field deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to delete custom field')
    },
  })
}
