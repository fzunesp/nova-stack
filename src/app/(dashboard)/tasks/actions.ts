'use server';

import { revalidatePath } from 'next/cache';
import type { TaskStatus } from '@/modules/tasks/task.service';
import { updateTask } from '@/modules/tasks/task.service';

export async function updateTaskStatusAction(taskId: string, status: TaskStatus) {
  try {
    // Update only the status field
    await updateTask(taskId, { status });
    // Revalidate the tasks list page (and possibly task detail pages)
    revalidatePath('/tasks');
    // Optionally revalidate individual task page if exists
    // revalidatePath(`/tasks/${taskId}`);
    return { success: true } as const;
  } catch (error) {
    console.error('Failed to update task status:', error);
    return { error: error instanceof Error ? error.message : String(error) } as const;
  }
}
