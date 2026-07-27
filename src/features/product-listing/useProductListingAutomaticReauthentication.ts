import { useEffect } from 'react'
import { shouldAutoStartProductListingReauthentication } from './productListingReauthentication'
import { productListingWorkflowIdentity, type ProductListingWorkflowIdentity } from './productListingWorkflowIdentity'
import type { ProductListingReauthenticationPollingParams } from './useProductListingReauthenticationPolling'

export function useProductListingAutomaticReauthentication(
  params: ProductListingReauthenticationPollingParams,
  scopeKey: string,
  start: (taskId: number, identity: ProductListingWorkflowIdentity) => Promise<void>
) {
  const taskId = params.workflow.realRunTask?.taskId
  const storeCode = params.workflow.draft?.storeCode || params.storeCode

  useEffect(() => {
    if (
      !shouldAutoStartProductListingReauthentication(params.workflow) ||
      !params.draftId ||
      !taskId ||
      !storeCode ||
      params.commandInFlightRef.current
    ) {
      return
    }
    const identity = productListingWorkflowIdentity(
      params.workflow,
      params.draftId,
      storeCode
    )
    if (params.identityIsCurrent(identity)) {
      void start(taskId, identity)
    }
  }, [
    scopeKey,
    params.workflow.phase,
    params.workflow.nextAction,
    params.workflow.writeCertainty
  ])
}
