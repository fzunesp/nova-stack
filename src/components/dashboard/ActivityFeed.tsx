import React from 'react';
import type { ActivityItem } from '@/modules/dashboard/dashboard.service';

interface ActivityFeedProps {
  items: ActivityItem[];
}

const TYPE_ICON: Record<ActivityItem['type'], React.ReactNode> = {
  deal: (
    <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  invoice: (
    <svg className="h-5 w-5 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  task: (
    <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
};

const BADGE_STYLES: Record<string, string> = {
  green:  'bg-green-100 text-green-800',
  blue:   'bg-blue-100 text-blue-800',
  violet: 'bg-violet-100 text-violet-800',
  gray:   'bg-gray-100 text-gray-600',
};

function timeAgo(date: Date): string {
  const now = Date.now();
  const diff = now - new Date(date).getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export default function ActivityFeed({ items }: ActivityFeedProps) {
  if (items.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm ring-1 ring-black ring-opacity-5 p-6 mb-8 text-center text-sm text-gray-400">
        No recent activity yet.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm ring-1 ring-black ring-opacity-5 mb-8">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-900">Recent Activity</h2>
        <p className="text-xs text-gray-500 mt-0.5">Latest events across CRM, Invoices, and Tasks</p>
      </div>
      <ul className="divide-y divide-gray-50">
        {items.map((item) => (
          <li key={`${item.type}-${item.id}`} className="flex items-start gap-4 px-6 py-3 hover:bg-gray-50 transition-colors">
            <div className="mt-0.5 flex-shrink-0">
              {TYPE_ICON[item.type]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{item.label}</p>
              <p className="text-xs text-gray-500 truncate">{item.subLabel}</p>
            </div>
            <div className="flex-shrink-0 flex items-center gap-3">
              {item.badge && item.badgeColor && (
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${BADGE_STYLES[item.badgeColor] || BADGE_STYLES.gray}`}>
                  {item.badge.charAt(0).toUpperCase() + item.badge.slice(1)}
                </span>
              )}
              <span className="text-xs text-gray-400 whitespace-nowrap">
                {timeAgo(item.timestamp)}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
