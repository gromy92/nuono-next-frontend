import assert from 'node:assert/strict'
import {
  advanceProductListingConfirmNotCreatedStableRead,
  prepareProductListingConfirmNotCreated,
  reconcileProductListingConfirmNotCreated,
  PRODUCT_LISTING_CONFIRM_NOT_CREATED_MAX_STABLE_READS
} from './productListingConfirmNotCreatedCommand'
import type { ProductListingWorkflowView } from './types'

let commandCalls = 0
const result = await prepareProductListingConfirmNotCreated({
  confirm: async () => {
    commandCalls += 1
    throw new TypeError('response lost')
  },
  identityIsCurrent: () => true,
  applyWorkflow: () => true
})

assert.equal(commandCalls, 1, 'confirm-not-created must issue at most one command')
assert.equal(result.status, 'ambiguous_locked')
assert.deepEqual(
  result,
  {
    status: 'ambiguous_locked',
    error: result.error
  },
  'a lost response must enter a refresh-only locked state'
)

const source = {
  taskId: 9001,
  draftId: 10033,
  storeCode: 'STR245027-NSA'
}
assert.equal(
  reconcileProductListingConfirmNotCreated(source, {
    phase: 'ACTION_REQUIRED',
    writeCertainty: 'UNKNOWN',
    nextAction: 'CHECK_CREATE_RESULT',
    draft: {
      draftId: 10033,
      storeCode: 'STR245027-NSA',
      status: 'written_verify_failed',
      validationIssues: []
    },
    realRunTask: {
      taskId: 9001,
      draftId: 10033,
      storeCode: 'STR245027-NSA',
      mode: 'REAL_RUN',
      status: 'written_verify_failed',
      validationIssues: []
    }
  }),
  'waiting'
)
assert.equal(
  reconcileProductListingConfirmNotCreated(source, {
    phase: 'EDITING',
    writeCertainty: 'NOT_STARTED',
    nextAction: 'REVIEW_DRAFT',
    draft: {
      draftId: 10033,
      storeCode: 'STR245027-NSA',
      status: 'draft',
      validationIssues: []
    }
  }),
  'ready'
)

const unchangedWorkflow: ProductListingWorkflowView = {
  phase: 'ACTION_REQUIRED',
  writeCertainty: 'UNKNOWN',
  nextAction: 'CHECK_CREATE_RESULT',
  draft: {
    draftId: 10033,
    storeCode: 'STR245027-NSA',
    status: 'written_verify_failed',
    validationIssues: []
  },
  realRunTask: {
    taskId: 9001,
    draftId: 10033,
    storeCode: 'STR245027-NSA',
    mode: 'REAL_RUN',
    status: 'written_verify_failed',
    validationIssues: []
  }
}
let stableReadCount = 0
for (
  let readIndex = 1;
  readIndex <= PRODUCT_LISTING_CONFIRM_NOT_CREATED_MAX_STABLE_READS;
  readIndex += 1
) {
  const convergence = advanceProductListingConfirmNotCreatedStableRead(
    source,
    unchangedWorkflow,
    stableReadCount
  )
  stableReadCount = convergence.stableReadCount
  assert.equal(
    convergence.decision,
    readIndex === PRODUCT_LISTING_CONFIRM_NOT_CREATED_MAX_STABLE_READS
      ? 'release'
      : 'continue'
  )
}
assert.equal(
  commandCalls,
  1,
  'stable workflow reads may release the client lock but must never replay the confirm command'
)
assert.deepEqual(
  advanceProductListingConfirmNotCreatedStableRead(
    source,
    {
      phase: 'ACTION_REQUIRED',
      writeCertainty: 'UNKNOWN',
      nextAction: 'CHECK_CREATE_RESULT',
      draft: unchangedWorkflow.draft,
      realRunTask: {
        ...unchangedWorkflow.realRunTask!,
        taskId: 9002
      }
    },
    stableReadCount
  ),
  {
    decision: 'changed',
    stableReadCount: 0
  },
  'a different authoritative task must end the old convergence session instead of being counted as stable'
)
