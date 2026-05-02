'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateDealStageAction } from '@/app/(dashboard)/crm/deals/actions';

const STAGES = [
  { id: 'lead', label: 'Lead' },
  { id: 'contacted', label: 'Contacted' },
  { id: 'quoted', label: 'Quoted' },
  { id: 'won', label: 'Won' },
  { id: 'lost', label: 'Lost' },
];

const STAGE_COLORS: Record<string, string> = {
  lead: 'text-blue-700 bg-blue-50 ring-blue-700/10',
  contacted: 'text-indigo-700 bg-indigo-50 ring-indigo-700/10',
  quoted: 'text-yellow-800 bg-yellow-50 ring-yellow-600/20',
  won: 'text-green-700 bg-green-50 ring-green-600/20',
  lost: 'text-red-700 bg-red-50 ring-red-600/10',
};

interface StageSelectProps {
  dealId: string;
  currentStage: string;
}

export default function StageSelect({ dealId, currentStage }: StageSelectProps) {
  const router = useRouter();
  const [stage, setStage] = useState(currentStage);
  const [isPending, startTransition] = useTransition();

  const colorClass = STAGE_COLORS[stage.toLowerCase()] ?? 'text-gray-600 bg-gray-50 ring-gray-500/10';

  const handleChange = (newStage: string) => {
    const previousStage = stage;
    setStage(newStage); // optimistic update
    startTransition(async () => {
      const result = await updateDealStageAction(dealId, newStage);
      if (result.error) {
        setStage(previousStage); // revert on failure
      } else {
        router.refresh();
      }
    });
  };

  return (
    <select
      value={stage}
      disabled={isPending}
      onChange={(e) => handleChange(e.target.value)}
      onClick={(e) => e.stopPropagation()} // prevent row click navigation
      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset cursor-pointer transition-opacity disabled:opacity-50 ${colorClass}`}
    >
      {STAGES.map((s) => (
        <option key={s.id} value={s.id}>
          {s.label}
        </option>
      ))}
    </select>
  );
}
