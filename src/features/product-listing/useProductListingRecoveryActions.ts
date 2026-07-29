import { message } from 'antd'
import type { MutableRefObject } from 'react'
import { normalizeError } from '../../shared/api'
import {
  continueProductListingRealRunAfterCreate,
  replayProductListingProjection,
  verifyProductListingCreateOutcome,
  verifyProductListingRealRunReadBack
} from './api'
import {
  isAmbiguousProductListingCommandError,
  isDangerousProductListingRecoveryAction,
  type DangerousProductListingRecoveryAction
} from './productListingAmbiguousOutcome'
import { focusProductListingEditor } from './productListingReviewReopenCompletion'
import {
  matchesProductListingPartnerSku,
  productListingWorkflowIdentity,
  type ProductListingWorkflowIdentity
} from './productListingWorkflowIdentity'
import type {
  ProductListingCreateOutcomeVerificationView,
  ProductListingWorkflowNextAction,
  ProductListingWorkflowView
} from './types'
import type { ProductListingEditorDraft } from './productDetailAdapter'

type Options = {
  workflow: ProductListingWorkflowView
  currentDraftId?: number
  workflowIntegrityError: string
  sourceHydrationBlocked: boolean
  hydrationBlockedMessage?: string
  workflowLocked: boolean
  workflowBlockedMessage?: string
  dangerousActionAwaitingWorkflow?: DangerousProductListingRecoveryAction
  setDangerousActionAwaitingWorkflow: (action?: DangerousProductListingRecoveryAction) => void
  reviewReopenAwaiting: boolean
  reopenReview: (intent: { kind: 'EDIT_DRAFT' | 'REVIEW_DRAFT' }) => Promise<unknown>
  openReauthentication: () => void
  observeVerification: (
    verification: ProductListingCreateOutcomeVerificationView,
    identity: ProductListingWorkflowIdentity
  ) => void
  resetDangerousPolling: () => void
  listingDraftRef: MutableRefObject<ProductListingEditorDraft>
  recoveryCommandInFlightRef: MutableRefObject<boolean>
  setWorkflowActionBusy: (busy: boolean) => void
  setListingReviewOpen: (open: boolean) => void
  handleOpenListingReview: () => Promise<void>
  closeListingReview: () => void
  refreshWorkflow: (
    draftId: number,
    identity?: ProductListingWorkflowIdentity
  ) => Promise<ProductListingWorkflowView | undefined>
  identityMatches: (identity: ProductListingWorkflowIdentity) => boolean
}

export function useProductListingRecoveryActions(options: Options) {
  const handleTerminalDraftAction = async (action: 'EDIT_DRAFT' | 'REVIEW_DRAFT') => {
    if (
      options.workflow.phase !== 'ACTION_REQUIRED'
      || options.workflow.writeCertainty !== 'NOT_STARTED'
      || options.workflow.nextAction !== action
    ) {
      message.warning('当前处理动作已经变化，请刷新流程后重试。')
      return
    }
    await options.reopenReview({ kind: action })
  }

  const executeRealRunRecoveryAction = async (action: ProductListingWorkflowNextAction) => {
    const draftId = options.currentDraftId
    const taskId = options.workflow.realRunTask?.taskId
    if (
      options.workflowIntegrityError
      || options.sourceHydrationBlocked
      || options.workflowLocked
      || options.dangerousActionAwaitingWorkflow
      || !draftId
      || !taskId
      || options.workflow.nextAction !== action
    ) {
      message.warning('当前恢复动作已变化，请刷新流程后重试。')
      return
    }
    if (options.recoveryCommandInFlightRef.current) {
      message.warning('恢复动作正在执行，请勿重复提交。')
      return
    }
    const expected = productListingWorkflowIdentity(
      options.workflow,
      draftId,
      options.listingDraftRef.current.storeCode
    )
    const dangerousAction = isDangerousProductListingRecoveryAction(action) ? action : undefined
    options.recoveryCommandInFlightRef.current = true
    options.setWorkflowActionBusy(true)
    try {
      if (action === 'CHECK_CREATE_RESULT') {
        const verification = await verifyProductListingCreateOutcome(taskId)
        if (
          verification.taskId !== taskId
          || !matchesProductListingPartnerSku(
            verification.partnerSku,
            options.workflow.realRunTask?.partnerSku
          )
          || !options.identityMatches(expected)
        ) {
          message.warning('核对结果已过期，未应用到当前上架任务。')
          return
        }
        if (verification.status === 'found') {
          message.success(verification.message || '已找到 Noon 商品，可以继续完成剩余写入。')
        } else if (verification.status === 'not_found') {
          message.warning(verification.message || 'Noon 暂未找到该商品，不能继续写入。')
        } else if (verification.status === 'reauthentication_required') {
          message.warning(verification.message || 'Noon 授权已失效，请重新授权后继续只读核对。')
        } else {
          message.error(verification.message || '核对 Noon 创建结果失败。')
        }
        options.observeVerification(verification, expected)
      } else if (action === 'CONTINUE_AFTER_CREATE') {
        await continueProductListingRealRunAfterCreate(taskId)
      } else if (action === 'VERIFY_READBACK') {
        await verifyProductListingRealRunReadBack(taskId)
      } else {
        await replayProductListingProjection(taskId)
      }
      if (options.identityMatches(expected)) {
        await options.refreshWorkflow(draftId, expected)
      }
    } catch (error) {
      if (
        dangerousAction
        && options.identityMatches(expected)
        && isAmbiguousProductListingCommandError(error)
      ) {
        options.resetDangerousPolling()
        options.setDangerousActionAwaitingWorkflow(dangerousAction)
        message.warning('恢复写入命令结果未知，已锁定当前操作并持续刷新后端上架流程。')
      } else {
        message.error(normalizeError(error, '执行上架恢复动作失败'))
      }
    } finally {
      options.recoveryCommandInFlightRef.current = false
      options.setWorkflowActionBusy(false)
    }
  }

  const handleWorkflowAction = async (action: ProductListingWorkflowNextAction) => {
    if (options.sourceHydrationBlocked) {
      message.warning(options.hydrationBlockedMessage)
      return
    }
    if (options.workflowLocked) {
      message.warning(options.workflowBlockedMessage)
      return
    }
    if (options.dangerousActionAwaitingWorkflow || options.reviewReopenAwaiting) {
      message.warning('流程结果仍在确认中，请等待后端状态更新。')
      return
    }
    switch (action) {
      case 'REVIEW_DRAFT':
        return options.workflow.phase === 'ACTION_REQUIRED'
          ? handleTerminalDraftAction(action)
          : options.handleOpenListingReview()
      case 'EDIT_DRAFT':
        if (options.workflow.phase === 'ACTION_REQUIRED') {
          return handleTerminalDraftAction(action)
        }
        options.closeListingReview()
        focusProductListingEditor()
        return
      case 'CONFIRM_PUBLISH':
        options.setListingReviewOpen(true)
        return
      case 'REAUTHENTICATE':
        options.openReauthentication()
        return
      case 'CHECK_CREATE_RESULT':
      case 'CONTINUE_AFTER_CREATE':
      case 'VERIFY_READBACK':
      case 'REPLAY_PROJECTION':
        return executeRealRunRecoveryAction(action)
      case 'WAIT':
      case 'WAIT_FOR_REAUTHENTICATION':
      case 'NONE':
        return
    }
  }

  return { handleWorkflowAction }
}
