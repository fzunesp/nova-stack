'use client';

import { useTransition } from 'react';
import { sendInvoiceEmailAction } from '@/app/(dashboard)/invoices/actions';

import MarkPaidButton from './MarkPaidButton';
import MarkSentButton from './MarkSentButton';
import CancelInvoiceButton from './CancelInvoiceButton';

interface InvoiceActionButtonsProps {
  invoiceId: string;
  hasContactEmail: boolean;
  status: string;
}

export default function InvoiceActionButtons({ invoiceId, hasContactEmail, status }: InvoiceActionButtonsProps) {
  const [isPending, startTransition] = useTransition();

  const isTerminal = status === 'paid' || status === 'cancelled';

  const handleSendEmail = () => {
    if (!hasContactEmail) {
      alert('Cannot send: Invoice is not linked to a deal with a valid contact email.');
      return;
    }

    startTransition(async () => {
      const result = await sendInvoiceEmailAction(invoiceId);
      if (result.error) {
        alert(`Failed to send email: ${result.error}`);
      } else {
        alert('Email sent successfully!');
      }
    });
  };

  if (isTerminal) {
    return null;
  }

  return (
    <div className="flex items-center justify-end gap-3">
      {status === 'draft' && <MarkSentButton invoiceId={invoiceId} />}
      <MarkPaidButton invoiceId={invoiceId} status={status} />
      <CancelInvoiceButton invoiceId={invoiceId} />
      <button
        onClick={handleSendEmail}
        disabled={isPending || !hasContactEmail}
        title={!hasContactEmail ? "No contact email linked" : "Send Invoice"}
        className={`inline-flex items-center gap-1 text-sm font-medium ${
          isPending || !hasContactEmail 
            ? 'text-gray-400 cursor-not-allowed' 
            : 'text-indigo-600 hover:text-indigo-900'
        }`}
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        {isPending ? 'Sending...' : 'Send'}
      </button>

      <a
        href={`/api/invoices/${invoiceId}/pdf`}
        download
        className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1 text-sm font-medium"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        PDF
      </a>
    </div>
  );
}
