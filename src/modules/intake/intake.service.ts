import prisma from '@/lib/db';
import { requireUserId } from '@/lib/auth';
import { Prisma } from '@/generated/prisma/client';
import type { IntakeSubmission, Contact } from '@/generated/prisma/client';

export type CreateSubmissionInput = {
  name: string;
  email: string;
  message: string;
  type?: string;
  source?: string;
  data?: Record<string, unknown>;
};

export async function getAllSubmissions(): Promise<IntakeSubmission[]> {
  const userId = await requireUserId();
  return prisma.intakeSubmission.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createSubmission(input: CreateSubmissionInput): Promise<IntakeSubmission> {
  const userId = await requireUserId();

  const latest = await prisma.intakeSubmission.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: { reference: true },
  });

  let nextNum = 1;
  if (latest?.reference) {
    const match = latest.reference.match(/INT-(\d+)/);
    if (match) {
      nextNum = parseInt(match[1], 10) + 1;
    }
  }
  const reference = `INT-${String(nextNum).padStart(4, '0')}`;

  return prisma.intakeSubmission.create({
    data: {
      name: input.name,
      email: input.email,
      message: input.message,
      type: input.type || 'general',
      source: input.source || 'external',
      reference,
      assignedToId: userId,
      data: input.data as Prisma.InputJsonValue | undefined,
      userId,
    },
  });
}

export async function updateSubmissionAssignee(id: string, assigneeId: string) {
  const userId = await requireUserId();
  const existing = await prisma.intakeSubmission.findFirst({ where: { id, userId } });
  if (!existing) throw new Error('Not found or unauthorized');

  return prisma.intakeSubmission.update({
    where: { id },
    data: { assignedToId: assigneeId },
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

export async function approveSubmission(id: string, note?: string) {
  const userId = await requireUserId();
  const existing = await prisma.intakeSubmission.findFirst({ where: { id, userId } });
  if (!existing) throw new Error('Not found or unauthorized');

  if (existing.status === 'approved') {
    throw new Error('Submission is already approved');
  }

  const updated = await prisma.intakeSubmission.update({
    where: { id },
    data: {
      status: 'approved',
      decisionNote: note || null,
      decidedAt: new Date(),
    },
  });

  await autoTaskOnApproval(existing, userId);

  return updated;
}

export async function rejectSubmission(id: string, note?: string) {
  const userId = await requireUserId();
  const existing = await prisma.intakeSubmission.findFirst({ where: { id, userId } });
  if (!existing) throw new Error('Not found or unauthorized');

  return prisma.intakeSubmission.update({
    where: { id },
    data: {
      status: 'rejected',
      decisionNote: note || null,
      decidedAt: new Date(),
    },
  });
}

async function autoTaskOnApproval(
  submission: IntakeSubmission,
  userId: string
): Promise<void> {
  const type = (submission.type || '').toLowerCase();
  const data = submission.data as Record<string, unknown> | null;

  let title = '';
  let description = '';

  switch (type) {
    case 'vacation': {
      const days = data?.days || data?.duration || '?';
      const dates = data?.startDate
        ? ` (${data.startDate}${data.endDate ? ` to ${data.endDate}` : ''})`
        : '';
      title = `Review vacation request for ${submission.name}`;
      description = `From intake: ${submission.email}\n\n${submission.message}\n\nRequested: ${days} days${dates}`;
      break;
    }
    case 'reimbursement': {
      const amount = data?.amount
        ? `$${data.amount}`
        : data?.total
        ? `$${data.total}`
        : '';
      const category = data?.category || data?.type || '';
      const details = [amount, category].filter(Boolean).join(' — ');
      title = `Process reimbursement for ${submission.name}`;
      description = `From intake: ${submission.email}\n\n${submission.message}\n\n${details}`;
      break;
    }
    case 'hardware': {
      const item = data?.item || data?.device || data?.hardware || '';
      title = `Handle hardware request for ${submission.name}`;
      description = `From intake: ${submission.email}\n\n${submission.message}${item ? `\n\nItem: ${item}` : ''}`;
      break;
    }
    default:
      return; // No auto-task for unknown types
  }

  await prisma.task.create({
    data: {
      title,
      description: description || submission.message,
      status: 'todo',
      userId,
    },
  });
}

async function upsertContactFromSubmission(
  submission: IntakeSubmission,
  userId: string
): Promise<Contact> {
  const existing = await prisma.contact.findFirst({
    where: { email: submission.email, userId },
  });

  if (existing) return existing;

  return prisma.contact.create({
    data: {
      name: submission.name,
      email: submission.email,
      notes: `Created from intake: ${submission.message}`,
      userId,
    },
  });
}

export async function createContactFromSubmission(id: string): Promise<Contact> {
  const userId = await requireUserId();
  const submission = await prisma.intakeSubmission.findFirst({ where: { id, userId } });
  if (!submission) throw new Error('Submission not found or unauthorized');

  const contact = await upsertContactFromSubmission(submission, userId);

  await prisma.intakeSubmission.update({
    where: { id },
    data: { status: 'converted' },
  });

  return contact;
}

export async function createDealFromSubmission(id: string) {
  const userId = await requireUserId();
  const submission = await prisma.intakeSubmission.findFirst({ where: { id, userId } });
  if (!submission) throw new Error('Submission not found or unauthorized');

  const contact = await upsertContactFromSubmission(submission, userId);

  const deal = await prisma.deal.create({
    data: {
      title: `Deal for ${submission.name}`,
      stage: 'lead',
      contactId: contact.id,
      userId,
    },
  });

  await prisma.intakeSubmission.update({
    where: { id },
    data: { status: 'converted' },
  });

  return deal;
}

export async function createTaskFromSubmission(id: string) {
  const userId = await requireUserId();
  const submission = await prisma.intakeSubmission.findFirst({ where: { id, userId } });
  if (!submission) throw new Error('Submission not found or unauthorized');

  const task = await prisma.task.create({
    data: {
      title: `Follow up: ${submission.name}`,
      description: `From intake: ${submission.email}\n\n${submission.message}`,
      status: 'todo',
      userId,
    },
  });

  await prisma.intakeSubmission.update({
    where: { id },
    data: { status: 'converted' },
  });

  return task;
}
