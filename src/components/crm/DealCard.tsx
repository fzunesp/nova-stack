import React from 'react';
import Link from 'next/link';
import { DealWithContact } from '@/modules/crm/types';
import StageSelect from './StageSelect';

interface DealCardProps {
  deal: DealWithContact;
}

export default function DealCard({ deal }: DealCardProps) {
  const formatCurrency = (value: number | null | undefined) => {
    if (value == null) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:border-blue-500 transition-colors group">
      <Link href={`/crm/deals/${deal.id}`} className="block mb-3">
        <h4 className="text-sm font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors line-clamp-2">
          {deal.title}
        </h4>
        <div className="text-sm font-medium text-gray-700 mb-2">
          {formatCurrency(deal.value)}
        </div>
        <div className="flex items-center text-xs text-gray-500">
          <svg className="mr-1.5 h-4 w-4 flex-shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="truncate">{deal.contact?.name || 'Unknown Contact'}</span>
        </div>
      </Link>
      <div className="pt-2 border-t border-gray-100">
        <StageSelect dealId={deal.id} currentStage={deal.stage} />
      </div>
    </div>
  );
}
