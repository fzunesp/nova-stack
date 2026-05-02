import React from 'react';
import Link from 'next/link';
import { getAllTasks } from '@/modules/tasks/task.service';
import type { Task } from '@/generated/prisma/client';
import TaskStatusSelect from '@/components/tasks/TaskStatusSelect';

export const metadata = {
  title: 'Tasks | Nova Stack',
};

export const dynamic = 'force-dynamic';

const STATUS_STYLES: Record<string, string> = {
  todo:        'bg-gray-100 text-gray-600',
  in_progress: 'bg-blue-50 text-blue-700',
  done:        'bg-green-50 text-green-700',
};

const STATUS_LABELS: Record<string, string> = {
  todo:        'To Do',
  in_progress: 'In Progress',
  done:        'Done',
};

function formatDate(date: Date | null | undefined) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

export default async function TasksPage() {
  const tasks = await getAllTasks();

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:tracking-tight">
            Tasks
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Track and manage your team&apos;s work items.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            href="/tasks/new"
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
          >
            Add Task
          </Link>
        </div>
      </div>

      {/* Task list */}
      {tasks.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-lg shadow-sm ring-1 ring-black ring-opacity-5">
          <div className="mx-auto h-12 w-12 text-gray-300 mb-4">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-gray-900">No tasks yet</h3>
          <p className="mt-1 text-sm text-gray-500 mb-6">Start by creating your first task to track work items.</p>
          <div className="mt-6">
            <Link
              href="/tasks/new"
              className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
            >
              Create your first task
            </Link>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto shadow-sm ring-1 ring-black ring-opacity-5 rounded-lg bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-4 pl-4 pr-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:pl-6">Title</th>
                <th className="px-3 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-3 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                <th className="px-3 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {tasks.map((task: Task) => (
                <tr key={task.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 pl-4 pr-3 text-sm sm:pl-6">
                    <Link href={`/tasks/${task.id}/edit`} className="font-medium text-blue-600 hover:text-blue-800">
                      {task.title}
                    </Link>
                    {task.description && (
                      <div className="text-gray-500 text-xs mt-0.5 line-clamp-1">{task.description}</div>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm">
                    <TaskStatusSelect taskId={task.id} currentStatus={task.status} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-600">
                    {formatDate(task.dueDate)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-600">
                    {formatDate(task.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
