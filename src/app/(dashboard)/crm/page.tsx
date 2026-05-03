import React from 'react';
import Link from 'next/link';
import { getBusinessMetrics, getRadarItems, getTodaySummary, getMoneyAtRisk } from '@/modules/dashboard/dashboard.service';
import BusinessKpiGrid from '@/components/dashboard/BusinessKpiGrid';
import RadarPanel from '@/components/dashboard/RadarPanel';
import TodayStrip from '@/components/dashboard/TodayStrip';
import MoneyAtRiskStrip from '@/components/dashboard/MoneyAtRiskStrip';

export const metadata = {
  title: 'Command Center | Nova Stack',
};

export const dynamic = 'force-dynamic';

export default async function CommandCenterPage() {
  const [metrics, radar, today, moneyAtRisk] = await Promise.all([
    getBusinessMetrics(),
    getRadarItems(),
    getTodaySummary(),
    getMoneyAtRisk(),
  ]);

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">

      {/* Page header */}
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:tracking-tight">
            Command Center
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            What needs your attention across deals, invoices, and tasks.
          </p>
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
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 flex items-center gap-3">
          <Link
            href="/crm/deals/board"
            className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            Board View
          </Link>
          <Link
            href="/crm/contacts"
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
          >
            View Contacts
          </Link>
        </div>
      </div>

      {/* 1. Today — summary strip */}
      <TodayStrip summary={today} />

      {/* 2. Money at Risk */}
      <MoneyAtRiskStrip data={moneyAtRisk} />

      {/* 3. Radar — attention system */}
      <RadarPanel data={radar} />

      {/* 4. KPI Grid — compact */}
      <BusinessKpiGrid metrics={metrics} />

    </div>
  );
}
