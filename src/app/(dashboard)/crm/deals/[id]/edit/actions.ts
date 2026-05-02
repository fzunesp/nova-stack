'use server';

import { updateDeal, deleteDeal } from '@/modules/crm/deal.service';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function editDealAction(id: string, formData: FormData) {
  const title = formData.get('title')?.toString().trim();
  if (!title) {
    return { error: 'Deal title is required.' };
  }

  const contactId = formData.get('contactId')?.toString().trim();
  if (!contactId) {
    return { error: 'A contact must be selected.' };
  }

  const rawValue = formData.get('value')?.toString();
  const value = rawValue ? parseFloat(rawValue) : null;

  const rawDate = formData.get('expectedCloseDate')?.toString();
  const expectedCloseDate = rawDate ? new Date(rawDate) : null;

  const stage = formData.get('stage')?.toString() ?? 'lead';

  try {
    await updateDeal(id, { title, value, stage, expectedCloseDate, contactId });
  } catch {
    return { error: 'Failed to update deal. Please try again.' };
  }

  revalidatePath(`/crm/deals/${id}`);
  revalidatePath('/crm/deals');
  revalidatePath('/crm/deals/board');
  revalidatePath('/crm');
  redirect(`/crm/deals/${id}`);
}

export async function deleteDealAction(id: string) {
  try {
    await deleteDeal(id);
  } catch {
    return { error: 'Failed to delete deal.' };
  }

  revalidatePath('/crm/deals');
  revalidatePath('/crm/deals/board');
  revalidatePath('/crm');
  redirect('/crm/deals');
}
