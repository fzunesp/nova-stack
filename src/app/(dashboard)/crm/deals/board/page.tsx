import React from 'react';
import Link from 'next/link';
import { getAllDeals } from '@/modules/crm/deal.service';
import DealsBoard from '@/components/crm/DealsBoard';

export const metadata = {
  title: 'Deals Board | Nova Stack CRM',
};

// Force dynamic rendering to ensure fresh data from the database
export const dynamic = 'force-dynamic';

export default async function DealsBoardPage() {
  const deals = await getAllDeals();

  return (
    <div className="max-w-[100vw] py-8 px-4 sm:px-6 lg:px-8 overflow-hidden flex flex-col h-[calc(100vh-64px)]">
      <div className="sm:flex sm:items-center sm:justify-between mb-8 flex-shrink-0">
        <div>
          <div className="flex items-center gap-x-3 mb-2">
            <Link href="/crm/deals" className="text-sm font-semibold text-gray-500 hover:text-gray-700">
              &larr; Back to Deals List
            </Link>
          </div>
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Pipeline Board
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Visual overview of all your deals grouped by stage.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none flex items-center gap-3">
          <Link
            href="/crm/deals"
            className="inline-flex rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            List View
          </Link>
          <Link
            href="/crm/deals/new"
            className="block rounded-md bg-blue-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Add Deal
          </Link>
        </div>
      </div>

      <div className="flex-1 overflow-hidden pb-4">
        <DealsBoard deals={deals} />
      </div>
    </div>
  );
}
