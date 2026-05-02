'use client';

import React, { useTransition } from 'react';
import { markInvoicePaidAction } from '@/app/(dashboard)/invoices/actions';

interface MarkPaidButtonProps {
  invoiceId: string;
}

export default function MarkPaidButton({ invoiceId }: MarkPaidButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleMarkPaid = () => {
    startTransition(async () => {
      const result = await markInvoicePaidAction(invoiceId);
      if (result.error) {
        alert(result.error);
      }
    });
  };

  return (
    <button
      onClick={handleMarkPaid}
      disabled={isPending}
      className={`inline-flex items-center rounded-md px-2.5 py-1.5 text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 ${
        isPending
          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
          : 'bg-green-50 text-green-700 hover:bg-green-100 ring-1 ring-inset ring-green-600/20'
      }`}
    >
      {isPending ? 'Marking...' : 'Mark as Paid'}
    </button>
  );
}
