'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateTaskStatusAction } from '@/app/(dashboard)/tasks/actions';

const STATUSES = [
  { id: 'todo',        label: 'To Do' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'done',        label: 'Done' },
];

const STATUS_COLORS: Record<string, string> = {
  todo:        'text-gray-600   bg-gray-100    ring-gray-500/20',
  in_progress: 'text-yellow-800 bg-yellow-50   ring-yellow-600/20',
  done:        'text-green-700  bg-green-50    ring-green-600/20',
};

interface TaskStatusSelectProps {
  taskId: string;
  currentStatus: string;
}

export default function TaskStatusSelect({ taskId, currentStatus }: TaskStatusSelectProps) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [isPending, startTransition] = useTransition();

  const colorClass = STATUS_COLORS[status] ?? STATUS_COLORS.todo;

  const handleChange = (newStatus: string) => {
    const prev = status;
    setStatus(newStatus); // optimistic
    startTransition(async () => {
      const result = await updateTaskStatusAction(taskId, newStatus as any);
      if (result.error) {
        setStatus(prev); // revert on failure
      } else {
        router.refresh();
      }
    });
  };

  return (
    <select
      value={status}
      disabled={isPending}
      onChange={(e) => handleChange(e.target.value)}
      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset cursor-pointer transition-opacity disabled:opacity-50 ${colorClass}`}
    >
      {STATUSES.map((s) => (
        <option key={s.id} value={s.id}>
          {s.label}
        </option>
      ))}
    </select>
  );
}
