export type ErrorCode =
  | 'AUTH_INVALID'
  | 'VALIDATION_FAILED'
  | 'NOT_FOUND'
  | 'STATUS_TRANSITION_INVALID'
  | 'UNKNOWN_FIELD'
  | 'UNKNOWN'

export interface AppErrorShape {
  code: ErrorCode
  message: string
  details?: unknown
}

export class AppError extends Error {
  code: ErrorCode
  details?: unknown

  constructor(code: ErrorCode, message: string, details?: unknown) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.details = details
  }

  toJSON(): AppErrorShape {
    return {
      code: this.code,
      message: this.message,
      ...(this.details !== undefined && { details: this.details }),
    }
  }
}

export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError
}

export function toAppError(err: unknown): AppError {
  if (isAppError(err)) return err
  if (err instanceof Error) return new AppError('UNKNOWN', err.message)
  return new AppError('UNKNOWN', 'An unexpected error occurred')
}