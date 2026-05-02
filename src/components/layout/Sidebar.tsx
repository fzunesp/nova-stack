'use client'

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigation = [
  { name: 'Dashboard', href: '/crm', exact: true },
  { name: 'Contacts', href: '/crm', exact: true },
  { name: 'Deals', href: '/crm/deals', exact: false },
];

const upcomingModules = [
  { name: 'HR' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4 h-full">
      <div className="flex h-16 shrink-0 items-center">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded bg-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-lg leading-none">N</span>
          </div>
          <span className="text-xl font-bold text-gray-900 tracking-tight">Nova Stack</span>
        </div>
      </div>
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-8">
          <li>
            <div className="text-xs font-semibold leading-6 text-gray-400 uppercase tracking-wider">CRM Module</div>
            <ul role="list" className="-mx-2 mt-2 space-y-1">
              {navigation.map((item, index) => {
                const isActive = item.exact 
                  ? pathname === item.href 
                  : pathname.startsWith(item.href);

                // Avoid duplicate highlight if user clicks "Dashboard" vs "Contacts" (both point to /crm)
                // We'll just highlight both if they are on /crm.

                return (
                  <li key={item.name + index}>
                    <Link
                      href={item.href}
                      className={`
                        group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-medium transition-colors
                        ${isActive 
                          ? 'bg-blue-50 text-blue-700' 
                          : 'text-gray-700 hover:text-blue-700 hover:bg-gray-50'}
                      `}
                    >
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </li>

          <li>
            <div className="text-xs font-semibold leading-6 text-gray-400 uppercase tracking-wider">Tasks Module</div>
            <ul role="list" className="-mx-2 mt-2 space-y-1">
              <li>
                <Link
                  href="/tasks"
                  className={`
                    group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-medium transition-colors
                    ${pathname.startsWith('/tasks')
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:text-blue-700 hover:bg-gray-50'}
                  `}
                >
                  Tasks
                </Link>
              </li>
            </ul>
          </li>

          <li>
            <div className="text-xs font-semibold leading-6 text-gray-400 uppercase tracking-wider">Invoices Module</div>
            <ul role="list" className="-mx-2 mt-2 space-y-1">
              <li>
                <Link
                  href="/invoices"
                  className={`
                    group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-medium transition-colors
                    ${pathname.startsWith('/invoices')
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:text-blue-700 hover:bg-gray-50'}
                  `}
                >
                  Invoices
                </Link>
              </li>
            </ul>
          </li>
          
          <li>
            <div className="text-xs font-semibold leading-6 text-gray-400 uppercase tracking-wider">Upcoming Modules</div>
            <ul role="list" className="-mx-2 mt-2 space-y-1">
              {upcomingModules.map((item) => (
                <li key={item.name}>
                  <div className="group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-medium text-gray-400 cursor-not-allowed items-center">
                    {item.name}
                    <span className="ml-auto inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                      Soon
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </li>
          
          <li className="mt-auto">
            <a
              href="#"
              className="group -mx-2 flex gap-x-3 rounded-md p-2 text-sm font-medium leading-6 text-gray-700 hover:bg-gray-50 hover:text-blue-700 transition-colors"
            >
              Settings
            </a>
          </li>
        </ul>
      </nav>
    </div>
  );
}
