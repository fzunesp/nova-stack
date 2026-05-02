import React from 'react';
import Link from 'next/link';

export default function FirstRunPanel() {
  return (
    <div className="bg-white border-2 border-dashed border-blue-200 rounded-xl p-12 text-center mb-10 shadow-sm">
      <div className="mx-auto h-16 w-16 rounded-full bg-blue-50 flex items-center justify-center mb-6">
        <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" />
        </svg>
      </div>
      
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to your workspace</h2>
      <p className="text-gray-500 max-w-md mx-auto mb-10">
        Start by adding your first contact or importing your existing data from a CSV file.
      </p>
      
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link
          href="/crm/new"
          className="w-full sm:w-auto rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors"
        >
          Add your first contact
        </Link>
        <Link
          href="/setup"
          className="w-full sm:w-auto rounded-md bg-white px-6 py-3 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors"
        >
          Import contacts (CSV)
        </Link>
        <button
          disabled
          title="Create a contact first to enable deals"
          className="w-full sm:w-auto rounded-md bg-gray-50 px-6 py-3 text-sm font-semibold text-gray-400 shadow-sm ring-1 ring-inset ring-gray-200 cursor-not-allowed"
        >
          Create a deal
        </button>
      </div>
      
      <p className="mt-8 text-xs text-gray-400">
        Tip: Deals and Invoices require a contact to be linked.
      </p>
    </div>
  );
}
