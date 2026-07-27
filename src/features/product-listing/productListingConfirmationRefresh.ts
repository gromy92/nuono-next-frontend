import type { ProductListingWorkflowView } from './types'

export function shouldAwaitProductListingConfirmationWorkflow(
  workflow?: ProductListingWorkflowView
) {
  return !workflow || workflow.phase === 'READY_TO_CONFIRM'
}
