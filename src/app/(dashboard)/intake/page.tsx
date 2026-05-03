import React from 'react';
import { getAllSubmissions } from '@/modules/intake/intake.service';
import IntakeTable from '@/components/intake/IntakeTable';

export const metadata = {
  title: 'Intake | Nova Stack',
};

export const dynamic = 'force-dynamic';

export default async function IntakePage() {
  const submissions = await getAllSubmissions();

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:tracking-tight">
            Intake
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            External submissions from forms and integrations.
          </p>
        </div>
      </div>

      {submissions.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-lg shadow-sm ring-1 ring-black ring-opacity-5">
          <div className="mx-auto h-12 w-12 text-gray-300 mb-4">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-gray-900">No submissions yet</h3>
          <p className="mt-1 text-sm text-gray-500">Submissions will appear here when submitted via the API.</p>
          <div className="mt-6">
            <code className="text-xs bg-gray-100 px-3 py-2 rounded text-gray-600">
              POST /api/intake
            </code>
          </div>
        </div>
      ) : (
        <IntakeTable submissions={submissions} />
      )}
    </div>
  );
}
