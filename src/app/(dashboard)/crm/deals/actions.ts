'use server';

import { updateDeal } from '@/modules/crm/deal.service';
import { revalidatePath } from 'next/cache';

export async function updateDealStageAction(dealId: string, stage: string) {
  try {
    await updateDeal(dealId, { stage });
    revalidatePath('/crm/deals');
    revalidatePath('/crm/deals/board');
    revalidatePath(`/crm/deals/${dealId}`);
    return { success: true };
  } catch {
    return { error: 'Failed to update stage' };
  }
}
