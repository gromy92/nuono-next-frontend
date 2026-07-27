import type { ProductListingWorkflowPhase } from './types'

export function isProductListingReviewInteractionLocked(params: {
  phase: ProductListingWorkflowPhase
  preparing: boolean
  confirming: boolean
  confirmationAwaitingWorkflow: boolean
  returningToEdit: boolean
  integrityBlocked: boolean
}) {
  return (
    params.phase === 'PUBLISHING' ||
    params.preparing ||
    params.confirming ||
    params.confirmationAwaitingWorkflow ||
    params.returningToEdit ||
    params.integrityBlocked
  )
}
