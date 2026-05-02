'use server';

import { getInvoiceById, updateInvoice } from '@/modules/invoices/invoice.service';
import { generateInvoicePDF } from '@/modules/invoices/invoice.pdf';
import { sendEmail } from '@/lib/email';
import { revalidatePath } from 'next/cache';

export async function sendInvoiceEmailAction(invoiceId: string) {
  try {
    // 1. Fetch invoice using service layer (enforces userId)
    const invoice = await getInvoiceById(invoiceId);

    if (!invoice) {
      return { error: 'Invoice not found or unauthorized' } as const;
    }

    // 2. Extract contact email
    const contactEmail = invoice.deal?.contact?.email;
    
    if (!contactEmail) {
      return { error: 'Cannot send: Invoice is not linked to a deal with a valid contact email.' } as const;
    }

    // 3. Generate PDF
    const pdfBytes = await generateInvoicePDF(invoice);
    const pdfBuffer = Buffer.from(pdfBytes);

    // 4. Call sendEmail
    await sendEmail({
      to: contactEmail,
      subject: `Invoice: ${invoice.title}`,
      text: `Hello,\n\nPlease find attached the invoice for "${invoice.title}".\n\nAmount Due: $${invoice.amount.toFixed(2)}\nDue Date: ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}\n\nThank you for your business!\n\nNova Stack`,
      attachments: [
        {
          filename: `invoice-${invoice.id.slice(-8)}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        }
      ]
    });

    revalidatePath('/invoices');
    return { success: true } as const;
  } catch (error) {
    console.error('Failed to send invoice email:', error);
    return { error: error instanceof Error ? error.message : String(error) } as const;
  }
}

export async function markInvoicePaidAction(id: string) {
  try {
    const invoice = await getInvoiceById(id);
    if (!invoice) return { error: 'Not found' };
    
    // Idempotency check
    if (invoice.paidAt) return { success: true };
    
    await updateInvoice(id, {
      status: 'paid',
      paidAt: new Date()
    });
    
    revalidatePath('/invoices');
    revalidatePath('/crm');
    if (invoice.dealId) {
      revalidatePath(`/crm/deals/${invoice.dealId}`);
    }
    revalidatePath('/');
    
    return { success: true };
  } catch (error) {
    console.error('Error marking invoice paid:', error);
    return { error: 'Failed to mark as paid' };
  }
}

export async function markInvoiceSentAction(id: string) {
  try {
    const invoice = await getInvoiceById(id);
    if (!invoice) return { error: 'Not found' };
    
    if (invoice.status === 'sent' || invoice.status === 'paid') return { success: true };
    
    await updateInvoice(id, {
      status: 'sent'
    });
    
    revalidatePath('/invoices');
    revalidatePath('/crm');
    if (invoice.dealId) {
      revalidatePath(`/crm/deals/${invoice.dealId}`);
    }
    revalidatePath('/');
    
    return { success: true };
  } catch (error) {
    console.error('Error marking invoice sent:', error);
    return { error: 'Failed to mark as sent' };
  }
}
