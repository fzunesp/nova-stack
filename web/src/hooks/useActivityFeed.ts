import { useQuery } from '@tanstack/react-query'
import { getActivityFeed } from '@/services/activity'
import type { ActivityEvent } from '@/services/activity'

export function useActivityFeed() {
  return useQuery<ActivityEvent[]>({
    queryKey: ['activity_feed'],
    queryFn: getActivityFeed,
    staleTime: 30_000,
  })
}
