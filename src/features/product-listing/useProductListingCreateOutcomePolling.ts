import { App } from 'antd'
import { useEffect, useRef, useState, type MutableRefObject } from 'react'
import { normalizeError } from '../../shared/api'
import {
  continueProductListingRealRunAfterCreate,
  verifyProductListingCreateOutcome
} from './api'
import {
  matchesProductListingPartnerSku,
  productListingWorkflowIdentity,
  type ProductListingWorkflowIdentity
} from './productListingWorkflowIdentity'
import type {
  ProductListingCreateOutcomeVerificationView,
  ProductListingWorkflowView
} from './types'

const CREATE_OUTCOME_POLL_INTERVAL_MS = 30_000

type PollingSession = {
  key: symbol
  taskId: number
  expectedIdentity: ProductListingWorkflowIdentity
  timer?: ReturnType<typeof setTimeout>
}

type ProductListingCreateOutcomePollingParams = {
  workflow: ProductListingWorkflowView
  draftId?: number
  storeCode?: string
  restartVersion: number
  commandInFlightRef: MutableRefObject<boolean>
  identityIsCurrent: (expected: ProductListingWorkflowIdentity) => boolean
  refreshWorkflow: (
    draftId: number,
    expectedIdentity: ProductListingWorkflowIdentity
  ) => Promise<unknown>
  observeVerification: (
    verification: ProductListingCreateOutcomeVerificationView,
    expectedIdentity: ProductListingWorkflowIdentity
  ) => void
}

export function useProductListingCreateOutcomePolling(
  params: ProductListingCreateOutcomePollingParams
) {
  const callbacksRef = useRef(params)
  callbacksRef.current = params
  const sessionRef = useRef<PollingSession | undefined>(undefined)
  const mountedRef = useRef(true)
  const [busy, setBusy] = useState(false)
  const { message } = App.useApp()
  const taskId = params.workflow.realRunTask?.taskId
  const target =
    params.workflow.phase === 'ACTION_REQUIRED' &&
    params.workflow.writeCertainty === 'UNKNOWN' &&
    params.workflow.nextAction === 'CHECK_CREATE_RESULT'

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      stopSession()
    }
  }, [])

  useEffect(() => {
    if (
      !target ||
      !params.draftId ||
      !taskId ||
      !params.storeCode ||
      params.commandInFlightRef.current
    ) {
      if (!target) {
        stopSession()
      }
      return
    }
    const active = sessionRef.current
    if (active?.taskId === taskId) {
      return
    }
    stopSession()
    const expectedIdentity = productListingWorkflowIdentity(
      params.workflow,
      params.draftId,
      params.storeCode
    )
    if (!params.identityIsCurrent(expectedIdentity)) {
      return
    }
    const session = {
      key: Symbol('product-listing-create-outcome'),
      taskId,
      expectedIdentity
    }
    sessionRef.current = session
    setBusy(true)
    message.info({
      content: '系统正在核对 Noon 创建结果，不会重复创建商品。',
      duration: 5
    })
    void verify(session)
  }, [
    target,
    params.draftId,
    params.storeCode,
    taskId,
    params.restartVersion
  ])

  async function verify(session: PollingSession) {
    const current = callbacksRef.current
    if (
      !isActive(session) ||
      current.commandInFlightRef.current ||
      !current.identityIsCurrent(session.expectedIdentity)
    ) {
      return
    }
    current.commandInFlightRef.current = true
    try {
      const verification = await verifyProductListingCreateOutcome(session.taskId)
      const latest = callbacksRef.current
      if (
        !isActive(session) ||
        verification.taskId !== session.taskId ||
        !matchesProductListingPartnerSku(
          verification.partnerSku,
          latest.workflow.realRunTask?.partnerSku
        ) ||
        !latest.identityIsCurrent(session.expectedIdentity)
      ) {
        stopSession(session)
        return
      }
      latest.observeVerification(verification, session.expectedIdentity)
      await latest.refreshWorkflow(
        session.expectedIdentity.draftId!,
        session.expectedIdentity
      )
      if (!isActive(session)) {
        return
      }
      if (verification.status === 'found') {
        await continueAfterRecoveredCreate(session, verification)
        stopSession(session)
        return
      }
      if (verification.status === 'reauthentication_required') {
        message.warning(
          verification.message ||
            'Noon 授权再次失效，请重新授权；系统未重复创建商品。'
        )
        stopSession(session)
        return
      }
      if (
        verification.status === 'not_found' &&
        verification.canConfirmNotCreated
      ) {
        message.warning(
          verification.message ||
            '多次只读核对仍未找到 Noon 商品，请确认未创建后返回修改。'
        )
        stopSession(session)
        return
      }
      scheduleNext(session)
    } catch (error) {
      if (!isActive(session)) {
        return
      }
      message.warning(
        `${normalizeError(error, '核对 Noon 创建结果失败')}，系统将在 30 秒后自动重试。`
      )
      scheduleNext(session)
    } finally {
      callbacksRef.current.commandInFlightRef.current = false
    }
  }

  async function continueAfterRecoveredCreate(
    session: PollingSession,
    verification: ProductListingCreateOutcomeVerificationView
  ) {
    try {
      await continueProductListingRealRunAfterCreate(session.taskId)
      if (!isActive(session)) {
        return
      }
      await callbacksRef.current.refreshWorkflow(
        session.expectedIdentity.draftId!,
        session.expectedIdentity
      )
      message.success(
        verification.message ||
          '已找到 Noon 正式商品引用，并继续完成了创建后的剩余写入。'
      )
    } catch (error) {
      message.warning(
        `${normalizeError(error, '继续完成 Noon 创建后写入失败')}。系统未重复创建商品，已保留恢复入口。`
      )
      if (isActive(session)) {
        await callbacksRef.current.refreshWorkflow(
          session.expectedIdentity.draftId!,
          session.expectedIdentity
        ).catch(() => undefined)
      }
    }
  }

  function scheduleNext(session: PollingSession) {
    if (!isActive(session)) {
      return
    }
    session.timer = setTimeout(
      () => void verify(session),
      CREATE_OUTCOME_POLL_INTERVAL_MS
    )
  }

  function stopSession(expected?: PollingSession) {
    const active = sessionRef.current
    if (!active || (expected && active.key !== expected.key)) {
      return
    }
    if (active.timer) {
      clearTimeout(active.timer)
    }
    sessionRef.current = undefined
    callbacksRef.current.commandInFlightRef.current = false
    if (mountedRef.current) {
      setBusy(false)
    }
  }

  function isActive(session: PollingSession) {
    return mountedRef.current && sessionRef.current?.key === session.key
  }

  return { busy }
}
