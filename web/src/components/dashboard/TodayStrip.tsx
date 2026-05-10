import React from 'react'
import { Link } from 'react-router'
import type { TodaySummary } from '@/hooks/useDashboardData'

interface TodayStripProps {
  summary: TodaySummary
}

export function TodayStrip({ summary }: TodayStripProps) {
  const items = [
    { count: summary.dueTasks, label: 'task', link: '/tasks' },
    { count: summary.overdueInvoices, label: 'invoice', link: '/invoices' },
    { count: summary.dealsNeedingAttention, label: 'deal', link: '/crm' },
  ]

  if (items.every((i) => i.count === 0)) return null

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-6">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-semibold text-blue-900">Today</span>
        <span className="text-blue-300">·</span>
        {items.map((item, i) => {
          if (item.count === 0) return null
          return (
            <React.Fragment key={item.label}>
              {i > 0 && <span className="text-blue-300">·</span>}
              <Link to={item.link} className="text-sm text-blue-700 hover:text-blue-900 font-medium">
                {item.count} {item.label}
                {item.count !== 1 ? 's' : ''} {item.label === 'task' ? 'due' : item.label === 'invoice' ? 'overdue' : 'need follow-up'}
              </Link>
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}
