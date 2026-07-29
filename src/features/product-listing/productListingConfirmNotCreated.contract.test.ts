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
const commandSource = readFileSync(
  new URL('./productListingConfirmNotCreatedCommand.ts', import.meta.url),
  'utf8'
)
const panelSource = readFileSync(
  new URL('./ProductListingWorkflowPanel.tsx', import.meta.url),
  'utf8'
)
const pageSource = readFileSync(new URL('./ProductListingPage.tsx', import.meta.url), 'utf8')
const pageStatusSource = readFileSync(
  new URL('./ProductListingPageStatus.tsx', import.meta.url),
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
    commandSource.includes('isProductListingConfirmNotCreatedSuccess(workflow)') &&
    commandSource.includes('params.applyWorkflow(workflow)') &&
    !hookSource.includes('continueProductListingRealRunAfterCreate') &&
    !hookSource.includes('replayProductListingProjection'),
  'the frontend must expose the exit only after backend approval and apply only authoritative workflow truth'
)
assert.ok(
  commandSource.includes('isAmbiguousProductListingCommandError') &&
    hookSource.includes('prepareProductListingConfirmNotCreated({') &&
    hookSource.includes("preparation.status === 'ambiguous_locked'") &&
    hookSource.includes('setAwaiting({ source, expectedIdentity:') &&
    hookSource.includes('callbacksRef.current.refreshWorkflow(') &&
    hookSource.includes('window.setTimeout(() => void poll(), 2500)') &&
    hookSource.includes('confirm: () => confirmProductListingNotCreated('),
  'a lost confirm response must lock duplicate commands and converge only through workflow reads'
)
assert.ok(
  hookSource.includes('advanceProductListingConfirmNotCreatedStableRead(') &&
    hookSource.includes("convergence.decision === 'release'") &&
    hookSource.includes('setReadOnlyPollRestartVersion(current => current + 1)') &&
    hookSource.includes('restartVersion: readOnlyPollRestartVersion') &&
    hookSource.match(/confirmProductListingNotCreated\(/g)?.length === 1,
  'stable authoritative reads may release the client lock and restart read-only checks without replaying confirm-not-created'
)
assert.ok(
  hookSource.includes('awaiting: Boolean(awaiting)') &&
    pageSource.includes('confirmNotCreatedAwaiting={confirmNotCreated.awaiting}') &&
    pageStatusSource.includes('product-listing-confirm-not-created-awaiting'),
  'response-loss convergence must remain visibly locked after the transient toast disappears'
)
assert.ok(
  panelSource.includes('product-listing-confirm-not-created') &&
    panelSource.includes('确认未创建并返回编辑') &&
    panelSource.includes('notCreatedLookupAttemptCount'),
  'the safe exit must be an explicit secondary action with backend attempt evidence'
)
