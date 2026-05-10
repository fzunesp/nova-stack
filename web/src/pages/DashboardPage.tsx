import { useDashboardData } from '@/hooks/useDashboardData'
import { TodayStrip } from '@/components/dashboard/TodayStrip'
import { MySignalsPanel } from '@/components/dashboard/MySignalsPanel'
import { MoneyAtRiskStrip } from '@/components/dashboard/MoneyAtRiskStrip'
import { RadarPanel } from '@/components/dashboard/RadarPanel'
import { BusinessKpiGrid } from '@/components/dashboard/BusinessKpiGrid'
import { Loader2 } from 'lucide-react'

export function DashboardPage() {
  const { data, isLoading, error } = useDashboardData()

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

  const { metrics, radar, today, moneyAtRisk, mySignals } = data

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Command Center</h1>
        <p className="mt-1 text-sm text-slate-500">What needs your attention across deals, invoices, and tasks.</p>
      </div>

      <TodayStrip summary={today} />
      <MySignalsPanel items={mySignals} />
      <MoneyAtRiskStrip data={moneyAtRisk} />
      <RadarPanel data={radar} />
      <BusinessKpiGrid metrics={metrics} />
    </div>
  )
}
