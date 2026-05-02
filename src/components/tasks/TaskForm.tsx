'use client'

import { useState } from 'react';
import Link from 'next/link';
import type { Task } from '@/generated/prisma/client';

type TaskAction = (formData: FormData) => Promise<{ error?: string } | void>;

interface TaskFormProps {
  initialData?: Partial<Task>;
  action: TaskAction;
  cancelHref?: string;
  submitLabel?: string;
}

function toDateInputValue(date: Date | string | null | undefined): string {
  if (!date) return '';
  return new Date(date).toISOString().split('T')[0];
}

export default function TaskForm({
  initialData,
  action,
  cancelHref = '/tasks',
  submitLabel = 'Create Task',
}: TaskFormProps) {
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

  const isEditMode = !!initialData?.id;

  return (
    <form action={handleSubmit} className="space-y-6 max-w-2xl bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl p-8">
      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      
      <div>
        <label htmlFor="title" className="block text-sm font-medium leading-6 text-gray-900">
          Task Title <span className="text-red-500">*</span>
        </label>
        <div className="mt-2">
          <input
            type="text"
            name="title"
            id="title"
            required
            defaultValue={initialData?.title ?? ''}
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
            placeholder="Review Q3 Financials"
          />
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium leading-6 text-gray-900">
          Description
        </label>
        <div className="mt-2">
          <textarea
            name="description"
            id="description"
            rows={4}
            defaultValue={initialData?.description ?? ''}
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
            placeholder="Add details about what needs to be done..."
          />
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
            defaultValue={toDateInputValue(initialData?.dueDate)}
            className="block w-full max-w-sm rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
          />
        </div>
      </div>

      {isEditMode && (
        <div>
          <label htmlFor="status" className="block text-sm font-medium leading-6 text-gray-900">
            Status
          </label>
          <div className="mt-2">
            <select
              name="status"
              id="status"
              defaultValue={initialData?.status ?? 'todo'}
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3 bg-white"
            >
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>
        </div>
      )}

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
