import { BaseService } from './base'
import type { IntakeRecord } from './types'

const ALLOWED_FIELDS: (keyof IntakeRecord)[] = [
  'name', 'email', 'message', 'type', 'source', 'status',
  'reference', 'data', 'decisionNote', 'decidedAt',
  'companyId', 'contactId',
  'userId', 'assignedToId', 'assignedAt'
]
const REQUIRED_FIELDS: (keyof IntakeRecord)[] = ['name', 'email', 'message', 'type', 'source', 'userId', 'status']

class IntakeService extends BaseService<IntakeRecord> {
  protected collection = 'intake_submissions'
  protected allowedFields = ALLOWED_FIELDS
  protected requiredCreateFields = REQUIRED_FIELDS

  constructor() {
    super('intake_submissions')
  }
}

export const intakeService = new IntakeService()