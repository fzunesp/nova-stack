'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getDealById } from '@/modules/crm/deal.service';
import { createInvoice } from '@/modules/invoices/invoice.service';
import { requireUserId } from '@/lib/auth';
import prisma from '@/lib/db';

export async function createInvoiceFromDealAction(dealId: string) {
  let invoiceId = '';

  try {
    const userId = await requireUserId();

    // 1. Fetch deal by id (ensures user scoping via service layer)
    const deal = await getDealById(dealId);

    if (!deal) {
      return { error: 'Deal not found or unauthorized' } as const;
    }

    // 2. Safety Check: Must have a value
    if (!deal.value || deal.value <= 0) {
      return { error: 'Cannot create invoice: Deal must have a value greater than 0.' } as const;
    }

    // 3. Safety Check: Avoid duplicates (Idempotent check)
    const existingInvoice = await prisma.invoice.findFirst({
      where: { dealId, userId }
    });

    if (existingInvoice) {
      return { error: 'An invoice already exists for this deal.' } as const;
    }

    // 4. Create Invoice
    const invoice = await createInvoice({
      title: `Invoice for ${deal.title}`,
      amount: deal.value,
      status: 'draft',
      dealId: deal.id,
      dueDate: null, // As requested, simple minimal mapping
    });

    invoiceId = invoice.id;

  } catch (error) {
    console.error('Failed to create invoice from deal:', error);
    return { error: error instanceof Error ? error.message : String(error) } as const;
  }

  // Revalidate cache
  revalidatePath('/crm/deals');
  revalidatePath(`/crm/deals/${dealId}`);
  revalidatePath('/invoices');

  // Redirect user to the invoices list (must be outside try/catch)
  redirect('/invoices');
}
