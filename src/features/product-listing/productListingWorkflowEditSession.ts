import { presentProductListingWorkflow } from './productListingWorkflowPresentation'
import type { ProductListingWorkflowView } from './types'

export type ProductListingWorkflowEditSession = {
  canReturnToEdit: boolean
  canEditAndSave: boolean
  canConfirm: boolean
}

export type ProductListingWorkflowActionPlacement = {
  showReviewActionInEditor: boolean
  hideWorkflowPanelAction: boolean
}

export function resolveProductListingWorkflowEditSession(
  workflow: ProductListingWorkflowView
): ProductListingWorkflowEditSession {
  const presentation = presentProductListingWorkflow(workflow)
  const readyToConfirm =
    workflow.phase === 'READY_TO_CONFIRM' &&
    workflow.nextAction === 'CONFIRM_PUBLISH'

  return {
    canReturnToEdit: readyToConfirm,
    canEditAndSave: presentation.allowSave,
    canConfirm: readyToConfirm
  }
}

export function resolveProductListingWorkflowActionPlacement(
  workflow: ProductListingWorkflowView
): ProductListingWorkflowActionPlacement {
  const reviewActionIsInsideEditableEditor =
    workflow.nextAction === 'REVIEW_DRAFT' &&
    resolveProductListingWorkflowEditSession(workflow).canEditAndSave
  return {
    showReviewActionInEditor: reviewActionIsInsideEditableEditor,
    hideWorkflowPanelAction: reviewActionIsInsideEditableEditor
  }
}
