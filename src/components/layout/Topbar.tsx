import React from 'react';
import { requireUserId } from '@/lib/auth';
import prisma from '@/lib/db';
import { logoutAction } from '@/app/login/actions';

export default async function Topbar() {
  const userId = await requireUserId();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  
  const displayName = user?.displayName || user?.name || user?.email || 'User';
  const initial = displayName.charAt(0).toUpperCase();
  return (
    <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex flex-1 items-center">
          <div className="text-sm text-gray-500 font-medium tracking-tight">Nova Stack Workspace</div>
        </div>
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <div className="flex items-center gap-x-4">
            <span className="text-sm font-medium leading-6 text-gray-900">{displayName}</span>
            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center border border-gray-300">
              <span className="text-sm font-medium text-gray-600">{initial}</span>
            </div>
            <form action={logoutAction}>
              <button type="submit" className="text-sm font-medium text-red-600 hover:text-red-800 ml-4">
                Logout
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
