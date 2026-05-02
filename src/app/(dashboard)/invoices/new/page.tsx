import React from 'react';
import Link from 'next/link';
import InvoiceForm from '@/components/invoices/InvoiceForm';
import { createInvoiceAction } from './actions';

export const metadata = {
  title: 'New Invoice | Nova Stack',
};

export default function NewInvoicePage() {
  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8 max-w-2xl">
        <div className="flex items-center gap-x-3 mb-4">
          <Link href="/invoices" className="text-sm font-semibold text-blue-600 hover:text-blue-500 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Invoices
          </Link>
        </div>
        <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
          Create New Invoice
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Create a new invoice to send to your clients.
        </p>
      </div>

      <InvoiceForm action={createInvoiceAction} />
    </div>
  );
}
