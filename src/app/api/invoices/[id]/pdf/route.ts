import { NextResponse } from 'next/server';
import { getInvoiceById } from '@/modules/invoices/invoice.service';
import { generateInvoicePDF } from '@/modules/invoices/invoice.pdf';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Service layer enforces userId scoping securely
    const invoice = await getInvoiceById(id);

    if (!invoice) {
      return new NextResponse('Invoice not found', { status: 404 });
    }

    const pdfBytes = await generateInvoicePDF(invoice);

    return new Response(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoice.id.slice(-8)}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return new NextResponse('Failed to generate PDF', { status: 500 });
  }
}
