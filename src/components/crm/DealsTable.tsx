"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { DealWithContact } from '@/modules/crm/types';
import StageSelect from './StageSelect';

interface DealsTableProps {
  deals: DealWithContact[];
}

export default function DealsTable({ deals }: DealsTableProps) {
  const router = useRouter();

  const formatCurrency = (value: number | null | undefined) => {
    if (value == null) return <span className="text-gray-400">-</span>;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return <span className="text-gray-400">-</span>;
    return new Date(date).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStageBadge = (stage: string) => {
    const s = stage.toLowerCase();
    if (s.includes('won')) {
      return <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">{stage}</span>;
    }
    if (s.includes('lost') || s.includes('cancel')) {
      return <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">{stage}</span>;
    }
    if (s.includes('lead') || s.includes('prospect')) {
      return <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">{stage}</span>;
    }
    if (s.includes('proposal') || s.includes('negotiation')) {
      return <span className="inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20">{stage}</span>;
    }
    // Default badge
    return <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">{stage}</span>;
  };

  return (
    <div className="overflow-x-auto shadow-sm ring-1 ring-black ring-opacity-5 rounded-lg bg-white">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="py-4 pl-4 pr-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:pl-6">
              Title
            </th>
            <th scope="col" className="px-3 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Contact Name
            </th>
            <th scope="col" className="px-3 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Value
            </th>
            <th scope="col" className="px-3 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Stage
            </th>
            <th scope="col" className="px-3 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Expected Close
            </th>
            <th scope="col" className="px-3 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Created
            </th>
            <th scope="col" className="relative py-4 pl-3 pr-4 sm:pr-6">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {deals.map((deal) => (
            <tr 
              key={deal.id} 
              className="hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => router.push(`/crm/deals/${deal.id}`)}
            >
              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                {deal.title}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-600">
                {deal.contact?.name || <span className="text-gray-400">Unknown</span>}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">
                {formatCurrency(deal.value)}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-600">
                <div onClick={(e) => e.stopPropagation()}>
                  <StageSelect dealId={deal.id} currentStage={deal.stage} />
                </div>
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-600">
                {formatDate(deal.expectedCloseDate)}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-600">
                {formatDate(deal.createdAt)}
              </td>
              <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                <button type="button" className="text-blue-600 hover:text-blue-900 focus:outline-none">
                  Edit<span className="sr-only">, {deal.title}</span>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
