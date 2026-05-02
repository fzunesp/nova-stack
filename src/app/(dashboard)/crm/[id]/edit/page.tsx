import React from 'react';
import { notFound } from 'next/navigation';
import { getContactById } from '@/modules/crm/contact.service';
import ContactForm from '@/components/crm/ContactForm';
import Link from 'next/link';
import { editContactAction } from './actions';

interface EditContactPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditContactPage({ params }: EditContactPageProps) {
  const { id } = await params;

  const contact = await getContactById(id);
  if (!contact) notFound();

  // Bind the contact id into the action so the form doesn't need a hidden field
  const boundAction = editContactAction.bind(null, id);

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8 max-w-2xl">
        <div className="flex items-center gap-x-3 mb-4">
          <Link href={`/crm/${id}`} className="text-sm font-semibold text-blue-600 hover:text-blue-500 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Contact
          </Link>
        </div>
        <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
          Edit Contact
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Update the details for <span className="font-medium text-gray-700">{contact.name}</span>.
        </p>
      </div>

      <ContactForm
        initialData={contact}
        action={boundAction}
        cancelHref={`/crm/${id}`}
        submitLabel="Update Contact"
      />
    </div>
  );
}
