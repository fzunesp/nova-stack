import { FileText, Plus, Pencil, Trash2, UserCheck, ArrowRightLeft } from 'lucide-react'
import type { ActivityEvent } from '@/services/activity'

const typeConfig: Record<ActivityEvent['type'], { icon: typeof FileText; color: string; bg: string }> = {
  created: { icon: Plus, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  updated: { icon: Pencil, color: 'text-blue-600', bg: 'bg-blue-50' },
  deleted: { icon: Trash2, color: 'text-red-500', bg: 'bg-red-50' },
  assigned: { icon: UserCheck, color: 'text-purple-600', bg: 'bg-purple-50' },
  status_changed: { icon: ArrowRightLeft, color: 'text-amber-600', bg: 'bg-amber-50' },
}

function formatTimestamp(ts: string): string {
  if (!ts) return ''
  const date = new Date(ts)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHr = Math.floor(diffMs / 3600000)
  const diffDay = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  if (diffDay < 7) return `${diffDay}d ago`
  return date.toLocaleDateString()
}

interface ActivityFeedProps {
  events: ActivityEvent[]
  isLoading: boolean
}

export function ActivityFeed({ events, isLoading }: ActivityFeedProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-slate-100" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-slate-100 rounded w-3/4" />
                <div className="h-2 bg-slate-100 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Recent Activity</h3>
        <div className="text-center py-8">
          <FileText className="w-8 h-8 mx-auto mb-2 text-slate-200" />
          <p className="text-sm text-slate-400">No recent activity</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="px-6 py-4 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-900">Recent Activity</h3>
      </div>
      <div className="divide-y divide-slate-50">
        {events.map((event) => {
          const config = typeConfig[event.type]
          const Icon = config.icon

          return (
            <div key={event.id} className="px-6 py-3 flex items-start gap-3 hover:bg-slate-50 transition-colors">
              <div className={`w-8 h-8 rounded-full ${config.bg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-4 h-4 ${config.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-900 truncate">{event.title}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {event.type.replace('_', ' ')}&nbsp;&middot;&nbsp;{event.actor}&nbsp;&middot;&nbsp;{formatTimestamp(event.timestamp)}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
