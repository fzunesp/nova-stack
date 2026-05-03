import React from 'react';
import Link from 'next/link';
import type { SignalItem } from '@/modules/dashboard/dashboard.service';

interface MySignalsPanelProps {
  items: SignalItem[];
}

const TYPE_STYLES: Record<string, string> = {
  task: 'text-green-700 bg-green-50 ring-green-600/20',
  intake: 'text-violet-700 bg-violet-50 ring-violet-600/20',
  deal: 'text-blue-700 bg-blue-50 ring-blue-600/20',
};

const STATUS_LABELS: Record<string, string> = {
  todo: 'Todo',
  in_progress: 'In Progress',
  done: 'Done',
  new: 'New',
  in_review: 'In Review',
  lead: 'Lead',
  contacted: 'Contacted',
  quoted: 'Quoted',
};

export default function MySignalsPanel({ items }: MySignalsPanelProps) {
  if (items.length === 0) return null;

  return (
    <div className="bg-white shadow-sm ring-1 ring-black ring-opacity-5 rounded-lg mb-6">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900">Your Signals</h2>
        <span className="text-xs text-gray-400">{items.length} item{items.length !== 1 ? 's' : ''}</span>
      </div>
      <ul role="list" className="divide-y divide-gray-100">
        {items.map(item => (
          <li key={`${item.type}-${item.id}`} className="px-4 py-2.5 hover:bg-gray-50 transition-colors">
            <Link href={item.link} className="flex items-center gap-3 min-w-0">
              <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset ${TYPE_STYLES[item.type]}`}>
                {item.type}
              </span>
              <span className="text-sm text-gray-900 truncate flex-1">{item.title}</span>
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                {STATUS_LABELS[item.status] || item.status}
              </span>
              {item.isNew && (
                <span className="inline-block h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" title="New" />
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
