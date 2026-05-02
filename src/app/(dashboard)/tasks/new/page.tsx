import React from 'react';
import TaskForm from '@/components/tasks/TaskForm';
import { createTaskAction } from './actions';

export const metadata = {
  title: 'Create Task | Nova Stack',
};

export default function NewTaskPage() {
  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8 max-w-2xl">
        <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
          Create New Task
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Add a new task to track work items.
        </p>
      </div>
      
      <TaskForm action={createTaskAction} />
    </div>
  );
}
