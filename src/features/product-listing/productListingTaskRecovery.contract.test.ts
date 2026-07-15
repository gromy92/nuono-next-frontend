import assert from 'node:assert/strict'
import { recoverProductListingTasksFromRecent } from './taskRecovery'
import type { ProductListingTaskView } from './types'

function task(values: Partial<ProductListingTaskView> & Pick<ProductListingTaskView, 'taskId' | 'mode' | 'status'>): ProductListingTaskView {
  return {
    draftId: values.draftId ?? 10001,
    storeCode: values.storeCode ?? 'STR245027-NSA',
    validationIssues: [],
    submittedAt: values.submittedAt,
    ...values
  }
}

const latestDryRun = task({
  taskId: 20004,
  mode: 'DRY_RUN',
  status: 'validated',
  submittedAt: '2026-07-06T10:30:00'
})
const matchingRealRun = task({
  taskId: 20005,
  mode: 'REAL_RUN',
  status: 'submitted',
  sourceTaskId: latestDryRun.taskId,
  submittedAt: '2026-07-06T10:31:00'
})
const staleRealRun = task({
  taskId: 20003,
  mode: 'REAL_RUN',
  status: 'succeeded',
  sourceTaskId: 20001,
  submittedAt: '2026-07-06T10:20:00'
})

const recovered = recoverProductListingTasksFromRecent([
  staleRealRun,
  matchingRealRun,
  latestDryRun,
  task({
    taskId: 20001,
    mode: 'DRY_RUN',
    status: 'validated',
    submittedAt: '2026-07-06T10:10:00'
  })
], 10001)

assert.equal(recovered.dryRunTask?.taskId, 20004)
assert.equal(recovered.realRunTask?.taskId, 20005)

const nextDryRunOnly = recoverProductListingTasksFromRecent([
  matchingRealRun,
  task({
    taskId: 20006,
    mode: 'DRY_RUN',
    status: 'validated',
    submittedAt: '2026-07-06T10:40:00'
  })
], 10001)

assert.equal(nextDryRunOnly.dryRunTask?.taskId, 20006)
assert.equal(nextDryRunOnly.realRunTask, undefined)

const recoverableUnknownRealRun = task({
  taskId: 20008,
  mode: 'REAL_RUN',
  status: 'written_verify_failed',
  sourceTaskId: latestDryRun.taskId,
  failureCode: 'noon_create_outcome_unknown',
  submittedAt: '2026-07-06T10:35:00'
})
const newerDryRun = task({
  taskId: 20009,
  mode: 'DRY_RUN',
  status: 'validated',
  submittedAt: '2026-07-06T10:40:00'
})
const recoverable = recoverProductListingTasksFromRecent([
  newerDryRun,
  recoverableUnknownRealRun,
  latestDryRun
], 10001)

assert.equal(recoverable.dryRunTask?.taskId, latestDryRun.taskId)
assert.equal(recoverable.realRunTask?.taskId, recoverableUnknownRealRun.taskId)

const otherDraftTask = task({
  taskId: 20007,
  draftId: 10002,
  mode: 'DRY_RUN',
  status: 'validated',
  submittedAt: '2026-07-06T10:50:00'
})
assert.equal(recoverProductListingTasksFromRecent([otherDraftTask], 10001).dryRunTask, undefined)
assert.deepEqual(recoverProductListingTasksFromRecent([latestDryRun]), {})
