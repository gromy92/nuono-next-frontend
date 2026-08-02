import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const apiSource = readFileSync(new URL('./api.ts', import.meta.url), 'utf8')
const pageSource = [
  './ProductListingPage.tsx',
  './useProductListingWorkflowState.ts',
  './useProductListingWorkflowSynchronization.ts',
  './useProductListingReviewActions.ts',
  './useProductListingRecoveryActions.ts'
].map((fileName) => readFileSync(new URL(fileName, import.meta.url), 'utf8')).join('\n')
const modalSource = readFileSync(new URL('./ProductListingReviewModal.tsx', import.meta.url), 'utf8')
const presentationSource = readFileSync(
  new URL('./productListingWorkflowPresentation.ts', import.meta.url),
  'utf8'
)
const reviewReopenControllerSource = readFileSync(
  new URL('./useProductListingReviewReopen.ts', import.meta.url),
  'utf8'
)
const reviewReopenCompletionSource = readFileSync(
  new URL('./productListingReviewReopenCompletion.ts', import.meta.url),
  'utf8'
)
const pageStatusSource = readFileSync(
  new URL('./ProductListingPageStatus.tsx', import.meta.url),
  'utf8'
)
const publishedActionsSource = readFileSync(
  new URL('./ProductListingPublishedActions.tsx', import.meta.url),
  'utf8'
)
const successNavigationSource = readFileSync(
  new URL('./productListingSuccessNavigation.ts', import.meta.url),
  'utf8'
)
const reviewInteractionSource = readFileSync(
  new URL('./productListingReviewInteraction.ts', import.meta.url),
  'utf8'
)
const identitySource = readFileSync(
  new URL('./productListingWorkflowIdentity.ts', import.meta.url),
  'utf8'
)
const dangerousPollingSource = readFileSync(
  new URL('./useProductListingDangerousActionPolling.ts', import.meta.url),
  'utf8'
)
const terminalDraftHandlerStart = pageSource.indexOf(
  'const handleTerminalDraftAction = async'
)
const terminalDraftHandlerEnd = pageSource.indexOf(
  'const executeRealRunRecoveryAction = async',
  terminalDraftHandlerStart
)
const terminalDraftHandlerSource = pageSource.slice(
  terminalDraftHandlerStart,
  terminalDraftHandlerEnd
)
const recoveryHandlerStart = terminalDraftHandlerEnd
const recoveryHandlerEnd = pageSource.indexOf(
  '\n  const handleWorkflowAction',
  recoveryHandlerStart
)
const recoveryHandlerSource = pageSource.slice(
  recoveryHandlerStart,
  recoveryHandlerEnd
)

assert(
  apiSource.includes('/drafts/${draftId}/workflow') &&
    pageSource.includes('fetchProductListingWorkflow'),
  'listing recovery should reload the backend-owned workflow by durable draft id'
)
assert(
  apiSource.includes('/verify-create-outcome') &&
    apiSource.includes('/continue-after-create') &&
    apiSource.includes('/verify-readback') &&
    apiSource.includes('/replay-projection'),
  'each recovery action should have one explicit backend command'
)
assert(
  pageSource.includes('verification.taskId !== taskId') &&
    pageSource.includes('options.identityMatches(expected)') &&
    pageSource.includes('workflowRequestSequenceRef'),
  'late recovery and polling responses must not apply to a different draft or older request'
)
assert(
  pageSource.includes("verification.status === 'found'") &&
    pageSource.includes('await options.refreshWorkflow(draftId, expected)') &&
    !pageSource.includes('setCanContinueAfterCreate'),
  'create-outcome verification should reload the persisted workflow instead of locally inventing continuation permission'
)
assert(
  presentationSource.includes("workflow.writeCertainty === 'NOT_STARTED'") &&
    pageSource.includes('options.workflow.nextAction !== action'),
  'unknown or written recovery states must not open a new dry-run or a different recovery command'
)
assert(
  modalSource.includes('isProductListingReviewInteractionLocked({') &&
    reviewInteractionSource.includes("params.phase === 'PUBLISHING'") &&
    reviewInteractionSource.includes('params.confirmationAwaitingWorkflow') &&
    reviewInteractionSource.includes('params.preparing') &&
    modalSource.includes('disabled={interactionLocked}') &&
    modalSource.includes('closable={!interactionLocked}') &&
    modalSource.includes('maskClosable={presentation.allowCloseReview') &&
    modalSource.includes('keyboard={presentation.allowCloseReview'),
  'publishing should lock modal close, mask click, and Escape'
)
assert(
  apiSource.includes('/reopen-review') &&
    modalSource.includes('product-listing-return-to-edit') &&
    pageSource.includes("options.reopenReview({ kind: 'RETURN_TO_EDIT' })") &&
    pageSource.includes('reopenReview: reopenProductListingReview') &&
    reviewReopenControllerSource.includes(
      'prepareProductListingReviewReopen({'
    ) &&
    reviewReopenControllerSource.includes(
      'callbacksRef.current.reopenReview(dryRunTaskId)'
    ),
  'all paths returning to editing should reopen the source dry-run and prove the backend unlocked editing'
)
assert(
  pageSource.includes('subscribeProductListingWorkflowRefresh(window') &&
    pageSource.includes("next.nextAction === 'WAIT_FOR_AUTHORIZATION'") &&
    pageSource.includes('window.setTimeout(() => void poll(), 3000)'),
  'workflow recovery should refresh on window restore and poll publishing or authorization wait serially'
)
assert(
  !apiSource.includes('/reauthenticate') &&
    !apiSource.includes('/reauthentication-status') &&
    !pageSource.includes('useProductListingReauthentication') &&
    pageSource.includes("nextAction === 'WAIT_FOR_AUTHORIZATION'") &&
    !presentationSource.includes('重新授权 Noon'),
  'authorization expiry should be passive workflow waiting without a business-owned auth command or button'
)
assert(
  terminalDraftHandlerStart >= 0 &&
    terminalDraftHandlerEnd > terminalDraftHandlerStart &&
    terminalDraftHandlerSource.includes(
      "options.workflow.phase !== 'ACTION_REQUIRED'"
    ) &&
    terminalDraftHandlerSource.includes(
      "options.workflow.writeCertainty !== 'NOT_STARTED'"
    ) &&
    terminalDraftHandlerSource.includes(
      'await options.reopenReview({ kind: action })'
    ) &&
    reviewReopenCompletionSource.includes('closeReview()') &&
    reviewReopenCompletionSource.includes('focusProductListingEditor()') &&
    !terminalDraftHandlerSource.includes('handleOpenListingReview()') &&
    !terminalDraftHandlerSource.includes('confirmProductListingRealRun') &&
    !terminalDraftHandlerSource.includes(
      'continueProductListingRealRunAfterCreate'
    ),
  'terminal edit/review actions must reopen first and return to editing without automatically starting another write attempt'
)
assert(
  reviewReopenControllerSource.includes(
    "preparation.status === 'ambiguous_locked'"
  ) &&
    reviewReopenControllerSource.includes(
      "preparation.status === 'refresh_failed'"
    ) &&
    reviewReopenControllerSource.includes('keepCommandLocked = true') &&
    reviewReopenControllerSource.includes(
      'setAwaiting({ intent, draftId, source })'
    ) &&
    reviewReopenControllerSource.includes(
      'window.setTimeout(() => void poll(), 2500)'
    ) &&
    reviewReopenControllerSource.includes(
      'reconcileProductListingReviewReopen('
    ) &&
    pageSource.includes('reviewReopen.busy') &&
    pageStatusSource.includes('product-listing-reopen-awaiting'),
  'an ambiguous reopen must keep one persistent fail-closed lock and poll until backend workflow truth changes'
)
assert(
  pageSource.includes('matchesProductListingPartnerSku(') &&
    pageSource.includes('verification.partnerSku') &&
    pageSource.includes('options.workflow.realRunTask?.partnerSku'),
  'create-outcome verification should reject a task response for a different partner SKU'
)
assert(
  pageSource.includes('confirmationAwaitingWorkflow') &&
    pageSource.includes('shouldAwaitProductListingConfirmationWorkflow') &&
    pageSource.includes('确认命令结果未知') &&
    pageSource.includes('持续刷新后端上架流程'),
  'a successful confirm command should remain locked until workflow refresh leaves ready-to-confirm'
)
assert(
  pageSource.includes('dangerousActionAwaitingWorkflow') &&
    pageSource.includes('isAmbiguousProductListingCommandError') &&
    dangerousPollingSource.includes('shouldAwaitDangerousProductListingActionWorkflow') &&
    dangerousPollingSource.includes('PRODUCT_LISTING_DANGEROUS_ACTION_MAX_STABLE_REFRESHES') &&
    dangerousPollingSource.includes('连续读取到稳定的后端权威状态') &&
    !recoveryHandlerSource.includes('commandAccepted = true'),
  'ambiguous dangerous recovery writes should poll fail-closed but release after bounded stable authoritative reads'
)
assert(
  pageSource.includes('validateProductListingWorkflowResponse') &&
    identitySource.includes('workflow_source_task_mismatch') &&
    identitySource.includes('workflow_store_mismatch'),
  'workflow responses should be scope-validated before they can replace current UI state'
)
assert(
  !pageSource.includes('saveProductListingReturnNotice') &&
    !pageSource.includes('PRODUCT_WORKSPACE_PATH') &&
    publishedActionsSource.includes('product-listing-return-to-products') &&
    successNavigationSource.includes("workflow.phase !== 'PUBLISHED'") &&
    successNavigationSource.includes("workflow.writeCertainty !== 'VERIFIED'"),
  'confirmation must remain in place while only verified PUBLISHED state exposes explicit return actions'
)
