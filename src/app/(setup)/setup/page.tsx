import React from 'react';
import { requireUserId } from '@/lib/auth';
import prisma from '@/lib/db';
import { saveProfileAction } from './actions';
import CsvUploader from '@/components/imports/CsvUploader';

export const metadata = {
  title: 'Set up your account | Nova Stack',
};

export const dynamic = 'force-dynamic';

export default async function SetupPage() {
  const userId = await requireUserId();
  const user = await prisma.user.findUnique({ where: { id: userId } });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto py-14 px-4 sm:px-6">

        {/* Logo */}
        <div className="flex items-center gap-3 mb-10">
          <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-lg leading-none">N</span>
          </div>
          <span className="text-xl font-bold text-gray-900 tracking-tight">Nova Stack</span>
        </div>

        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Set up your account</h1>
          <p className="mt-1 text-sm text-gray-500">
            Just a few details and you&apos;re ready to go.
          </p>
        </div>

        {/* ──────────────────────────────────── */}
        {/* SECTION A — Required: Account Setup */}
        {/* ──────────────────────────────────── */}
        <div className="bg-white rounded-xl shadow-sm ring-2 ring-blue-200 p-8 mb-6">
          <h2 className="text-base font-semibold text-gray-900 mb-5">Your profile</h2>

          <form action={saveProfileAction} className="space-y-5">
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
                Your name
              </label>
              <input
                type="text"
                name="displayName"
                id="displayName"
                defaultValue={user?.displayName || user?.name || ''}
                placeholder="Jane Smith"
                className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
                Company name
              </label>
              <input
                type="text"
                name="companyName"
                id="companyName"
                defaultValue={user?.companyName || ''}
                placeholder="Acme Corp"
                className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors"
            >
              Continue to Dashboard →
            </button>
          </form>
        </div>

        {/* Divider */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-gray-50 px-4 text-xs text-gray-400 uppercase tracking-wider font-medium">
              Optional
            </span>
          </div>
        </div>

        {/* ──────────────────────────────────────── */}
        {/* SECTION B — Optional: Import Contacts   */}
        {/* ──────────────────────────────────────── */}
        <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 p-8 mb-8">
          <h2 className="text-sm font-semibold text-gray-600 mb-1">
            Import your existing contacts
          </h2>
          <p className="text-xs text-gray-400 mb-5">
            Already have a contact list? Upload a CSV to bring it in automatically.
            CSV must include a <code className="bg-gray-100 px-1 rounded">name</code> column.
            Optional: <code className="bg-gray-100 px-1 rounded">email</code>,{' '}
            <code className="bg-gray-100 px-1 rounded">phone</code>,{' '}
            <code className="bg-gray-100 px-1 rounded">company</code>.
          </p>
          <CsvUploader />
          <p className="mt-6 text-xs text-gray-400">
            More import options (deals, tasks) coming in a future release.
          </p>
        </div>

        {/* Footer skip link */}
        <div className="text-center">
          <form action={saveProfileAction}>
            <button
              type="submit"
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              Skip for now → Go to Dashboard
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
