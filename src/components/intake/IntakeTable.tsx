'use client';

import { useTransition } from 'react';
import type { IntakeSubmission } from '@/generated/prisma/client';
import { markReviewedAction, markConvertedAction } from '@/app/(dashboard)/intake/actions';

interface IntakeTableProps {
  submissions: IntakeSubmission[];
}

const STATUS_STYLES: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800 ring-blue-500/20',
  reviewed: 'bg-yellow-100 text-yellow-800 ring-yellow-500/20',
  converted: 'bg-green-100 text-green-800 ring-green-500/20',
};

export default function IntakeTable({ submissions }: IntakeTableProps) {
  const [isPending, startTransition] = useTransition();

  const handleAction = (action: (id: string) => Promise<{ success?: boolean; error?: string }>, id: string) => {
    startTransition(async () => {
      const result = await action(id);
      if (result.error) {
        alert(result.error);
      }
    });
  };

  return (
    <div className="overflow-x-auto shadow-sm ring-1 ring-black ring-opacity-5 rounded-lg bg-white">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="py-4 pl-4 pr-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:pl-6">Name</th>
            <th className="px-3 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
            <th className="px-3 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
            <th className="px-3 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-3 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
            <th className="relative py-4 pl-3 pr-4 sm:pr-6">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {submissions.map((sub) => (
            <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                {sub.name}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-600">
                {sub.email}
              </td>
              <td className="px-3 py-4 text-sm text-gray-600 max-w-xs">
                <span className="line-clamp-2">{sub.message}</span>
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm">
                <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${STATUS_STYLES[sub.status] || 'bg-gray-100 text-gray-800'}`}>
                  {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                </span>
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-600">
                {new Date(sub.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
              </td>
              <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                <div className="flex items-center justify-end gap-2">
                  {sub.status === 'new' && (
                    <button
                      onClick={() => handleAction(markReviewedAction, sub.id)}
                      disabled={isPending}
                      className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Review
                    </button>
                  )}
                  {sub.status !== 'converted' && (
                    <button
                      onClick={() => handleAction(markConvertedAction, sub.id)}
                      disabled={isPending}
                      className="rounded-md bg-green-50 px-2 py-1 text-xs font-semibold text-green-700 hover:bg-green-100 ring-1 ring-inset ring-green-600/20 disabled:opacity-50"
                    >
                      Convert
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
