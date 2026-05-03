import prisma from '@/lib/db';
import { requireUserId } from '@/lib/auth';
import type { Invoice } from '@/generated/prisma/client';

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'cancelled';

export type CreateInvoiceInput = Omit<Invoice, 'id' | 'issuedDate' | 'userId' | 'paidAt'> & {
  issuedDate?: Date;
  paidAt?: Date | null;
};
export type UpdateInvoiceInput = Partial<CreateInvoiceInput>;

const VALID_TRANSITIONS: Record<InvoiceStatus, InvoiceStatus[]> = {
  draft: ['sent', 'paid', 'cancelled'],
  sent: ['paid', 'cancelled'],
  paid: [],
  cancelled: [],
};

export function validateInvoiceTransition(currentStatus: string, newStatus: string): { valid: boolean; error?: string } {
  const allowed = VALID_TRANSITIONS[currentStatus as InvoiceStatus];
  if (!allowed) {
    return { valid: false, error: `Unknown invoice status: ${currentStatus}` };
  }
  if (!allowed.includes(newStatus as InvoiceStatus)) {
    return { valid: false, error: `Cannot transition from "${currentStatus}" to "${newStatus}"` };
  }
  return { valid: true };
}

export async function getAllInvoices() {
  try {
    const userId = await requireUserId();
    return await prisma.invoice.findMany({
      where: { userId },
      orderBy: { issuedDate: 'desc' },
      include: { deal: { include: { contact: true } } }
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    throw new Error('Failed to fetch invoices');
  }
}

export async function getInvoiceById(id: string) {
  try {
    const userId = await requireUserId();
    return await prisma.invoice.findFirst({
      where: { id, userId },
      include: { deal: { include: { contact: true } } }
    });
  } catch (error) {
    console.error(`Error fetching invoice ${id}:`, error);
    throw new Error('Failed to fetch invoice');
  }
}

export async function createInvoice(data: CreateInvoiceInput) {
  try {
    const userId = await requireUserId();
    return await prisma.invoice.create({
      data: { ...data, userId }
    });
  } catch (error) {
    console.error('Error creating invoice:', error);
    throw new Error('Failed to create invoice');
  }
}

export async function updateInvoice(id: string, data: UpdateInvoiceInput) {
  try {
    const userId = await requireUserId();
    const existing = await prisma.invoice.findFirst({ where: { id, userId } });
    if (!existing) throw new Error('Not found or unauthorized');

    return await prisma.invoice.update({
      where: { id },
      data
    });
  } catch (error) {
    console.error(`Error updating invoice ${id}:`, error);
    throw new Error('Failed to update invoice');
  }
}

export async function deleteInvoice(id: string) {
  try {
    const userId = await requireUserId();
    const existing = await prisma.invoice.findFirst({ where: { id, userId } });
    if (!existing) throw new Error('Not found or unauthorized');

    return await prisma.invoice.delete({
      where: { id }
    });
  } catch (error) {
    console.error(`Error deleting invoice ${id}:`, error);
    throw new Error('Failed to delete invoice');
  }
}
