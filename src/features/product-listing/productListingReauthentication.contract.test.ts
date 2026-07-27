import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  isProductListingReauthenticationSuccess,
  isProductListingReauthenticationTarget,
  productListingReauthenticationConfirmationConfig,
  productListingReauthenticationFailureNotice,
  productListingReauthenticationProgressNotice,
  productListingReauthenticationSuccessNotice,
  shouldAutoStartProductListingReauthentication
} from './productListingReauthentication'
import type { ProductListingWorkflowView } from './types'

const editableWorkflow: ProductListingWorkflowView = {
  phase: 'EDITING',
  writeCertainty: 'NOT_STARTED',
  nextAction: 'REVIEW_DRAFT'
}
const authenticationFailureWorkflow: ProductListingWorkflowView = {
  phase: 'ACTION_REQUIRED',
  writeCertainty: 'NOT_STARTED',
  nextAction: 'REAUTHENTICATE'
}
const writtenAuthenticationFailureWorkflow: ProductListingWorkflowView = {
  phase: 'ACTION_REQUIRED',
  writeCertainty: 'WRITTEN',
  nextAction: 'REAUTHENTICATE'
}
const uncertainAuthenticationFailureWorkflow: ProductListingWorkflowView = {
  phase: 'ACTION_REQUIRED',
  writeCertainty: 'UNKNOWN',
  nextAction: 'REAUTHENTICATE'
}
const resumedCreateWorkflow: ProductListingWorkflowView = {
  phase: 'PUBLISHING',
  writeCertainty: 'NOT_STARTED',
  nextAction: 'WAIT'
}

assert.equal(isProductListingReauthenticationSuccess(editableWorkflow), true)
assert.equal(isProductListingReauthenticationSuccess(resumedCreateWorkflow), true)
assert.equal(isProductListingReauthenticationSuccess(authenticationFailureWorkflow), false)
assert.equal(isProductListingReauthenticationTarget(authenticationFailureWorkflow), true)
assert.equal(shouldAutoStartProductListingReauthentication(authenticationFailureWorkflow), true)
assert.equal(shouldAutoStartProductListingReauthentication(writtenAuthenticationFailureWorkflow), false)
assert.equal(shouldAutoStartProductListingReauthentication(uncertainAuthenticationFailureWorkflow), false)
assert.equal(isProductListingReauthenticationTarget(writtenAuthenticationFailureWorkflow), true)
assert.equal(isProductListingReauthenticationTarget(uncertainAuthenticationFailureWorkflow), true)
assert.equal(
  isProductListingReauthenticationSuccess({
    ...uncertainAuthenticationFailureWorkflow,
    nextAction: 'CHECK_CREATE_RESULT'
  }),
  true
)
assert.equal(
  isProductListingReauthenticationSuccess({
    ...writtenAuthenticationFailureWorkflow,
    nextAction: 'CONTINUE_AFTER_CREATE'
  }),
  true
)
assert.equal(
  isProductListingReauthenticationSuccess({
    ...writtenAuthenticationFailureWorkflow,
    nextAction: 'VERIFY_READBACK'
  }),
  true
)
assert.equal(
  isProductListingReauthenticationSuccess({
    phase: 'EDITING',
    writeCertainty: 'UNKNOWN',
    nextAction: 'REVIEW_DRAFT'
  }),
  false,
  'an editing-shaped response with unknown Noon write certainty must remain locked'
)

const apiSource = readFileSync(new URL('./api.ts', import.meta.url), 'utf8')
const controllerSource = [
  './useProductListingReauthentication.ts',
  './useProductListingReauthenticationPolling.ts',
  './useProductListingAutomaticReauthentication.ts'
].map(path => readFileSync(new URL(path, import.meta.url), 'utf8')).join('\n')
const confirmationSource = readFileSync(
  new URL('./productListingReauthentication.ts', import.meta.url),
  'utf8'
)
const pageSource = readFileSync(
  new URL('./ProductListingPage.tsx', import.meta.url),
  'utf8'
)
const pageStatusSource = readFileSync(
  new URL('./ProductListingPageStatus.tsx', import.meta.url),
  'utf8'
)
const workflowPanelSource = readFileSync(
  new URL('./ProductListingWorkflowPanel.tsx', import.meta.url),
  'utf8'
)
const workflowActionButtonSource = readFileSync(
  new URL('./ProductListingWorkflowActionButton.tsx', import.meta.url),
  'utf8'
)

assert.ok(
  apiSource.includes('/tasks/${taskId}/reauthenticate') &&
    apiSource.includes('postWithoutBody<ProductListingWorkflowView>'),
  'reauthentication must call the listing-scoped authoritative command'
)
assert.ok(
    controllerSource.includes('current.workflow.realRunTask?.taskId') &&
    controllerSource.includes('isProductListingReauthenticationTarget(current.workflow)') &&
    controllerSource.includes('productListingWorkflowIdentity(') &&
    controllerSource.includes('current.identityIsCurrent(expectedIdentity)') &&
    controllerSource.includes('isProductListingReauthenticationSuccess(workflow)') &&
    controllerSource.includes('applyWorkflow(workflow)') &&
    controllerSource.includes('callbacksRef.current.commandInFlightRef.current = true') &&
    controllerSource.includes('setBusy(true)') &&
    controllerSource.includes('setBusy(false)') &&
    pageSource.includes('reauthentication.busy') &&
    workflowPanelSource.includes('busy={busy}') &&
    workflowActionButtonSource.includes('loading={props.busy}') &&
    workflowActionButtonSource.includes('disabled={props.busy || props.disabled}'),
  'reauthentication must use the current real-run task and reject stale or malformed workflow responses'
)
assert.ok(
  confirmationSource.includes('只读 Catalog 校验') &&
    confirmationSource.includes('同一上架任务自动继续') &&
    confirmationSource.includes('绝不会重复创建商品') &&
    !confirmationSource.includes('USER_STORE_NOON_PATH') &&
    !controllerSource.includes('reopenProductListingReview') &&
    !controllerSource.includes('continueProductListingRealRunAfterCreate') &&
    !controllerSource.includes('replayProductListingProjection'),
  'reauthentication must stay inside Listing and never navigate, reopen twice, or replay writes'
)
assert.ok(
  controllerSource.includes('error instanceof ApiError ? error.status : undefined') &&
    controllerSource.includes('productListingReauthenticationFailureNotice(errorMessage, status)') &&
    controllerSource.includes('finishSession(') &&
    pageSource.includes('reauthenticationNotice={reauthentication.notice}') &&
    pageStatusSource.includes('product-listing-reauthentication-notice'),
  'reauthentication progress and 409 failures must remain visible on the listing page'
)

const writtenConfirmation = productListingReauthenticationConfirmationConfig({
  storeCode: 'STR245027-NSA',
  writeCertainty: 'WRITTEN',
  onConfirm: async () => undefined
})
assert.match(String(writtenConfirmation.content), /已经创建/)
assert.match(String(writtenConfirmation.content), /绝不会重复创建/)
assert.match(String(writtenConfirmation.content), /最长约 90 秒/)
assert.match(String(writtenConfirmation.content), /不要重复点击/)
assert.match(String(writtenConfirmation.content), /已经写入时绝不会重复创建商品/)

const progressNotice = productListingReauthenticationProgressNotice()
assert.equal(progressNotice.type, 'info')
assert.match(progressNotice.message, /邮件验证码/)
assert.match(progressNotice.message, /最长约 90 秒/)
assert.match(progressNotice.message, /不要重复点击/)
assert.match(progressNotice.message, /明确未写入时/)
assert.match(progressNotice.message, /同一上架任务自动继续/)

const conflictNotice = productListingReauthenticationFailureNotice(
  '上架任务状态已变化，请刷新后重试。',
  409
)
assert.equal(conflictNotice.type, 'error')
assert.match(conflictNotice.message, /重新授权未完成/)
assert.match(conflictNotice.message, /原上架任务保持不变/)
assert.match(conflictNotice.message, /只重试“重新授权 Noon”/)
assert.match(conflictNotice.message, /不要重复确认旧任务/)

const successNotice =
  productListingReauthenticationSuccessNotice(resumedCreateWorkflow)
assert.equal(successNotice.type, 'success')
assert.match(successNotice.message, /同一任务继续上架/)
