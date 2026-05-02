import React from 'react';
import { Contact } from '@/modules/crm/types';
import Link from 'next/link';

interface ContactHeaderProps {
  contact: Contact;
}

export default function ContactHeader({ contact }: ContactHeaderProps) {
  return (
    <div className="bg-white shadow-sm ring-1 ring-black ring-opacity-5 rounded-lg p-6 mb-8">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div className="sm:flex-auto">
          <h1 className="text-3xl font-bold leading-tight text-gray-900">
            {contact.name}
          </h1>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {contact.email && (
              <div className="text-sm">
                <span className="font-medium text-gray-500">Email:</span>{' '}
                <a href={`mailto:${contact.email}`} className="text-blue-600 hover:text-blue-900">
                  {contact.email}
                </a>
              </div>
            )}
            {contact.phone && (
              <div className="text-sm">
                <span className="font-medium text-gray-500">Phone:</span>{' '}
                <span className="text-gray-900">{contact.phone}</span>
              </div>
            )}
            {contact.companyName && (
              <div className="text-sm">
                <span className="font-medium text-gray-500">Company:</span>{' '}
                <span className="text-gray-900">{contact.companyName}</span>
              </div>
            )}
          </div>
          {contact.notes && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Notes</h3>
              <p className="text-sm text-gray-900 whitespace-pre-wrap">{contact.notes}</p>
            </div>
          )}
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none flex items-center gap-3">
          <Link
            href={`/crm/${contact.id}/edit`}
            className="block rounded-md bg-white px-3 py-2 text-center text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            Edit Contact
          </Link>
          <Link
            href={`/crm/deals/new?contactId=${contact.id}`}
            className="block rounded-md bg-blue-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Add Deal
          </Link>
        </div>
      </div>
    </div>
  );
}
