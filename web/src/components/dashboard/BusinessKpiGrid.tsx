import { KpiCard } from './KpiCard'
import type { BusinessMetrics } from '@/hooks/useDashboardData'
import { DollarSign, FileText, Briefcase, CheckCircle, Percent } from 'lucide-react'

interface BusinessKpiGridProps {
  metrics: BusinessMetrics
}

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

const fmtPct = (n: number) => `${n.toFixed(1)}%`

export function BusinessKpiGrid({ metrics }: BusinessKpiGridProps) {
  return (
    <div className="grid grid-cols-3 gap-3 lg:grid-cols-5 mb-8">
      <KpiCard
        label="Total Revenue"
        value={fmtCurrency(metrics.totalRevenue)}
        subLabel="From paid invoices"
        accent="green"
        icon={<DollarSign className="w-6 h-6" />}
      />
      <KpiCard
        label="Outstanding"
        value={fmtCurrency(metrics.outstandingRevenue)}
        subLabel="Draft + sent invoices"
        accent="violet"
        icon={<FileText className="w-6 h-6" />}
      />
      <KpiCard
        label="Active Deals"
        value={String(metrics.activeDeals)}
        subLabel="In pipeline"
        accent="blue"
        icon={<Briefcase className="w-6 h-6" />}
      />
      <KpiCard
        label="Conversion Rate"
        value={fmtPct(metrics.conversionRate)}
        subLabel={`${metrics.wonDeals} won of ${metrics.totalDeals} total`}
        accent="green"
        icon={<Percent className="w-6 h-6" />}
      />
      <KpiCard
        label="Pending Tasks"
        value={String(metrics.pendingTasks)}
        subLabel="Not yet done"
        accent="gray"
        icon={<CheckCircle className="w-6 h-6" />}
      />
    </div>
  )
}
