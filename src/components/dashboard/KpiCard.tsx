import React from 'react';

interface KpiCardProps {
  label: string;
  value: string;
  subLabel?: string;
  icon: React.ReactNode;
  accent: 'blue' | 'green' | 'violet' | 'gray';
}

const ACCENT_STYLES = {
  blue:   { wrapper: 'bg-blue-50',   icon: 'bg-blue-100 text-blue-600',   value: 'text-blue-700' },
  green:  { wrapper: 'bg-green-50',  icon: 'bg-green-100 text-green-600',  value: 'text-green-700' },
  violet: { wrapper: 'bg-violet-50', icon: 'bg-violet-100 text-violet-600', value: 'text-violet-700' },
  gray:   { wrapper: 'bg-gray-50',   icon: 'bg-gray-100 text-gray-600',   value: 'text-gray-800' },
};

export default function KpiCard({ label, value, subLabel, icon, accent }: KpiCardProps) {
  const styles = ACCENT_STYLES[accent];
  return (
    <div className={`rounded-xl p-6 ${styles.wrapper} shadow-sm ring-1 ring-black ring-opacity-5`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">{label}</p>
          <p className={`text-3xl font-bold truncate ${styles.value}`}>{value}</p>
          {subLabel && (
            <p className="mt-1 text-xs text-gray-500">{subLabel}</p>
          )}
        </div>
        <div className={`ml-4 flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-xl ${styles.icon}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
