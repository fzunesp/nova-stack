import React from 'react';
import { DealWithContact } from '@/modules/crm/types';
import StageSelect from './StageSelect';
import Link from 'next/link';
import DeleteDealButton from './DeleteDealButton';
import CreateInvoiceFromDealButton from './CreateInvoiceFromDealButton';

interface DealHeaderProps {
  deal: DealWithContact;
}

export default function DealHeader({ deal }: DealHeaderProps) {
  const formatCurrency = (value: number | null | undefined) => {
    if (value == null) return <span className="text-gray-400">-</span>;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const hasInvoice = deal.invoices != null && deal.invoices.length > 0;
  const invoiceId = hasInvoice ? deal.invoices![0].id : undefined;
  const hasValue = deal.value != null && deal.value > 0;

  return (
    <div className="bg-white shadow-sm ring-1 ring-black ring-opacity-5 rounded-lg p-6 mb-4">
      <div className="sm:flex sm:items-start sm:justify-between gap-4">
        <div className="sm:flex-auto min-w-0">
          <div className="flex items-center gap-4 flex-wrap">
            <h1 className="text-3xl font-bold leading-tight text-gray-900">
              {deal.title}
            </h1>
            <StageSelect dealId={deal.id} currentStage={deal.stage} />
          </div>
          <div className="mt-2 text-2xl font-semibold text-gray-700">
            {formatCurrency(deal.value)}
          </div>
        </div>
        <div className="mt-4 sm:mt-0 flex flex-col items-end gap-1 flex-shrink-0">
          <div className="flex items-center gap-3 flex-wrap justify-end">
            <CreateInvoiceFromDealButton dealId={deal.id} dealValue={deal.value} hasInvoice={hasInvoice} invoiceId={invoiceId} />
            <Link
              href={`/crm/deals/${deal.id}/edit`}
              className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              Edit Deal
            </Link>
            <DeleteDealButton dealId={deal.id} dealTitle={deal.title} />
          </div>
          {!hasInvoice && !hasValue && (
            <span className="text-xs text-gray-400">Add a deal value to create an invoice</span>
          )}
          {!hasInvoice && hasValue && (
            <span className="text-xs text-gray-400">Generate an invoice once this deal is confirmed</span>
          )}
        </div>
      </div>
    </div>
  );
}
