import React from 'react';
import { DealWithContact } from '@/modules/crm/types';
import DealCard from './DealCard';

interface DealColumnProps {
  title: string;
  stage: string;
  deals: DealWithContact[];
}

export default function DealColumn({ title, stage, deals }: DealColumnProps) {
  // Simple mapping of stages to header colors for visual flair
  const getHeaderColor = () => {
    if (stage === 'lead') return 'border-blue-500';
    if (stage === 'contacted') return 'border-indigo-500';
    if (stage === 'quoted') return 'border-yellow-500';
    if (stage === 'won') return 'border-green-500';
    if (stage === 'lost') return 'border-red-500';
    return 'border-gray-500';
  };

  return (
    <div className="flex-shrink-0 w-80 flex flex-col bg-gray-50/50 rounded-xl p-3 border border-gray-100 max-h-full">
      <div className={`flex items-center justify-between pb-3 mb-3 border-b-2 ${getHeaderColor()}`}>
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          {title}
        </h3>
        <span className="inline-flex items-center justify-center bg-gray-200 text-gray-700 text-xs font-bold px-2 py-0.5 rounded-full">
          {deals.length}
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-3 min-h-[150px] pr-1 pb-2">
        {deals.length === 0 ? (
          <div className="text-center py-6 text-sm text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
            No deals
          </div>
        ) : (
          deals.map(deal => (
            <DealCard key={deal.id} deal={deal} />
          ))
        )}
      </div>
    </div>
  );
}
