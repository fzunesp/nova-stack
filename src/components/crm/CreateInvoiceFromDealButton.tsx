'use client';

import { useTransition } from 'react';
import { createInvoiceFromDealAction } from '@/app/(dashboard)/crm/deals/invoice-actions';

interface Props {
  dealId: string;
  dealValue: number | null;
}

export default function CreateInvoiceFromDealButton({ dealId, dealValue }: Props) {
  const [isPending, startTransition] = useTransition();

  const handleCreateInvoice = () => {
    if (!dealValue || dealValue <= 0) {
      alert('Cannot create invoice: Deal must have a value greater than 0.');
      return;
    }

    startTransition(async () => {
      const result = await createInvoiceFromDealAction(dealId);
      if (result?.error) {
        alert(result.error);
      }
    });
  };

  return (
    <button
      onClick={handleCreateInvoice}
      disabled={isPending || !dealValue || dealValue <= 0}
      title={(!dealValue || dealValue <= 0) ? "Deal needs a value to create an invoice" : "Create Invoice"}
      className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      {isPending ? 'Creating...' : 'Create Invoice'}
    </button>
  );
}
