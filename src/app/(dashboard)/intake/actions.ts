'use server';

import { revalidatePath } from 'next/cache';
import {
  updateSubmissionStatus,
  approveSubmission,
  rejectSubmission,
  createContactFromSubmission,
  createDealFromSubmission,
  createTaskFromSubmission,
} from '@/modules/intake/intake.service';

export async function markInReviewAction(id: string) {
  try {
    await updateSubmissionStatus(id, 'in_review');
    revalidatePath('/intake');
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed' };
  }
}

export async function approveSubmissionAction(id: string) {
  try {
    await approveSubmission(id);
    revalidatePath('/intake');
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed' };
  }
}

export async function rejectSubmissionAction(id: string) {
  try {
    await rejectSubmission(id);
    revalidatePath('/intake');
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed' };
  }
}

export async function convertToContactAction(id: string) {
  try {
    await createContactFromSubmission(id);
    revalidatePath('/intake');
    revalidatePath('/crm');
    revalidatePath('/crm/contacts');
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed' };
  }
}

export async function convertToDealAction(id: string) {
  try {
    await createDealFromSubmission(id);
    revalidatePath('/intake');
    revalidatePath('/crm');
    revalidatePath('/crm/deals');
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed' };
  }
}

export async function convertToTaskAction(id: string) {
  try {
    await createTaskFromSubmission(id);
    revalidatePath('/intake');
    revalidatePath('/tasks');
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed' };
  }
}
