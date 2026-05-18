import { BaseService } from './base'
import type { InvoiceRecord } from './types'

const ALLOWED_FIELDS: (keyof InvoiceRecord)[] = [
  'title', 'invoiceNumber', 'amount', 'taxRate', 'status',
  'issuedDate', 'dueDate', 'paidAt',
  'companyId', 'contactId', 'dealId',
  'userId', 'assignedToId', 'assignedAt', 'lineItems'
]
const REQUIRED_FIELDS: (keyof InvoiceRecord)[] = ['title', 'amount', 'userId', 'status']

class InvoiceService extends BaseService<InvoiceRecord> {
  protected collection = 'invoices'
  protected allowedFields = ALLOWED_FIELDS
  protected requiredCreateFields = REQUIRED_FIELDS

  constructor() {
    super('invoices')
  }
}

export const invoiceService = new InvoiceService()