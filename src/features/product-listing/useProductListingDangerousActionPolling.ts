import { message } from 'antd'
import { useEffect, useRef } from 'react'
import {
  shouldAwaitDangerousProductListingActionWorkflow,
  type DangerousProductListingRecoveryAction
} from './productListingAmbiguousOutcome'
import type { ProductListingWorkflowIdentity } from './productListingWorkflowIdentity'
import type { ProductListingWorkflowView } from './types'

const PRODUCT_LISTING_DANGEROUS_ACTION_MAX_STABLE_REFRESHES = 6

type Params = {
  action?: DangerousProductListingRecoveryAction
  draftId?: number
  workflow: ProductListingWorkflowView
  refreshWorkflow: (
    draftId: number,
    expected?: ProductListingWorkflowIdentity
  ) => Promise<ProductListingWorkflowView | undefined>
  getExpectedIdentity: () => ProductListingWorkflowIdentity
  clearAwaiting: () => void
}

export function useProductListingDangerousActionPolling({
  action,
  draftId,
  workflow,
  refreshWorkflow,
  getExpectedIdentity,
  clearAwaiting
}: Params) {
  const stableRefreshesRef = useRef(0)
  const callbacksRef = useRef({
    refreshWorkflow,
    getExpectedIdentity,
    clearAwaiting
  })
  callbacksRef.current = {
    refreshWorkflow,
    getExpectedIdentity,
    clearAwaiting
  }

  useEffect(() => {
    if (!action) {
      stableRefreshesRef.current = 0
      return
    }
    if (!shouldAwaitDangerousProductListingActionWorkflow(action, workflow)) {
      callbacksRef.current.clearAwaiting()
    }
  }, [action, workflow])

  useEffect(() => {
    if (!action || !draftId) {
      return
    }
    let cancelled = false
    let timeoutId: number | undefined
    const retryWorkflow = async () => {
      try {
        const nextWorkflow = await callbacksRef.current.refreshWorkflow(
          draftId,
          callbacksRef.current.getExpectedIdentity()
        )
        if (
          !cancelled &&
          shouldAwaitDangerousProductListingActionWorkflow(action, nextWorkflow)
        ) {
          stableRefreshesRef.current += 1
          if (
            stableRefreshesRef.current >=
            PRODUCT_LISTING_DANGEROUS_ACTION_MAX_STABLE_REFRESHES
          ) {
            callbacksRef.current.clearAwaiting()
            message.warning(
              '已连续读取到稳定的后端权威状态，恢复操作已解锁；请复核页面提示后再决定是否重试。'
            )
            return
          }
          timeoutId = window.setTimeout(() => void retryWorkflow(), 2500)
        }
      } catch {
        if (!cancelled) {
          timeoutId = window.setTimeout(() => void retryWorkflow(), 2500)
        }
      }
    }
    timeoutId = window.setTimeout(() => void retryWorkflow(), 1500)
    return () => {
      cancelled = true
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId)
      }
    }
  }, [action, draftId])

  return {
    reset: () => {
      stableRefreshesRef.current = 0
    }
  }
}
