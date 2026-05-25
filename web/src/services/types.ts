export type Status = 'draft' | 'active' | 'pending' | 'approved' | 'rejected' | 'archived' | 'lead' | 'inactive' | 'converted'

export interface UserRecord {
  id: string
  name: string
  email: string
  role: 'admin' | 'hr' | 'user'
  companyName?: string
  isActive: boolean
  mustChangePassword?: boolean
  created?: string
  updated?: string
}

export interface CompanyRecord {
  id: string
  name: string
  industry?: string
  website?: string
  phone?: string
  address?: string
  city?: string
  country?: string
  notes?: string
  status: 'lead' | 'active' | 'inactive'
  userId: string
  created_by: string
  created?: string
  updated?: string
}

export interface ContactRecord {
  id: string
  name: string
  email: string
  phone?: string
  title?: string
  companyId?: string
  /** @deprecated use companyId relation instead */
  companyName?: string
  notes?: string
  userId: string
  created_by: string
  status: Status
  assignedToId?: string
  assignedAt?: string
  created?: string
  updated?: string
}

export interface DealRecord {
  id: string
  title: string
  value: number
  stage: 'lead' | 'contacted' | 'quoted' | 'won' | 'lost'
  expectedCloseDate?: string
  notes?: string
  companyId?: string
  contactId?: string
  userId: string
  assignedToId?: string
  assignedAt?: string
  created_by: string
  status: Status
  intakeId?: string
  created?: string
  updated?: string
}

export interface TaskRecord {
  id: string
  title: string
  description?: string
  status: Status
  priority?: 'low' | 'medium' | 'high'
  dueDate?: string
  companyId?: string
  contactId?: string
  dealId?: string
  userId: string
  assignedToId?: string
  assignedAt?: string
  created_by: string
  created?: string
  updated?: string
}

export interface InvoiceRecord {
  id: string
  title: string
  invoiceNumber?: string
  amount: number
  taxRate?: number
  status: Status
  issuedDate?: string
  dueDate?: string
  paidAt?: string
  companyId?: string
  contactId?: string
  dealId?: string
  userId: string
  created_by: string
  assignedToId?: string
  assignedAt?: string
  lineItems?: any
  created?: string
  updated?: string
}

export interface ProductRecord {
  id: string
  name: string
  description?: string
  price: number
  sku?: string
  status: Status
  created_by: string
  created?: string
  updated?: string
}

export interface WebhookRecord {
  id: string
  url: string
  event: 'deal.won' | 'invoice.paid' | 'intake.approved' | 'contact.created'
  isActive: boolean
  created?: string
  updated?: string
}

export interface IntakeRecord {
  id: string
  name: string
  email: string
  message: string
  type: 'general' | 'vacation' | 'reimbursement' | 'hardware'
  source: 'external' | 'internal'
  status: Status
  reference?: string
  data?: Record<string, unknown>
  decisionNote?: string
  decidedAt?: string
  companyId?: string
  contactId?: string
  dealId?: string
  userId: string
  assignedToId?: string
  assignedAt?: string
  created_by: string
  created?: string
  updated?: string
}

export type InteractionType = 'call' | 'email' | 'meeting' | 'note' | 'sms' | 'proposal'

export interface ContactInteraction {
  id: string
  contactId: string
  userId: string
  content: string
  type: InteractionType
  created?: string
  updated?: string
}

export interface AuditLogRecord {
  id: string
  entityType: string
  entityId: string
  action: 'create' | 'update' | 'delete'
  actorId: string
  changes?: Record<string, unknown>
  created?: string
}

export interface ListParams {
  page?: number
  perPage?: number
  sort?: string
  search?: string
  searchFields?: string[]
  filter?: string
}

export interface ListResult<T> {
  items: T[]
  totalItems: number
  totalPages: number
  page: number
  perPage: number
}