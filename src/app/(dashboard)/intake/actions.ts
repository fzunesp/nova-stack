'use server';

import { revalidatePath } from 'next/cache';
import { updateSubmissionStatus } from '@/modules/intake/intake.service';

export async function markReviewedAction(id: string) {
  try {
    await updateSubmissionStatus(id, 'reviewed');
    revalidatePath('/intake');
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed' };
  }
}

export async function markConvertedAction(id: string) {
  try {
    await updateSubmissionStatus(id, 'converted');
    revalidatePath('/intake');
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed' };
  }
}
