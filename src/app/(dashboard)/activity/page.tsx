import React from 'react';
import { getRecentActivity } from '@/modules/dashboard/dashboard.service';
import ActivityFeed from '@/components/dashboard/ActivityFeed';

export const metadata = {
  title: 'Activity | Nova Stack',
};

export const dynamic = 'force-dynamic';

export default async function ActivityPage() {
  const activity = await getRecentActivity();

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:tracking-tight">
          Activity
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Latest events across CRM, Invoices, and Tasks.
        </p>
      </div>

      <div className="max-w-3xl">
        <ActivityFeed items={activity} />
      </div>
    </div>
  );
}
