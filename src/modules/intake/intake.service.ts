import prisma from '@/lib/db';
import { requireUserId } from '@/lib/auth';
import type { IntakeSubmission } from '@/generated/prisma/client';

export type CreateSubmissionInput = {
  name: string;
  email: string;
  message: string;
  source?: string;
};

export async function getAllSubmissions(): Promise<IntakeSubmission[]> {
  const userId = await requireUserId();
  return prisma.intakeSubmission.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createSubmission(data: CreateSubmissionInput): Promise<IntakeSubmission> {
  const userId = await requireUserId();
  return prisma.intakeSubmission.create({
    data: {
      name: data.name,
      email: data.email,
      message: data.message,
      source: data.source || 'external',
      userId,
    },
  });
}

export async function updateSubmissionStatus(
  id: string,
  status: string
): Promise<IntakeSubmission> {
  const userId = await requireUserId();
  const existing = await prisma.intakeSubmission.findFirst({ where: { id, userId } });
  if (!existing) throw new Error('Not found or unauthorized');

  return prisma.intakeSubmission.update({
    where: { id },
    data: { status },
  });
}
