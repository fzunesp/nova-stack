'use server'

import { createContact } from '@/modules/crm/contact.service';
import { redirect } from 'next/navigation';

export async function addContactAction(formData: FormData) {
  const name = formData.get('name') as string;
  
  if (!name || name.trim() === '') {
    return { error: 'Name is required' };
  }

  try {
    await createContact({
      name: name.trim(),
      email: (formData.get('email') as string) || null,
      phone: (formData.get('phone') as string) || null,
      companyName: (formData.get('companyName') as string) || null,
      notes: (formData.get('notes') as string) || null,
    });
  } catch (error) {
    return { error: 'Failed to create contact. Please try again.' };
  }

  // Redirect must be called outside try/catch because it throws an error internally
  redirect('/crm');
}
