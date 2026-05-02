"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Contact } from '@/modules/crm/types';

interface ContactsTableProps {
  contacts: Contact[];
}

export default function ContactsTable({ contacts }: ContactsTableProps) {
  const router = useRouter();

  return (
    <div className="overflow-x-auto shadow-sm ring-1 ring-black ring-opacity-5 rounded-lg bg-white">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="py-4 pl-4 pr-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:pl-6">
              Name
            </th>
            <th scope="col" className="px-3 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Email
            </th>
            <th scope="col" className="px-3 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Phone
            </th>
            <th scope="col" className="px-3 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Company
            </th>
            <th scope="col" className="px-3 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Created
            </th>
            <th scope="col" className="relative py-4 pl-3 pr-4 sm:pr-6">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {contacts.map((contact) => (
            <tr 
              key={contact.id} 
              className="hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => router.push(`/crm/${contact.id}`)}
            >
              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                {contact.name}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-600">
                {contact.email || <span className="text-gray-400">-</span>}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-600">
                {contact.phone || <span className="text-gray-400">-</span>}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-600">
                {contact.companyName || <span className="text-gray-400">-</span>}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-600">
                {new Date(contact.createdAt).toLocaleDateString(undefined, { 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </td>
              <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                <button type="button" className="text-blue-600 hover:text-blue-900 focus:outline-none">
                  Edit<span className="sr-only">, {contact.name}</span>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
