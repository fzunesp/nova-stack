'use client';

import React, { useState, useTransition } from 'react';
import type { IntakeSubmission } from '@/generated/prisma/client';
import {
  markInReviewAction,
  approveSubmissionAction,
  rejectSubmissionAction,
  convertToContactAction,
  convertToDealAction,
  convertToTaskAction,
} from '@/app/(dashboard)/intake/actions';

interface IntakeTableProps {
  submissions: IntakeSubmission[];
}

const STATUS_STYLES: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800 ring-blue-500/20',
  in_review: 'bg-yellow-100 text-yellow-800 ring-yellow-500/20',
  approved: 'bg-emerald-100 text-emerald-800 ring-emerald-500/20',
  rejected: 'bg-red-100 text-red-800 ring-red-500/20',
  converted: 'bg-green-100 text-green-800 ring-green-500/20',
};

const STATUS_LABELS: Record<string, string> = {
  new: 'New',
  in_review: 'In Review',
  approved: 'Approved',
  rejected: 'Rejected',
  converted: 'Converted',
};

function formatStatus(s: string) {
  return STATUS_LABELS[s] || s.charAt(0).toUpperCase() + s.slice(1);
}

function JsonPreview({ data }: { data: unknown }) {
  if (!data || (typeof data === 'object' && Object.keys(data as object).length === 0)) return null;

  return (
    <div className="mt-2 bg-gray-50 rounded-md p-3 border border-gray-200 max-w-lg">
      <p className="text-xs font-semibold text-gray-500 mb-1">Additional Data</p>
      <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

function DecisionNote({ sub }: { sub: IntakeSubmission }) {
  if (!sub.decisionNote) return null;
  return (
    <div className="mt-1 text-xs text-gray-400 italic">
      Note: {sub.decisionNote}
      {sub.decidedAt && (
        <span> — {new Date(sub.decidedAt).toLocaleDateString()}</span>
      )}
    </div>
  );
}

export default function IntakeTable({ submissions }: IntakeTableProps) {
  const [isPending, startTransition] = useTransition();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleAction = (action: (id: string) => Promise<{ success?: boolean; error?: string }>, id: string) => {
    startTransition(async () => {
      const result = await action(id);
      if (result.error) {
        alert(result.error);
      }
    });
  };

  const isTerminal = (status: string) =>
    status === 'approved' || status === 'rejected' || status === 'converted';

  return (
    <div className="overflow-x-auto shadow-sm ring-1 ring-black ring-opacity-5 rounded-lg bg-white">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="py-4 pl-4 pr-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:pl-6">Ref</th>
            <th className="px-3 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th className="px-3 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
            <th className="px-3 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
            <th className="px-3 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
            <th className="px-3 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignee</th>
            <th className="px-3 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-3 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
            <th className="relative py-4 pl-3 pr-4 sm:pr-6">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {submissions.map((sub) => (
            <React.Fragment key={sub.id}>
              <tr
                className={`hover:bg-gray-50 transition-colors cursor-pointer ${
                  expandedId === sub.id ? 'bg-blue-50/50' : ''
                }`}
                onClick={() => setExpandedId(expandedId === sub.id ? null : sub.id)}
              >
              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                <span className="inline-flex items-center rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono font-medium text-gray-700">
                  {sub.reference}
                </span>
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">
                {sub.name}
              </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-600">
                  {sub.email}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                    {sub.type}
                  </span>
                </td>
                <td className="px-3 py-4 text-sm text-gray-600 max-w-xs">
                  <span className="line-clamp-2">{sub.message}</span>
                  <DecisionNote sub={sub} />
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-600">
                  {sub.assignedToId ? (
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                      Assigned
                    </span>
                  ) : 'Unassigned'}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm">
                  <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${STATUS_STYLES[sub.status] || 'bg-gray-100 text-gray-800'}`}>
                    {formatStatus(sub.status)}
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-600">
                  {new Date(sub.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                </td>
                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                  <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    {!isTerminal(sub.status) && (
                      <>
                        {sub.status === 'new' && (
                          <button
                            onClick={() => handleAction(markInReviewAction, sub.id)}
                            disabled={isPending}
                            className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                          >
                            Review
                          </button>
                        )}
                        {sub.status !== 'rejected' && (
                          <button
                            onClick={() => handleAction(approveSubmissionAction, sub.id)}
                            disabled={isPending}
                            className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 ring-1 ring-inset ring-emerald-600/20 disabled:opacity-50"
                          >
                            Approve
                          </button>
                        )}
                        <button
                          onClick={() => handleAction(rejectSubmissionAction, sub.id)}
                          disabled={isPending}
                          className="rounded-md bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 ring-1 ring-inset ring-red-600/20 disabled:opacity-50"
                        >
                          Reject
                        </button>
                        <span className="text-gray-300 mx-0.5">|</span>
                        <button
                          onClick={() => handleAction(convertToContactAction, sub.id)}
                          disabled={isPending}
                          className="rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 ring-1 ring-inset ring-blue-600/20 disabled:opacity-50"
                        >
                          Contact
                        </button>
                        <button
                          onClick={() => handleAction(convertToDealAction, sub.id)}
                          disabled={isPending}
                          className="rounded-md bg-green-50 px-2 py-1 text-xs font-semibold text-green-700 hover:bg-green-100 ring-1 ring-inset ring-green-600/20 disabled:opacity-50"
                        >
                          Deal
                        </button>
                        <button
                          onClick={() => handleAction(convertToTaskAction, sub.id)}
                          disabled={isPending}
                          className="rounded-md bg-violet-50 px-2 py-1 text-xs font-semibold text-violet-700 hover:bg-violet-100 ring-1 ring-inset ring-violet-600/20 disabled:opacity-50"
                        >
                          Task
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
              {expandedId === sub.id && (
                <tr key={`${sub.id}-detail`} className="bg-blue-50/30">
                  <td colSpan={9} className="px-4 py-3 sm:px-6">
                    <div className="flex flex-col gap-2">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-1">Full Message</p>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{sub.message}</p>
                      </div>
                      <JsonPreview data={sub.data} />
                      {sub.decisionNote && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-1">Decision</p>
                          <p className="text-sm text-gray-700">{sub.decisionNote}</p>
                          {sub.decidedAt && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              Decided on {new Date(sub.decidedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
