import { useQuery } from '@tanstack/react-query'
import pb from '@/lib/pocketbase'
import type { EmployeeRecord } from '@/services/types'

/**
 * useEmployee Hook
 * 
 * Fetches the Employee record associated with the currently logged-in User.
 * This bridges the authentication identity (User) with the business identity (Employee).
 */
export function useEmployee() {
  const userId = pb.authStore.record?.id

  return useQuery({
    queryKey: ['current_employee', userId],
    queryFn: async () => {
      if (!userId) return null
      
      try {
        const employee = await pb.collection('employees').getFirstListItem(`userId = "${userId}"`, {
          expand: 'managerId',
        })
        return employee as unknown as EmployeeRecord
      } catch (err: any) {
        if (err.status === 404) {
          console.warn(`No employee record found for user ${userId}`)
          return null
        }
        throw err
      }
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}
