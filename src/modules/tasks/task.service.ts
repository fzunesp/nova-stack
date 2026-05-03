import prisma from '@/lib/db';
import { requireUserId } from '@/lib/auth';

export type TaskStatus = 'todo' | 'in_progress' | 'done';

export interface CreateTaskInput {
  title: string;
  description?: string | null;
  status?: TaskStatus;
  dueDate?: Date | null;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  dueDate?: Date | null;
}

export async function getAllTasks() {
  try {
    const userId = await requireUserId();
    return await prisma.task.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    throw new Error('Failed to fetch tasks');
  }
}

export async function getTaskById(id: string) {
  try {
    const userId = await requireUserId();
    return await prisma.task.findFirst({ where: { id, userId } });
  } catch (error) {
    console.error(`Error fetching task ${id}:`, error);
    throw new Error('Failed to fetch task');
  }
}

export async function createTask(data: CreateTaskInput) {
  try {
    const userId = await requireUserId();
    return await prisma.task.create({ data: { ...data, userId, assignedToId: userId } });
  } catch (error) {
    console.error('Error creating task:', error);
    throw new Error('Failed to create task');
  }
}

export async function updateTask(id: string, data: UpdateTaskInput) {
  try {
    const userId = await requireUserId();
    const existing = await prisma.task.findFirst({ where: { id, userId } });
    if (!existing) throw new Error('Not found or unauthorized');

    return await prisma.task.update({ where: { id }, data });
  } catch (error) {
    console.error(`Error updating task ${id}:`, error);
    throw new Error('Failed to update task');
  }
}

export async function deleteTask(id: string) {
  try {
    const userId = await requireUserId();
    const existing = await prisma.task.findFirst({ where: { id, userId } });
    if (!existing) throw new Error('Not found or unauthorized');

    return await prisma.task.delete({ where: { id } });
  } catch (error) {
    console.error(`Error deleting task ${id}:`, error);
    throw new Error('Failed to delete task');
  }
}

export async function updateTaskAssignee(id: string, assigneeId: string) {
  try {
    const userId = await requireUserId();
    const existing = await prisma.task.findFirst({ where: { id, userId } });
    if (!existing) throw new Error('Not found or unauthorized');

    return await prisma.task.update({
      where: { id },
      data: { assignedToId: assigneeId },
    });
  } catch (error) {
    console.error(`Error updating task assignee ${id}:`, error);
    throw new Error('Failed to update task assignee');
  }
}
