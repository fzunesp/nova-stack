import { BaseService } from './base'
import type { CompanyRecord } from './types'

const ALLOWED_FIELDS: (keyof CompanyRecord)[] = [
  'name', 'industry', 'website', 'phone', 'address',
  'city', 'country', 'notes', 'status', 'userId'
]
const REQUIRED_FIELDS: (keyof CompanyRecord)[] = ['name', 'userId', 'status']

class CompanyService extends BaseService<CompanyRecord> {
  protected collection = 'companies'
  protected allowedFields = ALLOWED_FIELDS
  protected requiredCreateFields = REQUIRED_FIELDS

  constructor() {
    super('companies')
  }
}

export const companyService = new CompanyService()
