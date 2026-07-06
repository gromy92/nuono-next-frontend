const PENDING_TASK_STATUSES = new Set(['submitted', 'running'])
const REAL_WRITE_ATTEMPT_STATUSES = new Set(['submitted', 'running', 'succeeded', 'failed', 'written_verify_failed'])
const TERMINAL_TASK_STATUSES = new Set([
  'validated',
  'validation_failed',
  'succeeded',
  'failed',
  'rejected',
  'written_verify_failed'
])

export function isProductListingTaskPending(status?: string) {
  return PENDING_TASK_STATUSES.has(status || '')
}

export function isProductListingTaskTerminal(status?: string) {
  return TERMINAL_TASK_STATUSES.has(status || '')
}

export function isProductListingRealWriteAttempt(task?: { status?: string; failureCode?: string }) {
  if (!task) {
    return false
  }
  return (
    REAL_WRITE_ATTEMPT_STATUSES.has(task.status || '') ||
    task.failureCode === 'real_run_already_active' ||
    task.failureCode === 'real_run_already_attempted'
  )
}
