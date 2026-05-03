'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createInvoice } from '@/modules/invoices/invoice.service';

export async function createInvoiceAction(formData: FormData) {
  const title = formData.get('title')?.toString().trim();
  const amountStr = formData.get('amount')?.toString().trim();
  const status = formData.get('status')?.toString().trim() || 'draft';
  const dueDateStr = formData.get('dueDate')?.toString().trim();

  if (!title) {
    return { error: 'Title is required' } as const;
  }

  if (!amountStr || isNaN(parseFloat(amountStr))) {
    return { error: 'Valid amount is required' } as const;
  }

  const amount = parseFloat(amountStr);
  const dueDate = dueDateStr ? new Date(dueDateStr) : undefined;

  let invoiceId = '';

  try {
    const invoice = await createInvoice({
      title,
      amount,
      status,
      dueDate: dueDate || null,
      dealId: null, // Note: minimal implementation as requested
    });

    invoiceId = invoice.id;

    revalidatePath('/invoices');
  } catch (error) {
    console.error('Failed to create invoice:', error);
    return { error: error instanceof Error ? error.message : String(error) } as const;
  }

  redirect(`/invoices/${invoiceId}`);
}
