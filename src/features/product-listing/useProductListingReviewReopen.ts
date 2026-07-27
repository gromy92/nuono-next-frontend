import { message } from 'antd'
import { useEffect, useRef, useState, type MutableRefObject } from 'react'
import { normalizeError } from '../../shared/api'
import {
  prepareProductListingReviewReopen,
  reconcileProductListingReviewReopen,
  type ProductListingReviewReopenSource
} from './productListingReviewReopen'
import {
  productListingWorkflowIdentity,
  type ProductListingWorkflowIdentity
} from './productListingWorkflowIdentity'
import type { ProductListingWorkflowView } from './types'

export type ProductListingReviewReopenIntent = {
  kind:
    | 'RETURN_TO_EDIT'
    | 'EDIT_DRAFT'
    | 'REVIEW_DRAFT'
}

type AwaitingProductListingReviewReopen = {
  intent: ProductListingReviewReopenIntent
  draftId: number
  source: ProductListingReviewReopenSource
}

type ProductListingReviewReopenControllerParams = {
  workflow: ProductListingWorkflowView
  draftId?: number
  storeCode?: string
  commandInFlightRef: MutableRefObject<boolean>
  reopenReview: (dryRunTaskId: number) => Promise<ProductListingWorkflowView>
  refreshWorkflow: (
    draftId: number,
    expected: ProductListingWorkflowIdentity
  ) => Promise<ProductListingWorkflowView | undefined>
  identityIsCurrent: (expected: ProductListingWorkflowIdentity) => boolean
  applyReopenedWorkflow: (workflow: ProductListingWorkflowView) => boolean
  onReady: (intent: ProductListingReviewReopenIntent) => void
}

export function useProductListingReviewReopenController(
  params: ProductListingReviewReopenControllerParams
) {
  const callbacksRef = useRef(params)
  callbacksRef.current = params
  const [inFlight, setInFlight] = useState(false)
  const [awaiting, setAwaiting] =
    useState<AwaitingProductListingReviewReopen>()

  useEffect(() => {
    if (!awaiting) {
      return
    }
    const resolution = reconcileProductListingReviewReopen(
      awaiting.source,
      params.workflow,
      params.draftId,
      params.storeCode
    )
    if (resolution === 'waiting') {
      return
    }
    callbacksRef.current.commandInFlightRef.current = false
    setAwaiting(undefined)
    if (resolution === 'ready') {
      callbacksRef.current.onReady(awaiting.intent)
    } else {
      message.warning('后端上架流程已经变化，请按最新动作继续。')
    }
  }, [awaiting, params.draftId, params.storeCode, params.workflow])

  useEffect(() => {
    if (!awaiting) {
      return
    }
    let cancelled = false
    let timeoutId: number | undefined
    const poll = async () => {
      try {
        await callbacksRef.current.refreshWorkflow(
          awaiting.draftId,
          awaiting.source.identity
        )
      } catch {
        // Keep the fail-closed lock and retry until backend truth changes.
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

  async function reopen(intent: ProductListingReviewReopenIntent) {
    const current = callbacksRef.current
    const dryRunTaskId = current.workflow.dryRunTask?.taskId
    const draftId = current.draftId
    if (
      awaiting ||
      current.commandInFlightRef.current ||
      !draftId ||
      !dryRunTaskId ||
      !intentMatchesWorkflow(intent, current.workflow)
    ) {
      message.warning('当前没有可以解除的上架检查，请刷新流程后重试。')
      return
    }
    const identity = productListingWorkflowIdentity(
      current.workflow,
      draftId,
      current.storeCode
    )
    const source: ProductListingReviewReopenSource = {
      identity,
      phase: current.workflow.phase,
      writeCertainty: current.workflow.writeCertainty,
      nextAction: current.workflow.nextAction
    }
    current.commandInFlightRef.current = true
    setInFlight(true)
    let keepCommandLocked = false
    try {
      const preparation = await prepareProductListingReviewReopen({
        reopen: () => callbacksRef.current.reopenReview(dryRunTaskId),
        refresh: () => callbacksRef.current.refreshWorkflow(draftId, identity),
        identityIsCurrent: () =>
          callbacksRef.current.identityIsCurrent(identity),
        applyReopenedWorkflow: callbacksRef.current.applyReopenedWorkflow
      })
      if (preparation.status === 'ready') {
        callbacksRef.current.onReady(intent)
      } else if (
        preparation.status === 'ambiguous_locked' ||
        preparation.status === 'refresh_failed'
      ) {
        keepCommandLocked = true
        setAwaiting({ intent, draftId, source })
        message.warning(
          '解除旧上架检查的结果仍在确认中，已锁定重复操作并持续刷新后端流程。'
        )
      } else if (preparation.status === 'stale') {
        message.warning('返回编辑结果已过期，未应用到当前草稿。')
      } else if (preparation.status === 'locked') {
        message.warning('后端尚未恢复可编辑状态，当前流程仍保持锁定。')
      } else {
        message.error(normalizeError(preparation.error, '解除旧上架检查失败'))
      }
    } finally {
      if (!keepCommandLocked) {
        current.commandInFlightRef.current = false
      }
      setInFlight(false)
    }
  }

  return {
    awaiting: Boolean(awaiting),
    busy: inFlight || Boolean(awaiting),
    reopen
  }
}

function intentMatchesWorkflow(
  intent: ProductListingReviewReopenIntent,
  workflow: ProductListingWorkflowView
) {
  if (workflow.writeCertainty !== 'NOT_STARTED') {
    return false
  }
  if (intent.kind === 'RETURN_TO_EDIT') {
    return (
      workflow.phase === 'READY_TO_CONFIRM' &&
      workflow.nextAction === 'CONFIRM_PUBLISH'
    )
  }
  return (
    workflow.phase === 'ACTION_REQUIRED' &&
    workflow.nextAction === intent.kind
  )
}
