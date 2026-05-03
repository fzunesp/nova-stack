import React from 'react';
import Link from 'next/link';
import type { RadarData } from '@/modules/dashboard/dashboard.service';

interface RadarPanelProps {
  data: RadarData;
}

function LevelIcon({ level }: { level: string }) {
  switch (level) {
    case 'task':
      return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      );
    case 'deal':
      return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'invoice':
      return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    default:
      return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      );
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
} as const;

export default function RadarPanel({ data }: RadarPanelProps) {
  const sections = [
    { key: 'urgent' as const, items: data.urgent },
    { key: 'attention' as const, items: data.attention },
    { key: 'opportunities' as const, items: data.opportunities },
  ];

  if (sections.every(s => s.items.length === 0)) return null;

  return (
    <div className="bg-white shadow-sm ring-1 ring-black ring-opacity-5 rounded-lg overflow-hidden mb-8">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-100">
        <h2 className="text-base font-semibold leading-6 text-gray-900">Your Radar</h2>
        <p className="mt-1 text-sm text-gray-500">What needs your attention across deals, invoices, and tasks.</p>
      </div>

      {sections.map(section => {
        if (section.items.length === 0) return null;
        const config = SECTION_CONFIG[section.key];

        return (
          <div key={section.key} className={`${section.key !== 'urgent' ? 'border-t border-gray-100' : ''}`}>
            <div className={`px-4 py-2 sm:px-6 border-l-4 ${config.barColor}`}>
              <h3 className="text-sm font-semibold text-gray-700">{config.title}</h3>
            </div>
            <ul role="list" className="divide-y divide-gray-100">
              {section.items.map(item => (
                <li
                  key={item.id}
                  className={`px-4 py-3 sm:px-6 ${config.rowHover} transition-colors`}
                >
                  <Link href={item.link} className="flex items-start gap-3 group">
                    <div className={`mt-0.5 flex-shrink-0 flex items-center justify-center h-6 w-6 rounded ${config.iconBg}`}>
                      <LevelIcon level={item.level} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                        {item.title}
                      </p>
                      <p className="text-xs text-gray-500">{item.context}</p>
                    </div>
                    <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-300 group-hover:text-gray-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
