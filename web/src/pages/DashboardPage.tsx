import { useState } from 'react'
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
import { Loader2 } from 'lucide-react'
import { FirstRunSetupWizard } from '@/components/FirstRunSetupWizard'

export function DashboardPage() {
  const { data, isLoading, error } = useDashboardData()
  const { data: feedEvents, isLoading: feedLoading } = useActivityFeed()
  const { data: workItems, isLoading: workLoading } = useMyWorkQueue()
  const { user, isAdmin, isHrOrAdmin } = useAuth()

  const [showSetup, setShowSetup] = useState(() => {
    if (!isAdmin || !user) return false
    const firstRunDone = localStorage.getItem(`novastack_first_run_completed_${user.id}`)
    return !user.companyName && firstRunDone !== 'true'
  })

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
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Command Center</h1>
        <p className="mt-1 text-sm text-slate-500">What needs your attention across deals, invoices, and tasks.</p>
      </div>

      <TodayStrip summary={today} />
      {isHrOrAdmin && <ActivityFeed events={feedEvents || []} isLoading={feedLoading} />}
      <MyWorkQueue grouped={grouped} isLoading={workLoading} />
      <MoneyAtRiskStrip data={moneyAtRisk} />
      <RadarPanel data={radar} />
      <BusinessKpiGrid metrics={metrics} />

      {showSetup && (
        <FirstRunSetupWizard 
          user={user} 
          onComplete={() => {
            setShowSetup(false)
            window.location.reload()
          }} 
        />
      )}
    </div>
  )
}

