import { App } from 'antd'
import { useRef } from 'react'
import {
  isProductListingReauthenticationTarget,
  productListingReauthenticationConfirmationConfig
} from './productListingReauthentication'
import {
  productListingWorkflowIdentity
} from './productListingWorkflowIdentity'
import {
  useProductListingReauthenticationPolling,
  type ProductListingReauthenticationPollingParams
} from './useProductListingReauthenticationPolling'

export function useProductListingReauthentication(
  params: ProductListingReauthenticationPollingParams
) {
  const callbacksRef = useRef(params)
  callbacksRef.current = params
  const polling = useProductListingReauthenticationPolling(params)
  const { message, modal } = App.useApp()

  function open() {
    const current = callbacksRef.current
    const taskId = current.workflow.realRunTask?.taskId
    const storeCode =
      current.workflow.draft?.storeCode || current.storeCode
    if (
      polling.busy ||
      current.commandInFlightRef.current ||
      !isProductListingReauthenticationTarget(current.workflow) ||
      !current.draftId ||
      !taskId ||
      !storeCode
    ) {
      message.warning('当前上架流程不能重新授权 Noon，请刷新后重试。')
      return
    }
    const expectedIdentity = productListingWorkflowIdentity(
      current.workflow,
      current.draftId,
      storeCode
    )
    modal.confirm(productListingReauthenticationConfirmationConfig({
      storeCode,
      writeCertainty: current.workflow.writeCertainty,
      onConfirm: () => polling.start(taskId, expectedIdentity)
    }))
  }

  return { busy: polling.busy, notice: polling.notice, open }
}
