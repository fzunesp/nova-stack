import { BaseService } from './base'
import type { TaskRecord } from './types'

const ALLOWED_FIELDS: (keyof TaskRecord)[] = [
  'title', 'description', 'status', 'priority', 'dueDate',
  'companyId', 'contactId', 'dealId',
  'userId', 'assignedToId', 'assignedAt'
]
const REQUIRED_FIELDS: (keyof TaskRecord)[] = ['title', 'userId', 'status']

class TaskService extends BaseService<TaskRecord> {
  protected collection = 'tasks'
  protected allowedFields = ALLOWED_FIELDS
  protected requiredCreateFields = REQUIRED_FIELDS

  constructor() {
    super('tasks')
  }
}

export const taskService = new TaskService()