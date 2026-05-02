import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { Invoice } from '@/generated/prisma/client';

export async function generateInvoicePDF(invoice: Invoice): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 800]); // Custom dimensions (width, height)
  
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  const { width, height } = page.getSize();
  
  // formatting utilities
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  // Header Background
  page.drawRectangle({
    x: 0,
    y: height - 120,
    width: width,
    height: 120,
    color: rgb(0.95, 0.95, 0.95), // light gray
  });

  // Header Title
  page.drawText('INVOICE', {
    x: 40,
    y: height - 60,
    size: 28,
    font: helveticaBold,
    color: rgb(0.1, 0.1, 0.1),
  });

  // Invoice Details Block
  page.drawText(`Invoice ID: ${invoice.id.slice(-8).toUpperCase()}`, {
    x: 40,
    y: height - 160,
    size: 12,
    font: helveticaFont,
  });

  page.drawText(`Status: ${invoice.status.toUpperCase()}`, {
    x: 40,
    y: height - 180,
    size: 12,
    font: helveticaBold,
    color: invoice.status === 'paid' ? rgb(0, 0.5, 0) : rgb(0.3, 0.3, 0.3),
  });

  page.drawText(`Issued: ${formatDate(invoice.issuedDate)}`, {
    x: width - 200,
    y: height - 160,
    size: 12,
    font: helveticaFont,
  });

  page.drawText(`Due Date: ${formatDate(invoice.dueDate)}`, {
    x: width - 200,
    y: height - 180,
    size: 12,
    font: helveticaFont,
  });

  // Line separator
  page.drawLine({
    start: { x: 40, y: height - 210 },
    end: { x: width - 40, y: height - 210 },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  });

  // Content
  page.drawText('Description', {
    x: 40,
    y: height - 250,
    size: 14,
    font: helveticaBold,
  });

  page.drawText('Amount', {
    x: width - 150,
    y: height - 250,
    size: 14,
    font: helveticaBold,
  });

  // Items (Just the title for now as per constraints)
  page.drawText(invoice.title, {
    x: 40,
    y: height - 290,
    size: 12,
    font: helveticaFont,
  });

  page.drawText(formatCurrency(invoice.amount), {
    x: width - 150,
    y: height - 290,
    size: 12,
    font: helveticaFont,
  });

  // Total separator
  page.drawLine({
    start: { x: width - 200, y: height - 320 },
    end: { x: width - 40, y: height - 320 },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  });

  page.drawText('Total Due:', {
    x: width - 200,
    y: height - 350,
    size: 14,
    font: helveticaBold,
  });

  page.drawText(formatCurrency(invoice.amount), {
    x: width - 120,
    y: height - 350,
    size: 14,
    font: helveticaBold,
  });

  // Footer
  page.drawText('Thank you for your business.', {
    x: 40,
    y: 50,
    size: 10,
    font: helveticaFont,
    color: rgb(0.4, 0.4, 0.4),
  });

  // Serialize the PDFDocument to bytes (a Uint8Array)
  return await pdfDoc.save();
}
