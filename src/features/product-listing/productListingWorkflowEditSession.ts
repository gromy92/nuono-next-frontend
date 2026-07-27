import { presentProductListingWorkflow } from './productListingWorkflowPresentation'
import type { ProductListingWorkflowView } from './types'

export type ProductListingWorkflowEditSession = {
  canReturnToEdit: boolean
  canEditAndSave: boolean
  canConfirm: boolean
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
