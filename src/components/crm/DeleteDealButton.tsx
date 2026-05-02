'use client';

import { useTransition } from 'react';
import { deleteDealAction } from '@/app/(dashboard)/crm/deals/[id]/edit/actions';

interface DeleteDealButtonProps {
  dealId: string;
  dealTitle: string;
}

export default function DeleteDealButton({ dealId, dealTitle }: DeleteDealButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!window.confirm(`Are you sure you want to delete "${dealTitle}"? This cannot be undone.`)) {
      return;
    }
    startTransition(async () => {
      await deleteDealAction(dealId);
    });
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-red-600 shadow-sm ring-1 ring-inset ring-red-300 hover:bg-red-50 disabled:opacity-50"
    >
      {isPending ? 'Deleting…' : 'Delete Deal'}
    </button>
  );
}
