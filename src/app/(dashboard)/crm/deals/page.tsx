import React from 'react';
import Link from 'next/link';
import { getAllDeals } from '@/modules/crm/deal.service';
import DealsTable from '@/components/crm/DealsTable';
import EmptyDealsState from '@/components/crm/EmptyDealsState';

export const metadata = {
  title: 'Deals | Nova Stack CRM',
};

// Force dynamic rendering to ensure fresh data from the database
export const dynamic = 'force-dynamic';

export default async function CRMDealsPage() {
  const deals = await getAllDeals();

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <div className="flex items-center gap-x-3 mb-2">
            <Link href="/crm" className="text-sm font-semibold text-gray-500 hover:text-gray-700">
              &larr; Back to CRM Dashboard
            </Link>
          </div>
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Deals Pipeline
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            A list of all your deals, their current stages, and expected values.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none flex items-center gap-3">
          <Link
            href="/crm/deals/board"
            className="inline-flex rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            Board View
          </Link>
          <Link
            href="/crm/deals/new"
            className="block rounded-md bg-blue-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Add Deal
          </Link>
        </div>
      </div>

      <div className="mt-8 flow-root">
        {deals.length === 0 ? (
          <EmptyDealsState />
        ) : (
          <DealsTable deals={deals} />
        )}
      </div>
    </div>
  );
}
