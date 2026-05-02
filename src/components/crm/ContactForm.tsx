'use client'

import { useState } from 'react';
import { addContactAction } from '@/app/(dashboard)/crm/new/actions';
import Link from 'next/link';
import { Contact } from '@/modules/crm/types';

type ContactAction = (formData: FormData) => Promise<{ error?: string } | void>;

interface ContactFormProps {
  initialData?: Partial<Contact>;
  action?: ContactAction;
  cancelHref?: string;
  submitLabel?: string;
}

export default function ContactForm({
  initialData,
  action = addContactAction,
  cancelHref = '/crm',
  submitLabel = 'Save Contact',
}: ContactFormProps) {
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
        <label htmlFor="name" className="block text-sm font-medium leading-6 text-gray-900">
          Name <span className="text-red-500">*</span>
        </label>
        <div className="mt-2">
          <input
            type="text"
            name="name"
            id="name"
            required
            defaultValue={initialData?.name ?? ''}
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
            placeholder="Jane Doe"
          />
        </div>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
          Email
        </label>
        <div className="mt-2">
          <input
            type="email"
            name="email"
            id="email"
            defaultValue={initialData?.email ?? ''}
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
            placeholder="jane@example.com"
          />
        </div>
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium leading-6 text-gray-900">
          Phone
        </label>
        <div className="mt-2">
          <input
            type="tel"
            name="phone"
            id="phone"
            defaultValue={initialData?.phone ?? ''}
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
            placeholder="+1 (555) 000-0000"
          />
        </div>
      </div>

      <div>
        <label htmlFor="companyName" className="block text-sm font-medium leading-6 text-gray-900">
          Company Name
        </label>
        <div className="mt-2">
          <input
            type="text"
            name="companyName"
            id="companyName"
            defaultValue={initialData?.companyName ?? ''}
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
            placeholder="Acme Corp"
          />
        </div>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium leading-6 text-gray-900">
          Notes
        </label>
        <div className="mt-2">
          <textarea
            name="notes"
            id="notes"
            rows={4}
            defaultValue={initialData?.notes ?? ''}
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
            placeholder="Additional context or notes about this contact..."
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
          {isPending ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
