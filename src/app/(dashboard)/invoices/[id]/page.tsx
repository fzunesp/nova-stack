import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getInvoiceById } from '@/modules/invoices/invoice.service';
import InvoiceActionButtons from '@/components/invoices/InvoiceActionButtons';

interface InvoiceDetailPageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

function formatDate(date: Date | null | undefined) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString(undefined, {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800 ring-gray-500/20',
  sent: 'bg-blue-100 text-blue-800 ring-blue-500/20',
  paid: 'bg-green-100 text-green-800 ring-green-500/20',
  cancelled: 'bg-red-100 text-red-800 ring-red-500/20',
};

export default async function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  const { id } = await params;

  const invoice = await getInvoiceById(id);

  if (!invoice) {
    notFound();
  }

  const backLink = invoice.dealId
    ? { href: `/crm/deals/${invoice.dealId}`, label: 'Back to Deal' }
    : { href: '/invoices', label: 'Back to Invoices' };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Back navigation */}
      <div className="mb-6">
        <Link href={backLink.href} className="text-sm font-medium text-blue-600 hover:text-blue-900 flex items-center">
          <svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {backLink.label}
        </Link>
      </div>

      {/* Invoice header */}
      <div className="bg-white shadow-sm ring-1 ring-black ring-opacity-5 rounded-lg p-6 mb-8">
        <div className="sm:flex sm:items-start sm:justify-between gap-4">
          <div className="sm:flex-auto min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold leading-tight text-gray-900">
                {invoice.title}
              </h1>
              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-sm font-medium ring-1 ring-inset ${STATUS_STYLES[invoice.status]}`}>
                {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
              </span>
            </div>
            <div className="mt-2 text-3xl font-semibold text-gray-900">
              {formatCurrency(invoice.amount)}
            </div>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center gap-3 flex-shrink-0">
            <InvoiceActionButtons
              invoiceId={invoice.id}
              hasContactEmail={!!invoice.deal?.contact?.email}
              status={invoice.status}
            />
          </div>
        </div>
      </div>

      {/* Invoice details */}
      <div className="bg-white shadow-sm ring-1 ring-black ring-opacity-5 rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-base font-semibold leading-6 text-gray-900">Invoice Details</h3>
        </div>
        <div className="border-t border-gray-100">
          <dl className="divide-y divide-gray-100">
            <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-900">Issued Date</dt>
              <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                {formatDate(invoice.issuedDate)}
              </dd>
            </div>
            <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-900">Due Date</dt>
              <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                {formatDate(invoice.dueDate)}
              </dd>
            </div>
            {invoice.paidAt && (
              <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-900">Paid Date</dt>
                <dd className="mt-1 text-sm leading-6 text-green-700 sm:col-span-2 sm:mt-0 font-medium">
                  {formatDate(invoice.paidAt)}
                </dd>
              </div>
            )}
            {invoice.deal && (
              <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-900">Linked Deal</dt>
                <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                  <Link href={`/crm/deals/${invoice.dealId}`} className="text-blue-600 hover:text-blue-900 font-medium">
                    {invoice.deal.title}
                  </Link>
                </dd>
              </div>
            )}
            {invoice.deal?.contact && (
              <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-900">Contact</dt>
                <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                  <Link href={`/crm/${invoice.deal.contactId}`} className="text-blue-600 hover:text-blue-900 font-medium">
                    {invoice.deal.contact.name}
                  </Link>
                  {invoice.deal.contact.email && (
                    <span className="ml-2 text-gray-500">({invoice.deal.contact.email})</span>
                  )}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </div>
  );
}
