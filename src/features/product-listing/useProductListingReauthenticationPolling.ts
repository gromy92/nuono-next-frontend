import { App } from 'antd'
import { useEffect, useRef, useState, type MutableRefObject } from 'react'
import { ApiError, normalizeError } from '../../shared/api'
import {
  fetchProductListingReauthenticationStatus,
  reauthenticateProductListingStore
} from './api'
import {
  PRODUCT_LISTING_REAUTHENTICATION_POLL_TIMEOUT_MS,
  isProductListingReauthenticationPending,
  isProductListingReauthenticationSuccess,
  isProductListingReauthenticationTarget,
  productListingReauthenticationFailureNotice,
  productListingReauthenticationProgressNotice,
  productListingReauthenticationSuccessNotice,
  productListingReauthenticationTimeoutNotice,
  type ProductListingReauthenticationNotice
} from './productListingReauthentication'
import {
  isProductListingReauthenticationAbort,
  productListingReauthenticationScopeKey,
  waitForProductListingReauthenticationPoll
} from './productListingReauthenticationPolling'
import { productListingWorkflowIdentity, type ProductListingWorkflowIdentity } from './productListingWorkflowIdentity'
import { useProductListingAutomaticReauthentication } from './useProductListingAutomaticReauthentication'
import type { ProductListingWorkflowView } from './types'

export type ProductListingReauthenticationPollingParams = {
  workflow: ProductListingWorkflowView
  draftId?: number
  storeCode?: string
  commandInFlightRef: MutableRefObject<boolean>
  identityIsCurrent: (expected: ProductListingWorkflowIdentity) => boolean
  applyWorkflow: (workflow: ProductListingWorkflowView) => boolean
}

type PollingSession = {
  key: symbol
  realRunTaskId: number
  expectedIdentity: ProductListingWorkflowIdentity
  controller: AbortController
  timeoutId?: ReturnType<typeof setTimeout>
}

export function useProductListingReauthenticationPolling(
  params: ProductListingReauthenticationPollingParams
) {
  const callbacksRef = useRef(params)
  callbacksRef.current = params
  const mountedRef = useRef(true)
  const sessionRef = useRef<PollingSession | undefined>(undefined)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<ProductListingReauthenticationNotice>()
  const { message } = App.useApp()
  const realRunTaskId = params.workflow.realRunTask?.taskId
  const storeCode = params.workflow.draft?.storeCode || params.storeCode
  const scopeKey = productListingReauthenticationScopeKey({ draftId: params.draftId, storeCode, realRunTaskId })
  const previousScopeKeyRef = useRef(scopeKey)
  useProductListingAutomaticReauthentication(params, scopeKey, start)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      cancelActiveSession(false)
    }
  }, [])

  useEffect(() => {
    if (previousScopeKeyRef.current === scopeKey) {
      return
    }
    previousScopeKeyRef.current = scopeKey
    cancelActiveSession(true)
    setNotice(undefined)
  }, [scopeKey])

  useEffect(() => {
    if (
      !isProductListingReauthenticationPending(params.workflow) ||
      !params.draftId ||
      !realRunTaskId ||
      !storeCode ||
      sessionRef.current ||
      params.commandInFlightRef.current
    ) {
      return
    }
    const expectedIdentity = productListingWorkflowIdentity(
      params.workflow,
      params.draftId,
      storeCode
    )
    if (!params.identityIsCurrent(expectedIdentity)) {
      return
    }
    const session = beginSession(
      realRunTaskId,
      expectedIdentity,
      params.workflow.message
    )
    void pollStatus(session)
  }, [
    scopeKey,
    params.workflow.phase,
    params.workflow.nextAction,
    params.workflow.reasonCode,
    params.workflow.message
  ])

  async function start(taskId: number, expectedIdentity: ProductListingWorkflowIdentity) {
    const current = callbacksRef.current
    if (
      sessionRef.current ||
      current.commandInFlightRef.current ||
      !isProductListingReauthenticationTarget(current.workflow) ||
      current.workflow.realRunTask?.taskId !== taskId ||
      !current.identityIsCurrent(expectedIdentity)
    ) {
      message.warning('上架流程已经变化，本次未执行重新授权。')
      return
    }
    const session = beginSession(taskId, expectedIdentity)
    try {
      const workflow = await reauthenticateProductListingStore(
        taskId,
        session.controller.signal
      )
      if (acceptWorkflow(session, workflow) === 'pending') {
        void pollStatus(session)
      }
    } catch (error) {
      if (!isActiveSession(session) ||
        isProductListingReauthenticationAbort(error)) {
        return
      }
      finishFailure(
        session,
        normalizeError(error, '重新授权 Noon 失败'),
        error instanceof ApiError ? error.status : undefined
      )
    }
  }

  function beginSession(
    taskId: number,
    expectedIdentity: ProductListingWorkflowIdentity,
    workflowMessage?: string
  ) {
    cancelActiveSession(false)
    const session: PollingSession = {
      key: Symbol('product-listing-reauthentication'),
      realRunTaskId: taskId,
      expectedIdentity,
      controller: new AbortController()
    }
    sessionRef.current = session
    callbacksRef.current.commandInFlightRef.current = true
    setBusy(true)
    setNotice(productListingReauthenticationProgressNotice(workflowMessage))
    session.timeoutId = setTimeout(
      () => finishTimeout(session),
      PRODUCT_LISTING_REAUTHENTICATION_POLL_TIMEOUT_MS
    )
    return session
  }

  async function pollStatus(session: PollingSession) {
    while (isActiveSession(session)) {
      const shouldContinue = await waitForProductListingReauthenticationPoll(
        session.controller.signal
      )
      if (!shouldContinue || !isActiveSession(session)) {
        return
      }
      try {
        const workflow = await fetchProductListingReauthenticationStatus(
          session.realRunTaskId,
          session.controller.signal
        )
        if (acceptWorkflow(session, workflow) !== 'pending') {
          return
        }
      } catch (error) {
        if (!isActiveSession(session) ||
          isProductListingReauthenticationAbort(error)) {
          return
        }
        if (error instanceof ApiError && error.status === 409) {
          finishFailure(session, error.message, error.status)
          return
        }
      }
    }
  }

  function acceptWorkflow(
    session: PollingSession,
    workflow: ProductListingWorkflowView
  ): 'pending' | 'terminal' {
    if (!isActiveSession(session) ||
      !callbacksRef.current.identityIsCurrent(session.expectedIdentity)) {
      cancelSession(session, true)
      return 'terminal'
    }
    const pending = isProductListingReauthenticationPending(workflow)
    const succeeded = isProductListingReauthenticationSuccess(workflow)
    const failed = isProductListingReauthenticationTarget(workflow)
    if ((!pending && !succeeded && !failed) ||
      !callbacksRef.current.applyWorkflow(workflow)) {
      finishFailure(
        session,
        '重新授权返回的上架流程不完整，页面仍保持锁定。'
      )
      return 'terminal'
    }
    if (pending) {
      setNotice(productListingReauthenticationProgressNotice(workflow.message))
      return 'pending'
    }
    if (succeeded) {
      const successNotice =
        productListingReauthenticationSuccessNotice(workflow)
      finishSession(session, successNotice)
      message.success(successNotice.message)
      return 'terminal'
    }
    finishFailure(session, workflow.message || 'Noon 重新授权未完成。')
    return 'terminal'
  }

  function finishFailure(
    session: PollingSession,
    errorMessage: string,
    status?: number
  ) {
    finishSession(
      session,
      productListingReauthenticationFailureNotice(errorMessage, status)
    )
    message.error({ content: errorMessage, duration: 8 })
  }

  function finishTimeout(session: PollingSession) {
    if (isActiveSession(session)) {
      finishSession(
        session,
        productListingReauthenticationTimeoutNotice()
      )
    }
  }

  function finishSession(
    session: PollingSession,
    nextNotice: ProductListingReauthenticationNotice
  ) {
    if (!isActiveSession(session)) {
      return
    }
    cancelSession(session, false)
    if (mountedRef.current) {
      setNotice(nextNotice)
    }
  }

  function cancelActiveSession(clearUi: boolean) {
    if (sessionRef.current) {
      cancelSession(sessionRef.current, clearUi)
    }
  }

  function cancelSession(session: PollingSession, clearUi: boolean) {
    if (sessionRef.current?.key !== session.key) {
      return
    }
    sessionRef.current = undefined
    if (session.timeoutId) {
      clearTimeout(session.timeoutId)
    }
    session.controller.abort()
    callbacksRef.current.commandInFlightRef.current = false
    if (mountedRef.current) {
      setBusy(false)
      if (clearUi) {
        setNotice(undefined)
      }
    }
  }

  function isActiveSession(session: PollingSession) {
    return mountedRef.current &&
      !session.controller.signal.aborted &&
      sessionRef.current?.key === session.key
  }

  return { busy, notice, start }
}
