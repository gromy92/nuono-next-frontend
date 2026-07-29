import { App } from 'antd'
import { useEffect, useRef, useState, type MutableRefObject } from 'react'
import { normalizeError } from '../../shared/api'
import { confirmProductListingNotCreated } from './api'
import { productListingNotCreatedConfirmationConfig } from './productListingConfirmNotCreated'
import {
  advanceProductListingConfirmNotCreatedStableRead,
  prepareProductListingConfirmNotCreated,
  reconcileProductListingConfirmNotCreated,
  type ProductListingConfirmNotCreatedSource
} from './productListingConfirmNotCreatedCommand'
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

type AwaitingConfirmNotCreated = {
  source: ProductListingConfirmNotCreatedSource
  expectedIdentity: ProductListingWorkflowIdentity
}

type ProductListingConfirmNotCreatedParams = {
  workflow: ProductListingWorkflowView
  commandInFlightRef: MutableRefObject<boolean>
  identityIsCurrent: (expected: ProductListingWorkflowIdentity) => boolean
  refreshWorkflow: (
    draftId: number,
    expectedIdentity: ProductListingWorkflowIdentity
  ) => Promise<ProductListingWorkflowView | undefined>
  applyWorkflow: (workflow: ProductListingWorkflowView) => boolean
}

export function useProductListingConfirmNotCreated(
  params: ProductListingConfirmNotCreatedParams
) {
  const callbacksRef = useRef(params)
  callbacksRef.current = params
  const [offer, setOffer] = useState<ConfirmNotCreatedOffer>()
  const offerRef = useRef<ConfirmNotCreatedOffer | undefined>(undefined)
  const [awaiting, setAwaiting] = useState<AwaitingConfirmNotCreated>()
  const [readOnlyPollRestartVersion, setReadOnlyPollRestartVersion] =
    useState(0)
  const [busy, setBusy] = useState(false)
  const { message, modal } = App.useApp()
  const messageRef = useRef(message)
  messageRef.current = message
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

  useEffect(() => {
    if (!awaiting) {
      return
    }
    const resolution = reconcileProductListingConfirmNotCreated(
      awaiting.source,
      params.workflow
    )
    if (resolution === 'waiting') {
      return
    }
    callbacksRef.current.commandInFlightRef.current = false
    offerRef.current = undefined
    setOffer(undefined)
    setAwaiting(undefined)
    if (resolution === 'ready') {
      message.success('已确认 Noon 未创建商品，可以修改后重新检查上架。')
    } else {
      message.warning('后端上架流程已经变化，请按最新动作继续。')
    }
  }, [awaiting, message, params.workflow])

  useEffect(() => {
    if (!awaiting) {
      return
    }
    let cancelled = false
    let timeoutId: number | undefined
    let stableReadCount = 0
    const poll = async () => {
      try {
        const nextWorkflow = await callbacksRef.current.refreshWorkflow(
          awaiting.source.draftId,
          awaiting.expectedIdentity
        )
        if (cancelled) {
          return
        }
        if (nextWorkflow) {
          const convergence =
            advanceProductListingConfirmNotCreatedStableRead(
              awaiting.source,
              nextWorkflow,
              stableReadCount
            )
          stableReadCount = convergence.stableReadCount
          if (convergence.decision === 'release') {
            callbacksRef.current.commandInFlightRef.current = false
            offerRef.current = undefined
            setOffer(undefined)
            setAwaiting(undefined)
            setReadOnlyPollRestartVersion(current => current + 1)
            messageRef.current.warning(
              '已连续读取到稳定的后端权威状态，本页已解除确认锁定；系统未重复确认，将重新执行只读核对。'
            )
            return
          }
          if (
            convergence.decision === 'ready' ||
            convergence.decision === 'changed'
          ) {
            return
          }
        }
      } catch {
        // Keep the command locked and retry read-only workflow convergence.
      }
      if (!cancelled) {
        timeoutId = window.setTimeout(() => void poll(), 2500)
      }
    }
    timeoutId = window.setTimeout(() => void poll(), 1500)
    return () => {
      cancelled = true
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId)
      }
    }
  }, [awaiting])

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
    restartVersion: readOnlyPollRestartVersion,
    commandInFlightRef: params.commandInFlightRef,
    identityIsCurrent: params.identityIsCurrent,
    refreshWorkflow: params.refreshWorkflow,
    observeVerification
  })

  function open() {
    const current = callbacksRef.current
    if (
      !offer ||
      awaiting ||
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
    const draftId = currentOffer.expectedIdentity.draftId
    const storeCode = currentOffer.expectedIdentity.storeCode
    if (
      current.commandInFlightRef.current ||
      offerRef.current?.taskId !== currentOffer.taskId ||
      !draftId ||
      !storeCode ||
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
    let keepCommandLocked = false
    const source: ProductListingConfirmNotCreatedSource = {
      taskId: currentOffer.taskId,
      draftId,
      storeCode
    }
    try {
      const preparation = await prepareProductListingConfirmNotCreated({
        confirm: () => confirmProductListingNotCreated(currentOffer.taskId),
        identityIsCurrent: () =>
          callbacksRef.current.identityIsCurrent(currentOffer.expectedIdentity),
        applyWorkflow: callbacksRef.current.applyWorkflow
      })
      if (preparation.status === 'ready') {
        offerRef.current = undefined
        setOffer(undefined)
        message.success('已确认 Noon 未创建商品，可以修改后重新检查上架。')
      } else if (
        preparation.status === 'ambiguous_locked' ||
        preparation.status === 'awaiting_workflow'
      ) {
        keepCommandLocked = true
        offerRef.current = undefined
        setOffer(undefined)
        setAwaiting({ source, expectedIdentity: currentOffer.expectedIdentity })
        message.warning(
          '确认命令结果仍在核对中，已锁定重复操作并持续刷新后端上架流程。'
        )
      } else if (preparation.status === 'stale') {
        message.warning('确认结果已过期，未应用到当前草稿。')
      } else {
        message.error(
          normalizeError(preparation.error, '确认 Noon 未创建商品失败')
        )
      }
    } finally {
      if (!keepCommandLocked) {
        callbacksRef.current.commandInFlightRef.current = false
      }
      setBusy(false)
    }
  }

  return {
    awaiting: Boolean(awaiting),
    busy: busy || Boolean(awaiting) || createOutcomePolling.busy,
    canConfirm: Boolean(offer),
    lookupAttemptCount: offer?.lookupAttemptCount,
    observeVerification,
    open
  }
}
