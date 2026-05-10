import { Link } from 'react-router'
import type { MoneyAtRisk } from '@/hooks/useDashboardData'

interface MoneyAtRiskStripProps {
  data: MoneyAtRisk
}

function fmtK(n: number): string {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}K`
  return `$${n.toFixed(0)}`
}

export function MoneyAtRiskStrip({ data }: MoneyAtRiskStripProps) {
  if (data.totalAtRisk === 0) return null

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-6">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-amber-500">&#9888;&#65039;</span>
        <span className="text-sm font-semibold text-amber-900">{fmtK(data.totalAtRisk)} at risk</span>
        <span className="text-amber-300">·</span>
        <Link to="/invoices" className="text-sm text-amber-700 hover:text-amber-900">
          {fmtK(data.overdueInvoicesTotal)} overdue
        </Link>
        <span className="text-amber-300">·</span>
        <Link to="/crm" className="text-sm text-amber-700 hover:text-amber-900">
          {fmtK(data.openDealsValue)} open deals
        </Link>
      </div>
    </div>
  )
}
