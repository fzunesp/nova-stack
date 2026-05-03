'use client';

import { useTransition } from 'react';
import { createInvoiceFromDealAction } from '@/app/(dashboard)/crm/deals/invoice-actions';
import Link from 'next/link';

interface Props {
  dealId: string;
  dealValue: number | null;
  hasInvoice: boolean;
  invoiceId?: string;
}

export default function CreateInvoiceFromDealButton({ dealId, dealValue, hasInvoice, invoiceId }: Props) {
  const [isPending, startTransition] = useTransition();

  const hasValue = dealValue != null && dealValue > 0;

  const handleCreateInvoice = () => {
    startTransition(async () => {
      const result = await createInvoiceFromDealAction(dealId);
      if (result?.error) {
        alert(result.error);
      }
    });
  };

  if (hasInvoice && invoiceId) {
    return (
      <Link
        href="/invoices"
        className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 inline-flex items-center gap-2"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        View Invoice
      </Link>
    );
  }

  return (
    <button
      onClick={handleCreateInvoice}
      disabled={isPending || !hasValue}
      title={!hasValue ? "Add a deal value to create an invoice" : "Create Invoice"}
      className={`rounded-md px-3 py-2 text-sm font-semibold shadow-sm inline-flex items-center gap-2 transition-colors ${
        hasValue
          ? 'bg-blue-600 text-white hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
      }`}
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      {isPending ? 'Creating...' : 'Create Invoice'}
    </button>
  );
}
