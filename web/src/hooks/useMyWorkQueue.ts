import { useQuery } from '@tanstack/react-query'
import { getMyWorkQueue } from '@/services/work-queue'
import type { WorkQueueItem } from '@/services/work-queue'

export function useMyWorkQueue() {
  return useQuery<WorkQueueItem[]>({
    queryKey: ['my_work_queue'],
    queryFn: getMyWorkQueue,
    staleTime: 30_000,
  })
}
