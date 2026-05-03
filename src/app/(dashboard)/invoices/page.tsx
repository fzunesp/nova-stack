import React from 'react';
import Link from 'next/link';
import { getAllInvoices } from '@/modules/invoices/invoice.service';
import InvoiceActionButtons from '@/components/invoices/InvoiceActionButtons';

export const metadata = {
  title: 'Invoices | Nova Stack',
};

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
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800 ring-gray-500/20',
  sent:  'bg-blue-100 text-blue-800 ring-blue-500/20',
  paid:  'bg-green-100 text-green-800 ring-green-500/20',
  cancelled: 'bg-red-100 text-red-800 ring-red-500/20',
};

export default async function InvoicesPage() {
  const invoices = await getAllInvoices();

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:tracking-tight">
            Invoices
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Invoices are typically created from Deals.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            href="/invoices/new"
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
          >
            Create Invoice
          </Link>
        </div>
      </div>

      {/* Invoice list */}
      {invoices.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-lg shadow-sm ring-1 ring-black ring-opacity-5">
          <div className="mx-auto h-12 w-12 text-gray-300 mb-4">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-gray-900">No invoices yet</h3>
          <p className="mt-1 text-sm text-gray-500">Create one from a Deal to start tracking revenue.</p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/crm/deals"
              className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
            >
              Go to Deals
            </Link>
            <Link
              href="/invoices/new"
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              Create manually &rarr;
            </Link>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto shadow-sm ring-1 ring-black ring-opacity-5 rounded-lg bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-4 pl-4 pr-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:pl-6">Title</th>
                <th className="px-3 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deal</th>
                <th className="px-3 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-3 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-3 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issued Date</th>
                <th className="relative py-4 pl-3 pr-4 sm:pr-6">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className={`transition-colors ${
                  invoice.status === 'paid' ? 'bg-gray-50/50 opacity-75' :
                  invoice.status === 'cancelled' ? 'bg-red-50/30 opacity-60' :
                  'hover:bg-gray-50'
                }`}>
                  <td className="py-4 pl-4 pr-3 text-sm sm:pl-6">
                    <div className="flex items-center gap-2">
                      {invoice.status === 'paid' && (
                        <svg className="h-4 w-4 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      <span className="font-medium text-gray-900">{invoice.title}</span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-600">
                    {invoice.deal ? (
                      <Link href={`/crm/deals/${invoice.dealId}`} className="text-blue-600 hover:text-blue-900">
                        {invoice.deal.title}
                      </Link>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 font-medium">
                    {formatCurrency(invoice.amount)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm">
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${STATUS_STYLES[invoice.status] || 'bg-gray-50 text-gray-600 ring-gray-500/10'}`}>
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-600">
                    <div>{formatDate(invoice.issuedDate)}</div>
                    {invoice.paidAt && (
                      <div className="text-xs text-green-600 mt-1 font-medium">Paid on {formatDate(invoice.paidAt)}</div>
                    )}
                  </td>
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    <InvoiceActionButtons 
                      invoiceId={invoice.id} 
                      hasContactEmail={!!invoice.deal?.contact?.email} 
                      status={invoice.status}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
