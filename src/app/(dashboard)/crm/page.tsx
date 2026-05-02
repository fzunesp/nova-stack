import React from 'react';
import Link from 'next/link';
import { getAllContacts } from '@/modules/crm/contact.service';
import { getBusinessMetrics, getRecentActivity } from '@/modules/dashboard/dashboard.service';
import ContactsTable from '@/components/crm/ContactsTable';
import EmptyState from '@/components/crm/EmptyState';
import BusinessKpiGrid from '@/components/dashboard/BusinessKpiGrid';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import FirstRunPanel from '@/components/dashboard/FirstRunPanel';

export const metadata = {
  title: 'Business Overview | Nova Stack',
};

export const dynamic = 'force-dynamic';

export default async function CRMDashboardPage() {
  const [contacts, metrics, activity] = await Promise.all([
    getAllContacts(),
    getBusinessMetrics(),
    getRecentActivity(),
  ]);

  const isFirstRun = contacts.length === 0 && metrics.totalDeals === 0 && metrics.totalInvoices === 0;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">

      {/* Page header */}
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:tracking-tight">
            Business Overview
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Revenue, pipeline, and task performance at a glance.
          </p>
          {!isFirstRun && (
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/crm/new"
                className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-700/10 hover:bg-blue-100"
              >
                + Contact
              </Link>
              <Link
                href="/crm/deals/new"
                className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 ring-1 ring-inset ring-green-700/10 hover:bg-green-100"
              >
                + Deal
              </Link>
              <Link
                href="/invoices/new"
                className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700 ring-1 ring-inset ring-violet-700/10 hover:bg-violet-100"
              >
                + Invoice
              </Link>
            </div>
          )}
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 flex items-center gap-3">
          <Link
            href="/crm/deals/board"
            className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            Board View
          </Link>
          <Link
            href="/crm/deals"
            className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            View Deals
          </Link>
          <Link
            href="/crm/new"
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
          >
            Add Contact
          </Link>
        </div>
      </div>

      {isFirstRun ? (
        <FirstRunPanel />
      ) : (
        <>
          {/* 1. KPI Grid */}
          <BusinessKpiGrid metrics={metrics} />

          {/* 2. Activity Feed */}
          <ActivityFeed items={activity} />
        </>
      )}

      {/* 3. Contacts table — visually secondary */}
      <div className="sm:flex sm:items-center sm:justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Contacts</h2>
          <p className="mt-1 text-sm text-gray-500">
            {contacts.length} contact{contacts.length !== 1 ? 's' : ''} in your CRM.
          </p>
        </div>
        <Link
          href="/crm/new"
          className="mt-3 sm:mt-0 text-sm font-semibold text-blue-600 hover:text-blue-900"
        >
          + Add Contact
        </Link>
      </div>

      <div className="flow-root">
        {contacts.length === 0 ? (
          <EmptyState />
        ) : (
          <ContactsTable contacts={contacts} />
        )}
      </div>

    </div>
  );
}
