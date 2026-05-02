'use client';

import React, { useTransition } from 'react';
import { markInvoiceSentAction } from '@/app/(dashboard)/invoices/actions';

interface MarkSentButtonProps {
  invoiceId: string;
}

export default function MarkSentButton({ invoiceId }: MarkSentButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleMarkSent = () => {
    startTransition(async () => {
      const result = await markInvoiceSentAction(invoiceId);
      if (result.error) {
        alert(result.error);
      }
    });
  };

  return (
    <button
      onClick={handleMarkSent}
      disabled={isPending}
      className={`inline-flex items-center rounded-md px-2.5 py-1.5 text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
        isPending
          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
          : 'bg-white text-gray-900 hover:bg-gray-50 ring-1 ring-inset ring-gray-300'
      }`}
    >
      {isPending ? 'Marking...' : 'Mark as Sent'}
    </button>
  );
}
