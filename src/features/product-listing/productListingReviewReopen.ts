import { isAmbiguousProductListingCommandError } from './productListingAmbiguousOutcome'
import {
  productListingWorkflowIdentity,
  sameProductListingWorkflowIdentity,
  type ProductListingWorkflowIdentity
} from './productListingWorkflowIdentity'
import { presentProductListingWorkflow } from './productListingWorkflowPresentation'
import type {
  ProductListingWorkflowNextAction,
  ProductListingWorkflowPhase,
  ProductListingWriteCertainty,
  ProductListingWorkflowView
} from './types'

export type ProductListingReviewReopenPreparation =
  | { status: 'ready' }
  | { status: 'stale' }
  | { status: 'locked' }
  | { status: 'ambiguous_locked' }
  | { status: 'rejected'; error: unknown }
  | { status: 'refresh_failed'; error: unknown }

export type ProductListingReviewReopenSource = {
  identity: ProductListingWorkflowIdentity
  phase: ProductListingWorkflowPhase
  writeCertainty: ProductListingWriteCertainty
  nextAction: ProductListingWorkflowNextAction
}

export function isProductListingReviewReopenedForEditing(
  workflow?: ProductListingWorkflowView
) {
  return Boolean(
    workflow &&
      workflow.phase === 'EDITING' &&
      presentProductListingWorkflow(workflow).allowSave
  )
}

export async function prepareProductListingReviewReopen(params: {
  reopen: () => Promise<ProductListingWorkflowView>
  refresh: () => Promise<ProductListingWorkflowView | undefined>
  identityIsCurrent: () => boolean
  applyReopenedWorkflow: (workflow: ProductListingWorkflowView) => boolean
}): Promise<ProductListingReviewReopenPreparation> {
  try {
    const reopenedWorkflow = await params.reopen()
    if (!params.identityIsCurrent()) {
      return { status: 'stale' }
    }
    if (
      !params.applyReopenedWorkflow(reopenedWorkflow) ||
      !isProductListingReviewReopenedForEditing(reopenedWorkflow)
    ) {
      return { status: 'locked' }
    }
    return { status: 'ready' }
  } catch (error) {
    if (!isAmbiguousProductListingCommandError(error)) {
      return { status: 'rejected', error }
    }
    try {
      const refreshedWorkflow = await params.refresh()
      return isProductListingReviewReopenedForEditing(refreshedWorkflow)
        ? { status: 'ready' }
        : { status: 'ambiguous_locked' }
    } catch (refreshError) {
      return { status: 'refresh_failed', error: refreshError }
    }
  }
}

export function reconcileProductListingReviewReopen(
  source: ProductListingReviewReopenSource,
  workflow: ProductListingWorkflowView,
  activeDraftId?: number,
  activeStoreCode?: string
): 'waiting' | 'ready' | 'changed' {
  const currentIdentity = productListingWorkflowIdentity(
    workflow,
    activeDraftId,
    activeStoreCode
  )
  const sameScope =
    source.identity.draftId === currentIdentity.draftId &&
    normalizedStoreCode(source.identity.storeCode) ===
      normalizedStoreCode(currentIdentity.storeCode)
  if (!sameScope) {
    return 'changed'
  }
  if (isProductListingReviewReopenedForEditing(workflow)) {
    return 'ready'
  }
  return (
    source.phase === workflow.phase &&
    source.writeCertainty === workflow.writeCertainty &&
    source.nextAction === workflow.nextAction &&
    sameProductListingWorkflowIdentity(source.identity, currentIdentity)
  )
    ? 'waiting'
    : 'changed'
}

function normalizedStoreCode(value?: string) {
  return (value || '').trim().toUpperCase()
}
