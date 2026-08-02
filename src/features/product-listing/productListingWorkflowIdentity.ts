import type { ProductListingWorkflowView } from './types'

export type ProductListingWorkflowIdentity = {
  draftId?: number
  storeCode?: string
  dryRunTaskId?: number
  realRunTaskId?: number
}

export type ProductListingWorkflowLoadedScope = {
  draftId: number
  storeCode: string
}

export function isProductListingWorkflowLoadedForScope(
  loadedScope: ProductListingWorkflowLoadedScope | undefined,
  activeDraftId: number | undefined,
  activeStoreCode: string | undefined
) {
  if (!activeDraftId) {
    return true
  }
  return (
    loadedScope?.draftId === activeDraftId &&
    normalizedStoreCode(loadedScope.storeCode) ===
      normalizedStoreCode(activeStoreCode) &&
    Boolean(normalizedStoreCode(activeStoreCode))
  )
}

export function productListingWorkflowIdentity(
  workflow: ProductListingWorkflowView,
  fallbackDraftId?: number,
  fallbackStoreCode?: string
): ProductListingWorkflowIdentity {
  return {
    draftId: workflow.draft?.draftId ?? fallbackDraftId,
    storeCode: normalizedStoreCode(
      workflow.draft?.storeCode ?? fallbackStoreCode
    ),
    dryRunTaskId: workflow.dryRunTask?.taskId,
    realRunTaskId: workflow.realRunTask?.taskId
  }
}

export function sameProductListingWorkflowIdentity(
  left: ProductListingWorkflowIdentity,
  right: ProductListingWorkflowIdentity
) {
  return (
    left.draftId === right.draftId &&
    normalizedStoreCode(left.storeCode) === normalizedStoreCode(right.storeCode) &&
    left.dryRunTaskId === right.dryRunTaskId &&
    left.realRunTaskId === right.realRunTaskId
  )
}

export function validateProductListingWorkflowResponse(
  workflow: ProductListingWorkflowView,
  expected: { draftId: number; storeCode: string }
): { valid: boolean; reason?: string } {
  const draft = workflow.draft
  if (!draft) {
    return invalidWorkflow('workflow_draft_missing')
  }
  if (draft.draftId !== expected.draftId) {
    return invalidWorkflow('workflow_draft_mismatch')
  }
  if (!sameStoreCode(draft.storeCode, expected.storeCode)) {
    return invalidWorkflow('workflow_store_mismatch')
  }
  if (!isValidWorkflowStateTuple(workflow)) {
    return invalidWorkflow('workflow_state_tuple_invalid')
  }
  if (workflow.dryRunTask && !taskMatchesDraft(
    workflow.dryRunTask,
    draft.draftId,
    draft.storeCode,
    'DRY_RUN'
  )) {
    return invalidWorkflow('workflow_dry_run_scope_mismatch')
  }
  if (workflow.realRunTask) {
    if (!taskMatchesDraft(
      workflow.realRunTask,
      draft.draftId,
      draft.storeCode,
      'REAL_RUN'
    )) {
      return invalidWorkflow('workflow_real_run_scope_mismatch')
    }
    if (
      !workflow.dryRunTask ||
      workflow.realRunTask.sourceTaskId !== workflow.dryRunTask.taskId
    ) {
      return invalidWorkflow('workflow_source_task_mismatch')
    }
  }
  return { valid: true }
}

export function canApplyProductListingWorkflowResponse(params: {
  requestSequence: number
  latestSequence: number
  requestedDraftId: number
  activeDraftId?: number
  expectedIdentity?: ProductListingWorkflowIdentity
  currentIdentity: ProductListingWorkflowIdentity
}) {
  return (
    params.requestSequence === params.latestSequence &&
    params.requestedDraftId === params.activeDraftId &&
    (
      !params.expectedIdentity ||
      sameProductListingWorkflowIdentity(
        params.expectedIdentity,
        params.currentIdentity
      )
    )
  )
}

export function matchesProductListingPartnerSku(
  responsePartnerSku?: string,
  currentPartnerSku?: string
) {
  const responseValue = normalizedPartnerSku(responsePartnerSku)
  if (!responseValue) {
    return true
  }
  return responseValue === normalizedPartnerSku(currentPartnerSku)
}

function normalizedPartnerSku(value?: string) {
  return (value || '').trim().toUpperCase()
}

function normalizedStoreCode(value?: string) {
  return (value || '').trim().toUpperCase()
}

function sameStoreCode(left?: string, right?: string) {
  const leftValue = normalizedStoreCode(left)
  return Boolean(leftValue) && leftValue === normalizedStoreCode(right)
}

function taskMatchesDraft(
  task: NonNullable<
    ProductListingWorkflowView['dryRunTask'] |
    ProductListingWorkflowView['realRunTask']
  >,
  draftId: number,
  storeCode: string,
  mode: 'DRY_RUN' | 'REAL_RUN'
) {
  return (
    task.draftId === draftId &&
    sameStoreCode(task.storeCode, storeCode) &&
    task.mode === mode
  )
}

function invalidWorkflow(reason: string) {
  return { valid: false, reason }
}

function isValidWorkflowStateTuple(workflow: ProductListingWorkflowView) {
  const { phase, writeCertainty, nextAction } = workflow
  if (phase === 'EDITING') {
    return (
      writeCertainty === 'NOT_STARTED' &&
      (nextAction === 'REVIEW_DRAFT' || nextAction === 'EDIT_DRAFT')
    )
  }
  if (phase === 'READY_TO_CONFIRM') {
    return (
      writeCertainty === 'NOT_STARTED' &&
      nextAction === 'CONFIRM_PUBLISH'
    )
  }
  if (phase === 'PUBLISHING') {
    return (
      (writeCertainty === 'NOT_STARTED' || writeCertainty === 'UNKNOWN') &&
      nextAction === 'WAIT'
    )
  }
  if (phase === 'PUBLISHED') {
    return writeCertainty === 'VERIFIED' && nextAction === 'NONE'
  }
  if (phase !== 'ACTION_REQUIRED') {
    return false
  }
  return (
    (
      nextAction === 'NONE' &&
      (
        writeCertainty === 'NOT_STARTED' ||
        writeCertainty === 'UNKNOWN' ||
        writeCertainty === 'WRITTEN' ||
        writeCertainty === 'VERIFIED'
      )
    ) ||
    (
      writeCertainty === 'NOT_STARTED' &&
      (
        nextAction === 'EDIT_DRAFT' ||
        nextAction === 'REVIEW_DRAFT' ||
        nextAction === 'WAIT_FOR_AUTHORIZATION'
      )
    ) ||
    (
      (
        writeCertainty === 'UNKNOWN' ||
        writeCertainty === 'WRITTEN'
      ) &&
      nextAction === 'WAIT_FOR_AUTHORIZATION'
    ) ||
    (
      writeCertainty === 'UNKNOWN' &&
      nextAction === 'CHECK_CREATE_RESULT'
    ) ||
    (
      writeCertainty === 'WRITTEN' &&
      (
        nextAction === 'CONTINUE_AFTER_CREATE' ||
        nextAction === 'VERIFY_READBACK'
      )
    ) ||
    (
      writeCertainty === 'VERIFIED' &&
      nextAction === 'REPLAY_PROJECTION'
    )
  )
}
