'use client'

import { useState } from 'react';
import { addDealAction } from '@/app/(dashboard)/crm/deals/new/actions';
import Link from 'next/link';
import { Contact, Deal } from '@/modules/crm/types';

type DealAction = (formData: FormData) => Promise<{ error?: string } | void>;

interface DealFormProps {
  contacts: Contact[];
  initialData?: Partial<Deal>;
  initialContactId?: string;
  action?: DealAction;
  cancelHref?: string;
  submitLabel?: string;
}

function toDateInputValue(date: Date | string | null | undefined): string {
  if (!date) return '';
  return new Date(date).toISOString().split('T')[0];
}

export default function DealForm({
  contacts,
  initialData,
  initialContactId,
  action = addDealAction,
  cancelHref = '/crm/deals',
  submitLabel = 'Save Deal',
}: DealFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setIsPending(true);
    setError(null);
    const result = await action(formData);
    if (result?.error) {
      setError(result.error);
      setIsPending(false);
    }
  };

  const defaultContactId = initialData?.contactId ?? initialContactId ?? '';
  const defaultStage = initialData?.stage ?? 'lead';

  return (
    <form action={handleSubmit} className="space-y-6 max-w-2xl bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl p-8">
      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      
      <div>
        <label htmlFor="title" className="block text-sm font-medium leading-6 text-gray-900">
          Deal Title <span className="text-red-500">*</span>
        </label>
        <div className="mt-2">
          <input
            type="text"
            name="title"
            id="title"
            required
            defaultValue={initialData?.title ?? ''}
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
            placeholder="Enterprise License Agreement"
          />
        </div>
      </div>

      <div>
        <label htmlFor="contactId" className="block text-sm font-medium leading-6 text-gray-900">
          Contact <span className="text-red-500">*</span>
        </label>
        <div className="mt-2">
          <select
            name="contactId"
            id="contactId"
            required
            defaultValue={defaultContactId}
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3 bg-white"
          >
            <option value="" disabled>Select a contact</option>
            {contacts.map((contact) => (
              <option key={contact.id} value={contact.id}>
                {contact.name} {contact.companyName ? `(${contact.companyName})` : ''}
              </option>
            ))}
          </select>
        </div>
        {contacts.length === 0 && (
          <p className="mt-2 text-sm text-yellow-600">
            You don&apos;t have any contacts yet. <Link href="/crm/new" className="underline">Create one first</Link>.
          </p>
        )}
      </div>

      <div>
        <label htmlFor="value" className="block text-sm font-medium leading-6 text-gray-900">
          Value ($) <span className="text-red-500">*</span>
        </label>
        <div className="mt-2 relative rounded-md shadow-sm">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <span className="text-gray-500 sm:text-sm">$</span>
          </div>
          <input
            type="number"
            name="value"
            id="value"
            min="0"
            step="0.01"
            required
            defaultValue={initialData?.value ?? ''}
            className="block w-full rounded-md border-0 py-1.5 pl-7 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 pr-3"
            placeholder="0.00"
          />
        </div>
      </div>

      <div>
        <label htmlFor="stage" className="block text-sm font-medium leading-6 text-gray-900">
          Stage <span className="text-red-500">*</span>
        </label>
        <div className="mt-2">
          <select
            name="stage"
            id="stage"
            required
            defaultValue={defaultStage}
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3 bg-white"
          >
            <option value="lead">Lead</option>
            <option value="contacted">Contacted</option>
            <option value="quoted">Quoted</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="expectedCloseDate" className="block text-sm font-medium leading-6 text-gray-900">
          Expected Close Date
        </label>
        <div className="mt-2">
          <input
            type="date"
            name="expectedCloseDate"
            id="expectedCloseDate"
            defaultValue={toDateInputValue(initialData?.expectedCloseDate)}
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-x-6 border-t border-gray-900/10 pt-6">
        <Link href={cancelHref} className="text-sm font-semibold leading-6 text-gray-900 hover:text-gray-700">
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isPending || contacts.length === 0}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
        >
          {isPending ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
