import React from 'react';
import { DealWithContact } from '@/modules/crm/types';
import Link from 'next/link';

interface DealInfoProps {
  deal: DealWithContact;
}

export default function DealInfo({ deal }: DealInfoProps) {
  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return <span className="text-gray-400">-</span>;
    return new Date(date).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getInvoiceStatusBadge = (status: string) => {
    switch(status) {
      case 'paid': return <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">Paid</span>;
      case 'sent': return <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">Sent</span>;
      case 'cancelled': return <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">Cancelled</span>;
      default: return <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800">Draft</span>;
    }
  };

  return (
    <div className="bg-white shadow-sm ring-1 ring-black ring-opacity-5 rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-base font-semibold leading-6 text-gray-900">Deal Information</h3>
      </div>
      <div className="border-t border-gray-100">
        <dl className="divide-y divide-gray-100">
          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-900">Associated Contact</dt>
            <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
              {deal.contact ? (
                <Link href={`/crm/${deal.contactId}`} className="text-blue-600 hover:text-blue-900 font-medium">
                  {deal.contact.name}
                </Link>
              ) : (
                <span className="text-gray-400">No contact assigned</span>
              )}
            </dd>
          </div>
          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-900">Expected Close Date</dt>
            <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
              {formatDate(deal.expectedCloseDate)}
            </dd>
          </div>
          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-900">Created Date</dt>
            <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
              {formatDate(deal.createdAt)}
            </dd>
          </div>
          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-900">Linked Invoices</dt>
            <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
              {deal.invoices && deal.invoices.length > 0 ? (
                <ul role="list" className="divide-y divide-gray-100 rounded-md border border-gray-200">
                  {deal.invoices.map((invoice) => (
                    <li key={invoice.id} className="flex items-center justify-between py-3 pl-3 pr-4 text-sm">
                      <div className="flex w-0 flex-1 flex-col">
                        <span className="truncate font-medium text-gray-900">
                          {invoice.status === 'paid'
                            ? `Invoice Paid (${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(invoice.amount)})`
                            : invoice.status === 'sent'
                            ? 'Invoice Sent'
                            : invoice.status === 'cancelled'
                            ? 'Invoice Cancelled'
                            : 'Invoice Draft'}
                        </span>
                        <span className="truncate text-xs text-gray-500">{invoice.title}</span>
                      </div>
                      <div className="ml-4 flex-shrink-0 flex items-center gap-3">
                        {getInvoiceStatusBadge(invoice.status)}
                        <Link href="/invoices" className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-800">
                          View <span aria-hidden="true">&rarr;</span>
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-gray-400">No invoices linked</span>
              )}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
