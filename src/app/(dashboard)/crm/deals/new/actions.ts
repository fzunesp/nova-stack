'use server'

import { createDeal } from '@/modules/crm/deal.service';
import { redirect } from 'next/navigation';

export async function addDealAction(formData: FormData) {
  const title = formData.get('title') as string;
  const contactId = formData.get('contactId') as string;
  const valueStr = formData.get('value') as string;
  const stage = formData.get('stage') as string;
  const expectedCloseDateStr = formData.get('expectedCloseDate') as string;

  if (!title || title.trim() === '') {
    return { error: 'Title is required' };
  }

  if (!contactId || contactId.trim() === '') {
    return { error: 'Contact is required' };
  }

  let value: number | null = null;
  if (valueStr && valueStr.trim() !== '') {
    value = parseFloat(valueStr);
    if (isNaN(value)) {
      return { error: 'Value must be a valid number' };
    }
  } else {
    return { error: 'Value is required' };
  }

  let expectedCloseDate: Date | null = null;
  if (expectedCloseDateStr && expectedCloseDateStr.trim() !== '') {
    const dateObj = new Date(expectedCloseDateStr);
    if (!isNaN(dateObj.getTime())) {
      expectedCloseDate = dateObj;
    }
  }

  try {
    await createDeal({
      title: title.trim(),
      contactId: contactId.trim(),
      value,
      stage: stage || 'lead',
      expectedCloseDate,
    });
  } catch (error) {
    return { error: 'Failed to create deal. Please try again.' };
  }

  // Redirect must be called outside try/catch because it throws an error internally
  redirect('/crm/deals');
}
