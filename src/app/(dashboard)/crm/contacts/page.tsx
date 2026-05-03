import React from 'react';
import Link from 'next/link';
import { getAllContacts } from '@/modules/crm/contact.service';
import ContactsTable from '@/components/crm/ContactsTable';
import EmptyState from '@/components/crm/EmptyState';

export const metadata = {
  title: 'Contacts | Nova Stack',
};

export const dynamic = 'force-dynamic';

export default async function ContactsPage() {
  const contacts = await getAllContacts();

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:tracking-tight">
            Contacts
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            {contacts.length} contact{contacts.length !== 1 ? 's' : ''} in your CRM.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            href="/crm/new"
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
          >
            Add Contact
          </Link>
        </div>
      </div>

      {contacts.length === 0 ? (
        <EmptyState />
      ) : (
        <ContactsTable contacts={contacts} />
      )}
    </div>
  );
}
