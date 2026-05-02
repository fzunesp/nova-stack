'use client';

import { useTransition } from 'react';
import { deleteTaskAction } from '@/app/(dashboard)/tasks/[id]/edit/actions';

interface DeleteTaskButtonProps {
  taskId: string;
  taskTitle: string;
}

export default function DeleteTaskButton({ taskId, taskTitle }: DeleteTaskButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!window.confirm(`Are you sure you want to delete "${taskTitle}"? This cannot be undone.`)) {
      return;
    }
    startTransition(async () => {
      await deleteTaskAction(taskId);
    });
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-red-600 shadow-sm ring-1 ring-inset ring-red-300 hover:bg-red-50 disabled:opacity-50"
    >
      {isPending ? 'Deleting…' : 'Delete Task'}
    </button>
  );
}
