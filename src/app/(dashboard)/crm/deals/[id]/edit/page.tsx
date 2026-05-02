import React from 'react';
import { notFound } from 'next/navigation';
import { getDealById } from '@/modules/crm/deal.service';
import { getAllContacts } from '@/modules/crm/contact.service';
import DealForm from '@/components/crm/DealForm';
import Link from 'next/link';
import { editDealAction } from './actions';

interface EditDealPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditDealPage({ params }: EditDealPageProps) {
  const { id } = await params;

  const [deal, contacts] = await Promise.all([
    getDealById(id),
    getAllContacts(),
  ]);

  if (!deal) notFound();

  const boundAction = editDealAction.bind(null, id);

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8 max-w-2xl">
        <div className="flex items-center gap-x-3 mb-4">
          <Link href={`/crm/deals/${id}`} className="text-sm font-semibold text-blue-600 hover:text-blue-500 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Deal
          </Link>
        </div>
        <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
          Edit Deal
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Update the details for <span className="font-medium text-gray-700">{deal.title}</span>.
        </p>
      </div>

      <DealForm
        contacts={contacts}
        initialData={deal}
        action={boundAction}
        cancelHref={`/crm/deals/${id}`}
        submitLabel="Update Deal"
      />
    </div>
  );
}
