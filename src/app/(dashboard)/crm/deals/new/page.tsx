import React from 'react';
import DealForm from '@/components/crm/DealForm';
import Link from 'next/link';
import { getAllContacts } from '@/modules/crm/contact.service';

export const metadata = {
  title: 'Add Deal | Nova Stack CRM',
};

// Force dynamic to ensure we always get the latest contacts for the dropdown
export const dynamic = 'force-dynamic';

export default async function NewDealPage({ searchParams }: { searchParams: { contactId?: string } }) {
  const contacts = await getAllContacts();
  const contactId = searchParams?.contactId;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8 max-w-2xl">
        <div className="flex items-center gap-x-3 mb-4">
          <Link href="/crm/deals" className="text-sm font-semibold text-blue-600 hover:text-blue-500 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Deals
          </Link>
        </div>
        <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
          Add New Deal
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Create a new deal and assign it to an existing contact.
        </p>
      </div>
      
      <DealForm contacts={contacts} initialContactId={contactId} />
    </div>
  );
}
