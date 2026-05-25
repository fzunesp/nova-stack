import { useDashboardData } from '@/hooks/useDashboardData'
import { useActivityFeed } from '@/hooks/useActivityFeed'
import { useMyWorkQueue } from '@/hooks/useMyWorkQueue'
import { useAuth } from '@/hooks/useAuth'
import { TodayStrip } from '@/components/dashboard/TodayStrip'
import { MoneyAtRiskStrip } from '@/components/dashboard/MoneyAtRiskStrip'
import { RadarPanel } from '@/components/dashboard/RadarPanel'
import { BusinessKpiGrid } from '@/components/dashboard/BusinessKpiGrid'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'
import { MyWorkQueue } from '@/components/dashboard/MyWorkQueue'
import { groupWorkQueue } from '@/services/work-queue'
import { ScratchpadWidget } from '@/components/ScratchpadWidget'
import { Loader2, HelpCircle } from 'lucide-react'
import { useNavigate } from 'react-router'

export function DashboardPage() {
  const navigate = useNavigate()
  const { data, isLoading, error } = useDashboardData()
  const { data: feedEvents, isLoading: feedLoading } = useActivityFeed()
  const { data: workItems, isLoading: workLoading } = useMyWorkQueue()
  const { isHrOrAdmin } = useAuth()

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex h-full items-center justify-center text-red-500 text-sm">
        Failed to load dashboard data.
      </div>
    )
  }

  const { metrics, radar, today, moneyAtRisk } = data
  const grouped = workItems ? groupWorkQueue(workItems) : { needsAttention: [], recentlyUpdated: [], waiting: [] }

  return (
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Command Center</h1>
          <p className="mt-1 text-sm text-slate-500">What needs your attention across deals, invoices, and tasks.</p>
        </div>
        <button
          onClick={() => navigate('/help?tab=dashboard')}
          className="cursor-pointer flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-lg px-3 py-2 transition-colors"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          Help
        </button>
      </div>

      <TodayStrip summary={today} />
      <div className="mt-6 mb-6">
        <ScratchpadWidget />
      </div>
      {isHrOrAdmin && <ActivityFeed events={feedEvents || []} isLoading={feedLoading} />}
      <MyWorkQueue grouped={grouped} isLoading={workLoading} />
      {isHrOrAdmin && <MoneyAtRiskStrip data={moneyAtRisk} />}
      <RadarPanel data={radar} />
      {isHrOrAdmin && <BusinessKpiGrid metrics={metrics} />}
    </div>
  )
}

