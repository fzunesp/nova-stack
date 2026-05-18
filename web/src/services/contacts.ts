import { BaseService } from './base'
import type { ContactRecord } from './types'

const ALLOWED_FIELDS: (keyof ContactRecord)[] = [
  'name', 'email', 'phone', 'title', 'companyId', 'companyName',
  'notes', 'userId', 'status', 'assignedToId', 'assignedAt'
]
const REQUIRED_FIELDS: (keyof ContactRecord)[] = ['name', 'email', 'userId', 'status']

class ContactService extends BaseService<ContactRecord> {
  protected collection = 'contacts'
  protected allowedFields = ALLOWED_FIELDS
  protected requiredCreateFields = REQUIRED_FIELDS

  constructor() {
    super('contacts')
  }
}

export const contactService = new ContactService()