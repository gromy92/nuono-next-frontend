import { App } from 'antd'
import { useEffect, useRef, useState, type MutableRefObject } from 'react'
import { normalizeError } from '../../shared/api'
import { confirmProductListingNotCreated } from './api'
import {
  productListingNotCreatedConfirmationConfig,
  isProductListingConfirmNotCreatedSuccess
} from './productListingConfirmNotCreated'
import type {
  ProductListingCreateOutcomeVerificationView,
  ProductListingWorkflowView
} from './types'
import type { ProductListingWorkflowIdentity } from './productListingWorkflowIdentity'
import { useProductListingCreateOutcomePolling } from './useProductListingCreateOutcomePolling'

type ConfirmNotCreatedOffer = {
  taskId: number
  lookupAttemptCount: number
  expectedIdentity: ProductListingWorkflowIdentity
}

type ProductListingConfirmNotCreatedParams = {
  workflow: ProductListingWorkflowView
  commandInFlightRef: MutableRefObject<boolean>
  identityIsCurrent: (expected: ProductListingWorkflowIdentity) => boolean
  refreshWorkflow: (
    draftId: number,
    expectedIdentity: ProductListingWorkflowIdentity
  ) => Promise<unknown>
  applyWorkflow: (workflow: ProductListingWorkflowView) => boolean
}

export function useProductListingConfirmNotCreated(
  params: ProductListingConfirmNotCreatedParams
) {
  const callbacksRef = useRef(params)
  callbacksRef.current = params
  const [offer, setOffer] = useState<ConfirmNotCreatedOffer>()
  const offerRef = useRef<ConfirmNotCreatedOffer | undefined>(undefined)
  const [busy, setBusy] = useState(false)
  const { message, modal } = App.useApp()
  const taskId = params.workflow.realRunTask?.taskId

  useEffect(() => {
    if (
      offer &&
      (
        params.workflow.phase !== 'ACTION_REQUIRED' ||
        params.workflow.writeCertainty !== 'UNKNOWN' ||
        params.workflow.nextAction !== 'CHECK_CREATE_RESULT' ||
        taskId !== offer.taskId
      )
    ) {
      offerRef.current = undefined
      setOffer(undefined)
    }
  }, [
    offer,
    params.workflow.nextAction,
    params.workflow.phase,
    params.workflow.writeCertainty,
    taskId
  ])

  function observeVerification(
    verification: ProductListingCreateOutcomeVerificationView,
    expectedIdentity: ProductListingWorkflowIdentity
  ) {
    const currentTaskId = callbacksRef.current.workflow.realRunTask?.taskId
    const lookupAttemptCount = Number(verification.lookupAttemptCount)
    if (
      verification.status === 'not_found' &&
      verification.canConfirmNotCreated === true &&
      verification.taskId === currentTaskId &&
      callbacksRef.current.identityIsCurrent(expectedIdentity)
    ) {
      const nextOffer = {
        taskId: verification.taskId,
        lookupAttemptCount:
          Number.isInteger(lookupAttemptCount) && lookupAttemptCount > 0
            ? lookupAttemptCount
            : 1,
        expectedIdentity
      }
      offerRef.current = nextOffer
      setOffer(nextOffer)
      return
    }
    offerRef.current = undefined
    setOffer(undefined)
  }

  const createOutcomePolling = useProductListingCreateOutcomePolling({
    workflow: params.workflow,
    draftId: params.workflow.draft?.draftId,
    storeCode: params.workflow.draft?.storeCode,
    commandInFlightRef: params.commandInFlightRef,
    identityIsCurrent: params.identityIsCurrent,
    refreshWorkflow: params.refreshWorkflow,
    observeVerification
  })

  function open() {
    const current = callbacksRef.current
    if (
      !offer ||
      busy ||
      current.commandInFlightRef.current ||
      current.workflow.phase !== 'ACTION_REQUIRED' ||
      current.workflow.writeCertainty !== 'UNKNOWN' ||
      current.workflow.nextAction !== 'CHECK_CREATE_RESULT' ||
      current.workflow.realRunTask?.taskId !== offer.taskId ||
      !current.identityIsCurrent(offer.expectedIdentity)
    ) {
      message.warning('当前结果尚未满足安全返回编辑条件，请继续核对 Noon。')
      return
    }
    modal.confirm(productListingNotCreatedConfirmationConfig({
      lookupAttemptCount: offer.lookupAttemptCount,
      onConfirm: () => execute(offer)
    }))
  }

  async function execute(currentOffer: ConfirmNotCreatedOffer) {
    const current = callbacksRef.current
    if (
      current.commandInFlightRef.current ||
      offerRef.current?.taskId !== currentOffer.taskId ||
      current.workflow.phase !== 'ACTION_REQUIRED' ||
      current.workflow.writeCertainty !== 'UNKNOWN' ||
      current.workflow.nextAction !== 'CHECK_CREATE_RESULT' ||
      current.workflow.realRunTask?.taskId !== currentOffer.taskId ||
      !current.identityIsCurrent(currentOffer.expectedIdentity)
    ) {
      message.warning('上架流程已经变化，本次未确认。')
      return
    }
    current.commandInFlightRef.current = true
    setBusy(true)
    try {
      const nextWorkflow = await confirmProductListingNotCreated(
        currentOffer.taskId
      )
      if (!callbacksRef.current.identityIsCurrent(currentOffer.expectedIdentity)) {
        message.warning('确认结果已过期，未应用到当前草稿。')
        return
      }
      if (
        !isProductListingConfirmNotCreatedSuccess(nextWorkflow) ||
        !callbacksRef.current.applyWorkflow(nextWorkflow)
      ) {
        message.error('后端未返回可编辑的上架流程，页面仍保持锁定。')
        return
      }
      offerRef.current = undefined
      setOffer(undefined)
      message.success('已确认 Noon 未创建商品，可以修改后重新检查上架。')
    } catch (error) {
      message.error(normalizeError(error, '确认 Noon 未创建商品失败'))
    } finally {
      callbacksRef.current.commandInFlightRef.current = false
      setBusy(false)
    }
  }

  return {
    busy: busy || createOutcomePolling.busy,
    canConfirm: Boolean(offer),
    lookupAttemptCount: offer?.lookupAttemptCount,
    observeVerification,
    open
  }
}
