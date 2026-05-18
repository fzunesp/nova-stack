import { AppError } from './errors'
import type { Status } from './types'

export function validateRequired<T extends Record<string, unknown>>(
  data: T,
  fields: (keyof T)[]
): void {
  const missing = fields.filter((f) => {
    const val = data[f]
    return val === undefined || val === null || val === ''
  })
  if (missing.length > 0) {
    throw new AppError(
      'VALIDATION_FAILED',
      `Missing required fields: ${missing.map(String).join(', ')}`
    )
  }
}

export function validateNoUnknownFields<T extends Record<string, unknown>>(
  data: Record<string, unknown>,
  allowedFields: (keyof T)[]
): void {
  const unknown = Object.keys(data).filter((key) => !allowedFields.includes(key as keyof T))
  if (unknown.length > 0) {
    throw new AppError(
      'UNKNOWN_FIELD',
      `Unknown fields: ${unknown.join(', ')}`
    )
  }
}

export const STATUS_TRANSITIONS: Record<string, Record<Status, Status[]>> = {
  contacts: {
    draft: ['active', 'archived'],
    active: ['archived'],
    pending: ['active', 'approved', 'rejected', 'archived'],
    approved: ['archived'],
    rejected: ['active', 'archived'],
    archived: [],
    lead: ['active', 'archived', 'inactive'],
    inactive: ['active', 'archived'],
  },
  deals: {
    draft: ['active', 'pending', 'rejected', 'archived'],
    active: ['approved', 'rejected', 'archived'],
    pending: ['approved', 'rejected', 'archived'],
    approved: ['archived'],
    rejected: ['active', 'archived'],
    archived: [],
    lead: ['active', 'archived', 'inactive'],
    inactive: ['active', 'archived'],
  },
  tasks: {
    draft: ['active', 'archived'],
    active: ['approved', 'archived'],
    pending: ['approved', 'rejected', 'archived'],
    approved: ['archived'],
    rejected: ['active', 'archived'],
    archived: [],
    lead: ['active', 'archived', 'inactive'],
    inactive: ['active', 'archived'],
  },
  invoices: {
    draft: ['pending', 'rejected', 'archived'],
    active: ['pending', 'approved', 'rejected', 'archived'],
    pending: ['approved', 'rejected', 'archived'],
    approved: ['archived'],
    rejected: ['pending', 'archived'],
    archived: [],
    lead: ['active', 'archived', 'inactive'],
    inactive: ['active', 'archived'],
  },
  intake_submissions: {
    draft: ['pending', 'rejected', 'archived'],
    active: ['pending', 'approved', 'rejected', 'archived'],
    pending: ['approved', 'rejected', 'archived'],
    approved: ['archived'],
    rejected: ['pending', 'archived'],
    archived: [],
    lead: ['active', 'archived', 'inactive'],
    inactive: ['active', 'archived'],
  },
  products: {
    draft: ['active', 'archived'],
    active: ['archived'],
    pending: ['active', 'archived'],
    approved: ['archived'],
    rejected: ['active', 'archived'],
    archived: ['active'],
    lead: ['active', 'archived', 'inactive'],
    inactive: ['active', 'archived'],
  },
}

export function validateStatusTransition(
  current: Status,
  next: Status,
  entityType: string
): void {
  const transitions = STATUS_TRANSITIONS[entityType]
  if (!transitions) return

  const allowed = transitions[current]
  if (!allowed || !allowed.includes(next)) {
    throw new AppError(
      'STATUS_TRANSITION_INVALID',
      `Cannot transition ${entityType} status from "${current}" to "${next}"`
    )
  }
}