import { BaseService } from './base'
import type { DealRecord } from './types'

const ALLOWED_FIELDS: (keyof DealRecord)[] = [
  'title', 'value', 'stage', 'expectedCloseDate', 'notes',
  'companyId', 'contactId', 'userId', 'assignedToId', 'assignedAt', 'status'
]
const REQUIRED_FIELDS: (keyof DealRecord)[] = ['title', 'userId', 'status']

class DealService extends BaseService<DealRecord> {
  protected collection = 'deals'
  protected allowedFields = ALLOWED_FIELDS
  protected requiredCreateFields = REQUIRED_FIELDS

  constructor() {
    super('deals')
  }
}

export const dealService = new DealService()