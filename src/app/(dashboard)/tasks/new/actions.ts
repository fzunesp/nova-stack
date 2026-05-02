import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createTask } from '@/modules/tasks/task.service';

export async function createTaskAction(formData: FormData) {
  'use server';
  const title = formData.get('title')?.toString().trim() ?? '';
  const description = formData.get('description')?.toString().trim() ?? undefined;
  const dueDateString = formData.get('dueDate')?.toString().trim() ?? undefined;
  const dueDate = dueDateString ? new Date(dueDateString) : undefined;

  if (!title) {
    // Return error payload; Next.js will handle as a thrown error in the UI if needed.
    return { error: 'Title is required' } as const;
  }

  try {
    await createTask({
      title,
      description: description || null,
      dueDate,
      status: 'todo',
    });
    // Revalidate tasks list page so the new task appears immediately.
    revalidatePath('/tasks');
    redirect('/tasks');
  } catch (error) {
    console.error('Failed to create task:', error);
    return { error: error instanceof Error ? error.message : String(error) } as const;
  }
}
