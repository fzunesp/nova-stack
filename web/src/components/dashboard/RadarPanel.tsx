import { Link } from 'react-router'
import type { RadarData } from '@/hooks/useDashboardData'
import { CheckSquare, Briefcase, FileText, Circle } from 'lucide-react'

interface RadarPanelProps {
  data: RadarData
}

function LevelIcon({ level }: { level: string }) {
  switch (level) {
    case 'task':
      return <CheckSquare className="w-4 h-4" />
    case 'deal':
      return <Briefcase className="w-4 h-4" />
    case 'invoice':
      return <FileText className="w-4 h-4" />
    default:
      return <Circle className="w-4 h-4" />
  }
}

const SECTION_CONFIG = {
  urgent: {
    title: '🔴 Urgent',
    barColor: 'border-l-red-500',
    iconBg: 'bg-red-100 text-red-600',
    rowHover: 'hover:bg-red-50',
  },
  attention: {
    title: '🟡 Needs Attention',
    barColor: 'border-l-amber-500',
    iconBg: 'bg-amber-100 text-amber-600',
    rowHover: 'hover:bg-amber-50',
  },
  opportunities: {
    title: '🟢 Opportunities',
    barColor: 'border-l-emerald-500',
    iconBg: 'bg-emerald-100 text-emerald-600',
    rowHover: 'hover:bg-emerald-50',
  },
} as const

export function RadarPanel({ data }: RadarPanelProps) {
  const sections = [
    { key: 'urgent' as const, items: data.urgent },
    { key: 'attention' as const, items: data.attention },
    { key: 'opportunities' as const, items: data.opportunities },
  ]

  if (sections.every((s) => s.items.length === 0)) return null

  return (
    <div className="bg-white shadow-sm ring-1 ring-black ring-opacity-5 rounded-lg overflow-hidden mb-8">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-100">
        <h2 className="text-base font-semibold leading-6 text-gray-900">Your Radar</h2>
        <p className="mt-1 text-sm text-gray-500">What needs your attention across deals, invoices, and tasks.</p>
      </div>

      {sections.map((section) => {
        if (section.items.length === 0) return null
        const config = SECTION_CONFIG[section.key]

        return (
          <div key={section.key} className={`${section.key !== 'urgent' ? 'border-t border-gray-100' : ''}`}>
            <div className={`px-4 py-2 sm:px-6 border-l-4 ${config.barColor}`}>
              <h3 className="text-sm font-semibold text-gray-700">{config.title}</h3>
            </div>
            <ul role="list" className="divide-y divide-gray-100">
              {section.items.map((item) => (
                <li key={item.id} className={`px-4 py-3 sm:px-6 ${config.rowHover} transition-colors`}>
                  <Link to={item.link} className="flex items-start gap-3 group">
                    <div className={`mt-0.5 flex-shrink-0 flex items-center justify-center h-6 w-6 rounded ${config.iconBg}`}>
                      <LevelIcon level={item.level} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                        {item.title}
                      </p>
                      <p className="text-xs text-gray-500">{item.context}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </div>
  )
}
