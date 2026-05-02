'use client'

import { useState } from 'react';
import Link from 'next/link';

type InvoiceAction = (formData: FormData) => Promise<{ error?: string } | void>;

interface InvoiceFormProps {
  action: InvoiceAction;
  cancelHref?: string;
}

export default function InvoiceForm({
  action,
  cancelHref = '/invoices',
}: InvoiceFormProps) {
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

  return (
    <form action={handleSubmit} className="space-y-6 max-w-2xl bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl p-8">
      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      
      <div>
        <label htmlFor="title" className="block text-sm font-medium leading-6 text-gray-900">
          Invoice Title <span className="text-red-500">*</span>
        </label>
        <div className="mt-2">
          <input
            type="text"
            name="title"
            id="title"
            required
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
            placeholder="Web Development Services"
          />
        </div>
      </div>

      <div>
        <label htmlFor="amount" className="block text-sm font-medium leading-6 text-gray-900">
          Amount (USD) <span className="text-red-500">*</span>
        </label>
        <div className="mt-2">
          <input
            type="number"
            step="0.01"
            min="0"
            name="amount"
            id="amount"
            required
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
            placeholder="1500.00"
          />
        </div>
      </div>

      <div>
        <label htmlFor="status" className="block text-sm font-medium leading-6 text-gray-900">
          Status
        </label>
        <div className="mt-2">
          <select
            name="status"
            id="status"
            defaultValue="draft"
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3 bg-white"
          >
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="dueDate" className="block text-sm font-medium leading-6 text-gray-900">
          Due Date
        </label>
        <div className="mt-2">
          <input
            type="date"
            name="dueDate"
            id="dueDate"
            className="block w-full max-w-sm rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-x-6 border-t border-gray-900/10 pt-6">
        <Link href={cancelHref} className="text-sm font-semibold leading-6 text-gray-900 hover:text-gray-700">
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
        >
          {isPending ? 'Creating...' : 'Create Invoice'}
        </button>
      </div>
    </form>
  );
}
