import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { isProductListingConfirmNotCreatedSuccess } from './productListingConfirmNotCreated'

assert.equal(
  isProductListingConfirmNotCreatedSuccess({
    phase: 'EDITING',
    writeCertainty: 'NOT_STARTED',
    nextAction: 'REVIEW_DRAFT'
  }),
  true
)
assert.equal(
  isProductListingConfirmNotCreatedSuccess({
    phase: 'ACTION_REQUIRED',
    writeCertainty: 'UNKNOWN',
    nextAction: 'CHECK_CREATE_RESULT'
  }),
  false
)

const apiSource = readFileSync(new URL('./api.ts', import.meta.url), 'utf8')
const hookSource = readFileSync(
  new URL('./useProductListingConfirmNotCreated.ts', import.meta.url),
  'utf8'
)
const panelSource = readFileSync(
  new URL('./ProductListingWorkflowPanel.tsx', import.meta.url),
  'utf8'
)

assert.ok(
  apiSource.includes('/tasks/${taskId}/confirm-not-created') &&
    apiSource.includes('postWithoutBody<ProductListingWorkflowView>'),
  'safe return to editing must use one bodyless listing-scoped backend command'
)
assert.ok(
  hookSource.includes("verification.status === 'not_found'") &&
    hookSource.includes('verification.canConfirmNotCreated === true') &&
    hookSource.includes('identityIsCurrent(expectedIdentity)') &&
    hookSource.includes('isProductListingConfirmNotCreatedSuccess(nextWorkflow)') &&
    hookSource.includes('applyWorkflow(nextWorkflow)') &&
    !hookSource.includes('continueProductListingRealRunAfterCreate') &&
    !hookSource.includes('replayProductListingProjection'),
  'the frontend must expose the exit only after backend approval and apply only authoritative workflow truth'
)
assert.ok(
  panelSource.includes('product-listing-confirm-not-created') &&
    panelSource.includes('确认未创建并返回编辑') &&
    panelSource.includes('notCreatedLookupAttemptCount'),
  'the safe exit must be an explicit secondary action with backend attempt evidence'
)
