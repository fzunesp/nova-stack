import { Link } from 'react-router'
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
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex h-full items-center justify-center text-red-500">
        Failed to load dashboard data.
      </div>
    )
  }

  const { metrics, radar, today, moneyAtRisk, mySignals } = data

  return (
    <div>
      {/* Page header */}
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:tracking-tight">
            Command Center
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            What needs your attention across deals, invoices, and tasks.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              to="/crm"
              className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-700/10 hover:bg-blue-100"
            >
              + Contact
            </Link>
            <Link
              to="/crm"
              className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 ring-1 ring-inset ring-green-700/10 hover:bg-green-100"
            >
              + Deal
            </Link>
            <Link
              to="/invoices"
              className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700 ring-1 ring-inset ring-violet-700/10 hover:bg-violet-100"
            >
              + Invoice
            </Link>
          </div>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 flex items-center gap-3">
          <Link
            to="/crm"
            className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            Board View
          </Link>
          <Link
            to="/crm"
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
          >
            View Contacts
          </Link>
        </div>
      </div>

      <TodayStrip summary={today} />
      <MySignalsPanel items={mySignals} />
      <MoneyAtRiskStrip data={moneyAtRisk} />
      <RadarPanel data={radar} />
      <BusinessKpiGrid metrics={metrics} />
    </div>
  )
}
