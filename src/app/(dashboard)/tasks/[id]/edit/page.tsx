import React from 'react';
import { notFound } from 'next/navigation';
import { getTaskById } from '@/modules/tasks/task.service';
import TaskForm from '@/components/tasks/TaskForm';
import Link from 'next/link';
import { editTaskAction } from './actions';
import DeleteTaskButton from '@/components/tasks/DeleteTaskButton';

export const metadata = {
  title: 'Edit Task | Nova Stack',
};

interface EditTaskPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditTaskPage({ params }: EditTaskPageProps) {
  const { id } = await params;
  const task = await getTaskById(id);

  if (!task) {
    notFound();
  }

  const boundAction = editTaskAction.bind(null, id);

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8 max-w-2xl">
        <div className="flex items-center gap-x-3 mb-4">
          <Link href="/tasks" className="text-sm font-semibold text-blue-600 hover:text-blue-500 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Tasks
          </Link>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
              Edit Task
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Update the details for <span className="font-medium text-gray-700">{task.title}</span>.
            </p>
          </div>
          <div className="flex-shrink-0 ml-4">
            <DeleteTaskButton taskId={task.id} taskTitle={task.title} />
          </div>
        </div>
      </div>

      <TaskForm
        initialData={task}
        action={boundAction}
        submitLabel="Update Task"
      />
    </div>
  );
}
