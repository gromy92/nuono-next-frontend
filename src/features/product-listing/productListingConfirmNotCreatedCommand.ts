import { isAmbiguousProductListingCommandError } from './productListingAmbiguousOutcome'
import { isProductListingConfirmNotCreatedSuccess } from './productListingConfirmNotCreated'
import type { ProductListingWorkflowView } from './types'

export const PRODUCT_LISTING_CONFIRM_NOT_CREATED_MAX_STABLE_READS = 6

type PrepareProductListingConfirmNotCreatedParams = {
  confirm: () => Promise<ProductListingWorkflowView>
  identityIsCurrent: () => boolean
  applyWorkflow: (workflow: ProductListingWorkflowView) => boolean
}

export type ProductListingConfirmNotCreatedPreparation =
  | { status: 'ready' }
  | { status: 'ambiguous_locked'; error: unknown }
  | { status: 'awaiting_workflow' }
  | { status: 'stale' }
  | { status: 'failed'; error: unknown }

export type ProductListingConfirmNotCreatedSource = {
  taskId: number
  draftId: number
  storeCode: string
}

export type ProductListingConfirmNotCreatedStableReadDecision = {
  decision: 'continue' | 'release' | 'ready' | 'changed'
  stableReadCount: number
}

export async function prepareProductListingConfirmNotCreated(
  params: PrepareProductListingConfirmNotCreatedParams
): Promise<ProductListingConfirmNotCreatedPreparation> {
  let workflow: ProductListingWorkflowView
  try {
    workflow = await params.confirm()
  } catch (error) {
    return isAmbiguousProductListingCommandError(error)
      ? { status: 'ambiguous_locked', error }
      : { status: 'failed', error }
  }
  if (!params.identityIsCurrent()) {
    return { status: 'stale' }
  }
  if (
    !isProductListingConfirmNotCreatedSuccess(workflow) ||
    !params.applyWorkflow(workflow)
  ) {
    return { status: 'awaiting_workflow' }
  }
  return { status: 'ready' }
}

export function reconcileProductListingConfirmNotCreated(
  source: ProductListingConfirmNotCreatedSource,
  workflow: ProductListingWorkflowView
) {
  if (
    workflow.draft?.draftId !== source.draftId ||
    normalizeStoreCode(workflow.draft?.storeCode) !== normalizeStoreCode(source.storeCode)
  ) {
    return 'changed' as const
  }
  if (isProductListingConfirmNotCreatedSuccess(workflow)) {
    return 'ready' as const
  }
  if (
    workflow.phase === 'ACTION_REQUIRED' &&
    workflow.writeCertainty === 'UNKNOWN' &&
    workflow.nextAction === 'CHECK_CREATE_RESULT' &&
    workflow.realRunTask?.taskId === source.taskId
  ) {
    return 'waiting' as const
  }
  return 'changed' as const
}

export function advanceProductListingConfirmNotCreatedStableRead(
  source: ProductListingConfirmNotCreatedSource,
  workflow: ProductListingWorkflowView,
  previousStableReadCount: number
): ProductListingConfirmNotCreatedStableReadDecision {
  const resolution = reconcileProductListingConfirmNotCreated(source, workflow)
  if (resolution !== 'waiting') {
    return {
      decision: resolution,
      stableReadCount: 0
    }
  }
  const stableReadCount =
    normalizedStableReadCount(previousStableReadCount) + 1
  return {
    decision:
      stableReadCount >=
      PRODUCT_LISTING_CONFIRM_NOT_CREATED_MAX_STABLE_READS
        ? 'release'
        : 'continue',
    stableReadCount
  }
}

function normalizeStoreCode(value?: string) {
  return (value || '').trim().toUpperCase()
}

function normalizedStableReadCount(value: number) {
  return Number.isInteger(value) && value > 0 ? value : 0
}
