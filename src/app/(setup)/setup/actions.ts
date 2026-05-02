'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/db';
import { requireUserId } from '@/lib/auth';
import { parseContactsCsv } from '@/modules/imports/csv.parser';
import { importContacts } from '@/modules/imports/contact.import';

export async function saveProfileAction(formData: FormData) {
  const userId = await requireUserId();
  const displayName = formData.get('displayName')?.toString().trim() || null;
  const companyName = formData.get('companyName')?.toString().trim() || null;

  await prisma.user.update({
    where: { id: userId },
    data: {
      displayName,
      companyName,
      name: displayName || undefined,
      onboardingCompleted: true,
    },
  });

  revalidatePath('/setup');
  redirect('/crm');
}

export async function importContactsAction(formData: FormData) {
  const file = formData.get('csvFile') as File | null;

  if (!file || file.size === 0) {
    return { error: 'No file provided.' } as const;
  }

  const text = await file.text();
  const { rows, errors: parseErrors } = parseContactsCsv(text);

  if (rows.length === 0) {
    return { error: 'No valid rows found in CSV.', parseErrors } as const;
  }

  try {
    const result = await importContacts(rows);
    revalidatePath('/crm');
    return { success: true, ...result, parseErrors } as const;
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) } as const;
  }
}
