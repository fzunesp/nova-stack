import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

export interface InvoiceLineItem {
  name: string
  quantity: number
  price: number
  total: number
}

export function generateInvoicePdf(invoice: any) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  // Theme Colors
  const colors = {
    primary: [79, 70, 229] as [number, number, number], // Indigo #4F46E5
    textDark: [30, 41, 59] as [number, number, number],  // Slate 800
    textLight: [100, 116, 139] as [number, number, number], // Slate 500
    bgLight: [248, 250, 252] as [number, number, number], // Slate 50
    border: [226, 232, 240] as [number, number, number], // Slate 200
    success: [22, 163, 74] as [number, number, number], // Green 600
    warning: [217, 119, 6] as [number, number, number], // Amber 600
    danger: [220, 38, 38] as [number, number, number], // Red 600
    neutral: [107, 114, 128] as [number, number, number] // Gray 500
  }

  // Get status color
  const getStatusColor = (status: string): [number, number, number] => {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'paid':
        return colors.success
      case 'pending':
        return colors.warning
      case 'rejected':
      case 'cancelled':
        return colors.danger
      default:
        return colors.neutral
    }
  }

  // Formatting helpers
  const formatCurrency = (val: number) => {
    return '$' + (val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A'
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    } catch {
      return dateStr
    }
  }

  // Extract Invoice Metadata
  const invoiceId = invoice.id || 'N/A'
  const title = invoice.title || 'Invoice'
  const amount = invoice.amount || 0
  const status = invoice.status || 'draft'
  const dueDate = invoice.dueDate ? formatDate(invoice.dueDate) : 'N/A'
  const createdDate = invoice.created ? formatDate(invoice.created) : formatDate(new Date().toISOString())

  const deal = invoice.expand?.dealId
  const contact = deal?.expand?.contactId
  const company = contact?.expand?.companyId

  const clientName = contact?.name || 'Valued Client'
  const clientEmail = contact?.email || ''
  const companyName = company?.name || ''

  // --- HEADER SECTION ---
  // Background decorative accent
  doc.setFillColor(...colors.bgLight)
  doc.rect(0, 0, 210, 45, 'F')

  // Top Accent Bar
  doc.setFillColor(...colors.primary)
  doc.rect(0, 0, 210, 4, 'F')

  // Company Logo / Brand Name
  doc.setFont('Helvetica', 'bold')
  doc.setFontSize(22)
  doc.setTextColor(...colors.primary)
  doc.text('NOVA STACK', 20, 22)

  doc.setFont('Helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...colors.textLight)
  doc.text('PREMIUM ENTERPRISE CRM', 20, 27)

  // INVOICE Header Label
  doc.setFont('Helvetica', 'bold')
  doc.setFontSize(28)
  doc.setTextColor(...colors.textDark)
  doc.text('INVOICE', 190, 24, { align: 'right' })

  // Status Badge
  const statusText = status.toUpperCase()
  const statusColor = getStatusColor(status)
  doc.setFont('Helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...statusColor)
  doc.text(statusText, 190, 31, { align: 'right' })

  // Divider Line
  doc.setDrawColor(...colors.border)
  doc.line(20, 45, 190, 45)

  // --- BILLING INFO ---
  const billingY = 60
  
  // Left Column: Bill From
  doc.setFont('Helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...colors.textLight)
  doc.text('FROM:', 20, billingY)
  
  doc.setFont('Helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(...colors.textDark)
  doc.text('Nova Stack Inc.', 20, billingY + 6)
  
  doc.setFont('Helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...colors.textLight)
  doc.text([
    '100 Enterprise Way, Suite 500',
    'Silicon Valley, CA 94025',
    'billing@novastack.com'
  ], 20, billingY + 11)

  // Right Column: Bill To
  doc.setFont('Helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...colors.textLight)
  doc.text('BILL TO:', 110, billingY)
  
  doc.setFont('Helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(...colors.textDark)
  doc.text(clientName, 110, billingY + 6)
  
  doc.setFont('Helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...colors.textLight)
  const clientLines = []
  if (companyName) clientLines.push(companyName)
  if (clientEmail) clientLines.push(clientEmail)
  clientLines.push('Client ID: ' + (contact?.id || 'N/A'))
  doc.text(clientLines, 110, billingY + 11)

  // --- INVOICE DETAILS METADATA ---
  const metaY = billingY + 30
  doc.setFillColor(...colors.bgLight)
  doc.rect(20, metaY, 170, 16, 'F')
  doc.setDrawColor(...colors.border)
  doc.rect(20, metaY, 170, 16, 'D')

  // Metadata Columns
  doc.setFont('Helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...colors.textLight)
  doc.text('INVOICE NO.', 25, metaY + 6)
  doc.text('DATE OF ISSUE', 65, metaY + 6)
  doc.text('DUE DATE', 110, metaY + 6)
  doc.text('AMOUNT DUE', 155, metaY + 6)

  doc.setFont('Helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...colors.textDark)
  doc.text(invoiceId.slice(0, 8).toUpperCase(), 25, metaY + 12)
  doc.text(createdDate, 65, metaY + 12)
  doc.text(dueDate, 110, metaY + 12)

  doc.setFont('Helvetica', 'bold')
  doc.setTextColor(...colors.primary)
  doc.text(formatCurrency(amount), 155, metaY + 12)

  // Title Description Banner
  doc.setFont('Helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...colors.textDark)
  doc.text('Project / Deal: ' + (deal?.title || title), 20, metaY + 24)

  // --- LINE ITEMS TABLE ---
  const lineItems: InvoiceLineItem[] = Array.isArray(invoice.lineItems) ? invoice.lineItems : []
  
  const tableData = lineItems.map((item, idx) => [
    idx + 1,
    item.name || 'Unknown Item',
    item.quantity || 0,
    formatCurrency(item.price),
    formatCurrency(item.total)
  ])

  // If no items, show a placeholder row
  if (tableData.length === 0) {
    tableData.push([1, 'Standard Professional CRM Services', 1, formatCurrency(amount), formatCurrency(amount)])
  }

  autoTable(doc, {
    startY: metaY + 28,
    margin: { left: 20, right: 20 },
    head: [['#', 'Description', 'Qty', 'Unit Price', 'Amount']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: colors.primary,
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'left',
    },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 80 },
      2: { cellWidth: 15, halign: 'right' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 35, halign: 'right' },
    },
    styles: {
      fontSize: 9,
      cellPadding: 4,
      textColor: colors.textDark,
      valign: 'middle',
    },
    didParseCell: (data) => {
      // Align headers properly
      if (data.section === 'head') {
        if (data.column.index === 2 || data.column.index === 3 || data.column.index === 4) {
          data.cell.styles.halign = 'right'
        }
      }
    }
  })

  // --- SUMMARY SECTION ---
  const finalY = (doc as any).lastAutoTable.finalY || metaY + 60
  const summaryX = 135
  const summaryY = finalY + 10

  doc.setFont('Helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(...colors.textLight)
  doc.text('Subtotal:', summaryX, summaryY)
  doc.text('Discount / Tax (0%):', summaryX, summaryY + 6)
  
  doc.setFont('Helvetica', 'bold')
  doc.setTextColor(...colors.textDark)
  doc.text('Total Amount Due:', summaryX, summaryY + 14)

  // Values
  doc.setFont('Helvetica', 'normal')
  doc.setTextColor(...colors.textDark)
  doc.text(formatCurrency(amount), 190, summaryY, { align: 'right' })
  doc.text(formatCurrency(0), 190, summaryY + 6, { align: 'right' })
  
  doc.setFont('Helvetica', 'bold')
  doc.setTextColor(...colors.primary)
  doc.setFontSize(12)
  doc.text(formatCurrency(amount), 190, summaryY + 14, { align: 'right' })

  // --- FOOTER & T&C ---
  const footerY = 270
  doc.setDrawColor(...colors.border)
  doc.line(20, footerY - 5, 190, footerY - 5)

  doc.setFont('Helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...colors.textDark)
  doc.text('Terms & Conditions', 20, footerY)

  doc.setFont('Helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(...colors.textLight)
  doc.text([
    'Payment is due within the specified period. Thank you for choosing Nova Stack CRM.',
    'For any inquiries, please contact our billing department at billing@novastack.com.',
  ], 20, footerY + 4)

  // Thank You Message
  doc.setFont('Helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(...colors.primary)
  doc.text('Thank You!', 190, footerY + 6, { align: 'right' })

  // Save the PDF
  const filename = `Invoice_${invoiceId.toUpperCase().slice(0, 8)}_${title.replace(/\s+/g, '_')}.pdf`
  doc.save(filename)
}
