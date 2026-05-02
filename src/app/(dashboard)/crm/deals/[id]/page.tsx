import React from 'react';
import { notFound } from 'next/navigation';
import { getDealById } from '@/modules/crm/deal.service';
import DealHeader from '@/components/crm/DealHeader';
import DealInfo from '@/components/crm/DealInfo';
import Link from 'next/link';

interface DealDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function DealDetailPage({ params }: DealDetailPageProps) {
  const { id } = await params;
  
  const deal = await getDealById(id);
  
  if (!deal) {
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link href="/crm/deals" className="text-sm font-medium text-blue-600 hover:text-blue-900 flex items-center">
          <svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Deals
        </Link>
      </div>

      <DealHeader deal={deal} />

      <DealInfo deal={deal} />
    </div>
  );
}
