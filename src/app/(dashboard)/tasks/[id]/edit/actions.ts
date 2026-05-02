'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { updateTask, type TaskStatus } from '@/modules/tasks/task.service';

export async function editTaskAction(id: string, formData: FormData) {
  const title = formData.get('title')?.toString().trim() ?? '';
  const description = formData.get('description')?.toString().trim() ?? undefined;
  const dueDateString = formData.get('dueDate')?.toString().trim() ?? undefined;
  const dueDate = dueDateString ? new Date(dueDateString) : null;
  const status = (formData.get('status')?.toString() as TaskStatus) || undefined;

  if (!title) {
    return { error: 'Title is required' } as const;
  }

  try {
    await updateTask(id, {
      title,
      description: description || null,
      dueDate,
      status,
    });
    revalidatePath('/tasks');
    redirect('/tasks');
  } catch (error) {
    console.error('Failed to update task:', error);
    return { error: error instanceof Error ? error.message : String(error) } as const;
  }
}

export async function deleteTaskAction(id: string) {
  try {
    await import('@/modules/tasks/task.service').then(m => m.deleteTask(id));
  } catch (error) {
    console.error('Failed to delete task:', error);
    return { error: 'Failed to delete task' } as const;
  }

  revalidatePath('/tasks');
  redirect('/tasks');
}
