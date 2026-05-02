'use server';

import { updateContact } from '@/modules/crm/contact.service';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function editContactAction(id: string, formData: FormData) {
  const name = formData.get('name')?.toString().trim();
  if (!name) {
    return { error: 'Name is required.' };
  }

  try {
    await updateContact(id, {
      name,
      email:       formData.get('email')?.toString().trim()       || null,
      phone:       formData.get('phone')?.toString().trim()       || null,
      companyName: formData.get('companyName')?.toString().trim() || null,
      notes:       formData.get('notes')?.toString().trim()       || null,
    });
  } catch {
    return { error: 'Failed to update contact. Please try again.' };
  }

  revalidatePath(`/crm/${id}`);
  revalidatePath('/crm');
  redirect(`/crm/${id}`);
}
