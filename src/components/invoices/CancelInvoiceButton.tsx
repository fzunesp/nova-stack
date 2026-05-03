'use client';

import React, { useTransition } from 'react';
import { cancelInvoiceAction } from '@/app/(dashboard)/invoices/actions';

interface CancelInvoiceButtonProps {
  invoiceId: string;
  disabled?: boolean;
}

export default function CancelInvoiceButton({ invoiceId, disabled }: CancelInvoiceButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleCancel = () => {
    if (!window.confirm('Cancel this invoice?')) return;

    startTransition(async () => {
      const result = await cancelInvoiceAction(invoiceId);
      if (result.error) {
        alert(result.error);
      }
    });
  };

  const isDisabled = disabled || isPending;

  return (
    <button
      onClick={handleCancel}
      disabled={isDisabled}
      className={`inline-flex items-center rounded-md px-2.5 py-1.5 text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 ${
        isDisabled
          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
          : 'bg-red-50 text-red-700 hover:bg-red-100 ring-1 ring-inset ring-red-600/20'
      }`}
    >
      {isPending ? 'Cancelling...' : 'Cancel'}
    </button>
  );
}
