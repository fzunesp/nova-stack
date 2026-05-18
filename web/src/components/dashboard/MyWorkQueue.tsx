import { Link } from 'react-router'
import { AlertCircle, Clock, Hourglass } from 'lucide-react'
import type { WorkQueueItem, GroupedWorkQueue } from '@/services/work-queue'

const TYPE_STYLES: Record<string, string> = {
  task: 'text-emerald-700 bg-emerald-50 ring-emerald-600/20',
  intake: 'text-violet-700 bg-violet-50 ring-violet-600/20',
  deal: 'text-blue-700 bg-blue-50 ring-blue-600/20',
  contact: 'text-cyan-700 bg-cyan-50 ring-cyan-600/20',
  invoice: 'text-orange-700 bg-orange-50 ring-orange-600/20',
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'text-amber-700 bg-amber-50 ring-amber-600/20',
  draft: 'text-slate-600 bg-slate-100 ring-slate-500/20',
  active: 'text-blue-700 bg-blue-50 ring-blue-600/20',
  approved: 'text-emerald-700 bg-emerald-50 ring-emerald-600/20',
  rejected: 'text-red-700 bg-red-50 ring-red-600/20',
  lead: 'text-blue-700 bg-blue-50 ring-blue-600/20',
  contacted: 'text-indigo-700 bg-indigo-50 ring-indigo-600/20',
  quoted: 'text-purple-700 bg-purple-50 ring-purple-600/20',
  won: 'text-emerald-700 bg-emerald-50 ring-emerald-600/20',
  lost: 'text-red-700 bg-red-50 ring-red-600/20',
  archived: 'text-slate-500 bg-slate-100 ring-slate-400/20',
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  draft: 'Draft',
  active: 'Active',
  approved: 'Approved',
  rejected: 'Rejected',
  lead: 'Lead',
  contacted: 'Contacted',
  quoted: 'Quoted',
  won: 'Won',
  lost: 'Lost',
  archived: 'Archived',
}

function formatTimestamp(ts?: string): string {
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

function WorkQueueRow({ item }: { item: WorkQueueItem }) {
  const typeStyle = TYPE_STYLES[item.type] || 'text-slate-600 bg-slate-50 ring-slate-500/20'
  const statusStyle = STATUS_STYLES[item.status] || 'text-slate-600 bg-slate-100 ring-slate-500/20'
  const statusLabel = STATUS_LABELS[item.status] || item.status

  return (
    <Link to={item.link} className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 transition-colors group">
      <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold ring-1 ring-inset flex-shrink-0 ${typeStyle}`}>
        {item.type}
      </span>
      <span className="text-sm text-slate-900 truncate flex-1 min-w-0">{item.title}</span>
      <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset flex-shrink-0 ${statusStyle}`}>
        {statusLabel}
      </span>
      <span className="text-[10px] text-slate-400 flex-shrink-0 tabular-nums">{formatTimestamp(item.updated)}</span>
    </Link>
  )
}

function GroupSection({ title, icon: Icon, items }: { title: string; icon: typeof AlertCircle; items: WorkQueueItem[] }) {
  if (items.length === 0) return null

  return (
    <div>
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border-b border-slate-100">
        <Icon className="w-3 h-3 text-slate-400" />
        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
        <span className="text-[10px] text-slate-400 ml-auto">{items.length}</span>
      </div>
      <div className="divide-y divide-slate-50">
        {items.map((item) => (
          <WorkQueueRow key={`${item.type}-${item.id}`} item={item} />
        ))}
      </div>
    </div>
  )
}

interface MyWorkQueueProps {
  grouped: GroupedWorkQueue
  isLoading: boolean
}

export function MyWorkQueue({ grouped, isLoading }: MyWorkQueueProps) {
  const total = grouped.needsAttention.length + grouped.recentlyUpdated.length + grouped.waiting.length
  if (total === 0 && !isLoading) return null

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">My Work</h3>
        </div>
        <div className="divide-y divide-slate-50">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-1.5 animate-pulse">
              <div className="w-12 h-4 bg-slate-100 rounded" />
              <div className="flex-1 h-3 bg-slate-100 rounded" />
              <div className="w-14 h-4 bg-slate-100 rounded" />
              <div className="w-10 h-3 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">My Work</h3>
        <span className="text-xs text-slate-400">{total} item{total !== 1 ? 's' : ''}</span>
      </div>
      <div className="divide-y divide-slate-100">
        <GroupSection title="Needs attention" icon={AlertCircle} items={grouped.needsAttention} />
        <GroupSection title="Waiting" icon={Hourglass} items={grouped.waiting} />
        <GroupSection title="Recently updated" icon={Clock} items={grouped.recentlyUpdated} />
      </div>
    </div>
  )
}
