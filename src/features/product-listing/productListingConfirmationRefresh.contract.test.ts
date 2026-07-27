import assert from 'node:assert/strict'
import { shouldAwaitProductListingConfirmationWorkflow } from './productListingConfirmationRefresh'

assert.equal(shouldAwaitProductListingConfirmationWorkflow(undefined), true)
assert.equal(
  shouldAwaitProductListingConfirmationWorkflow({
    phase: 'READY_TO_CONFIRM',
    writeCertainty: 'NOT_STARTED',
    nextAction: 'CONFIRM_PUBLISH'
  }),
  true
)
assert.equal(
  shouldAwaitProductListingConfirmationWorkflow({
    phase: 'PUBLISHING',
    writeCertainty: 'UNKNOWN',
    nextAction: 'WAIT'
  }),
  false
)
assert.equal(
  shouldAwaitProductListingConfirmationWorkflow({
    phase: 'ACTION_REQUIRED',
    writeCertainty: 'UNKNOWN',
    nextAction: 'CHECK_CREATE_RESULT'
  }),
  false
)
