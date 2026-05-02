import React from 'react';
import Link from 'next/link';

export default function EmptyDealsState() {
  return (
    <div className="text-center py-20 bg-white rounded-lg shadow-sm ring-1 ring-black ring-opacity-5">
      <div className="mx-auto h-12 w-12 text-gray-300 mb-4">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      </div>
      <h3 className="text-sm font-semibold text-gray-900">No deals yet</h3>
      <p className="mt-1 text-sm text-gray-500 mb-6">Deals are linked to contacts. Start by creating your first deal.</p>
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          href="/crm/deals/new"
          className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
        >
          Create your first deal
        </Link>
        <Link
          href="/crm/new"
          className="text-sm font-medium text-blue-600 hover:text-blue-500"
        >
          Add a contact first &rarr;
        </Link>
      </div>
    </div>
  );
}
