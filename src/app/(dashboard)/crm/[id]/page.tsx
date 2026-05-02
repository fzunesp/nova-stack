import React from 'react';
import { notFound } from 'next/navigation';
import { getContactById } from '@/modules/crm/contact.service';
import { getDealsByContact } from '@/modules/crm/deal.service';
import ContactHeader from '@/components/crm/ContactHeader';
import ContactDealsTable from '@/components/crm/ContactDealsTable';
import Link from 'next/link';

interface ContactDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ContactDetailPage({ params }: ContactDetailPageProps) {
  const { id } = await params;
  
  const contact = await getContactById(id);
  
  if (!contact) {
    notFound();
  }

  const deals = await getDealsByContact(id);

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link href="/crm" className="text-sm font-medium text-blue-600 hover:text-blue-900 flex items-center">
          <svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Contacts
        </Link>
      </div>

      <ContactHeader contact={contact} />

      <div className="mt-8 mb-6 sm:flex sm:items-center sm:justify-between">
        <div className="sm:flex-auto">
          <h2 className="text-xl font-semibold leading-tight text-gray-900">Deals</h2>
          <p className="mt-2 text-sm text-gray-700">
            A list of all deals associated with this contact.
          </p>
        </div>
      </div>
      
      <ContactDealsTable deals={deals} />
    </div>
  );
}
