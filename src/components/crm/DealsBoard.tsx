import React from 'react';
import { DealWithContact } from '@/modules/crm/types';
import DealColumn from './DealColumn';

interface DealsBoardProps {
  deals: DealWithContact[];
}

const STAGES = [
  { id: 'lead', title: 'Lead' },
  { id: 'contacted', title: 'Contacted' },
  { id: 'quoted', title: 'Quoted' },
  { id: 'won', title: 'Won' },
  { id: 'lost', title: 'Lost' },
];

export default function DealsBoard({ deals }: DealsBoardProps) {
  // Group deals by stage
  const dealsByStage = STAGES.reduce((acc, stage) => {
    acc[stage.id] = deals.filter(deal => deal.stage.toLowerCase() === stage.id);
    return acc;
  }, {} as Record<string, DealWithContact[]>);

  // Put any unrecognized stages into 'lead'
  deals.forEach(deal => {
    const stageId = deal.stage.toLowerCase();
    if (!STAGES.find(s => s.id === stageId)) {
      if (!dealsByStage['lead'].find(d => d.id === deal.id)) {
         dealsByStage['lead'].push(deal);
      }
    }
  });

  return (
    <div className="flex space-x-6 overflow-x-auto pb-6 pt-2 h-full items-start snap-x">
      {STAGES.map(stage => (
        <div key={stage.id} className="snap-start h-full max-h-full flex flex-col">
          <DealColumn
            title={stage.title}
            stage={stage.id}
            deals={dealsByStage[stage.id] || []}
          />
        </div>
      ))}
    </div>
  );
}
