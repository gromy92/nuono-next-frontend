import { message } from 'antd'
import type { MutableRefObject } from 'react'
import { normalizeError } from '../../shared/api'
import { confirmProductListingRealRun, submitProductListingDryRun } from './api'
import type { ProductListingEditorDraft } from './productDetailAdapter'
import { productListingEditorDraftToPayload } from './productDetailAdapter'
import {
  isAmbiguousProductListingCommandError
} from './productListingAmbiguousOutcome'
import {
  buildProductListingChangeSummary,
  type ProductListingChangeSummaryItem
} from './productListingChangeSummary'
import { shouldAwaitProductListingConfirmationWorkflow } from './productListingConfirmationRefresh'
import {
  productListingWorkflowIdentity,
  type ProductListingWorkflowIdentity
} from './productListingWorkflowIdentity'
import { presentProductListingWorkflow } from './productListingWorkflowPresentation'
import type {
  ProductListingDraftView,
  ProductListingWorkflowView
} from './types'

const PRODUCT_LISTING_REAL_RUN_PSKU_REQUIRED_MESSAGE = '请先填写正式 PSKU，再点击上架。'

type Options = {
  workflow: ProductListingWorkflowView
  currentDraftId?: number
  confirming: boolean
  setConfirming: (value: boolean) => void
  confirmationAwaitingWorkflow: boolean
  setConfirmationAwaitingWorkflow: (value: boolean) => void
  sourceHydrationBlocked: boolean
  hydrationBlockedMessage?: string
  workflowLocked: boolean
  workflowBlockedMessage?: string
  workflowIntegrityError: string
  allowPrepare: boolean
  allowCloseReview: boolean
  canConfirm: boolean
  canReturnToEdit: boolean
  reviewReopenBusy: boolean
  reopenReview: (intent: { kind: 'RETURN_TO_EDIT' }) => Promise<unknown>
  listingDraftRef: MutableRefObject<ProductListingEditorDraft>
  sourcePrefillDraft?: Partial<ProductListingEditorDraft>
  currentListingDraftFromForm: () => ProductListingEditorDraft
  saveDraftFromForm: (options: {
    silent: boolean
    draftOverride: ProductListingEditorDraft
  }) => Promise<{ saved: ProductListingDraftView; workflow?: ProductListingWorkflowView } | undefined>
  refreshWorkflow: (
    draftId: number,
    expected?: ProductListingWorkflowIdentity
  ) => Promise<ProductListingWorkflowView | undefined>
  identityMatches: (identity: ProductListingWorkflowIdentity) => boolean
  confirmCommandInFlightRef: MutableRefObject<boolean>
  setListingReviewOpen: (value: boolean) => void
  setListingReviewChanges: (value: ProductListingChangeSummaryItem[]) => void
  setListingPreparationError: (value: string) => void
  setPreparing: (value: boolean) => void
}

export function useProductListingReviewActions(options: Options) {
  const handleOpenListingReview = async () => {
    if (
      options.workflowIntegrityError
      || options.sourceHydrationBlocked
      || options.workflowLocked
      || !options.allowPrepare
    ) {
      message.warning(
        options.sourceHydrationBlocked
          ? options.hydrationBlockedMessage
          : options.workflowLocked
            ? options.workflowBlockedMessage
            : '当前上架状态不允许再次发起上架检查。'
      )
      return
    }
    const currentDraft = options.currentListingDraftFromForm()
    if (!currentDraft.psku.trim()) {
      options.setListingPreparationError(PRODUCT_LISTING_REAL_RUN_PSKU_REQUIRED_MESSAGE)
      message.warning(PRODUCT_LISTING_REAL_RUN_PSKU_REQUIRED_MESSAGE)
      return
    }
    const previewPayload = productListingEditorDraftToPayload(currentDraft, options.currentDraftId)
    options.setListingReviewChanges(buildProductListingChangeSummary(
      previewPayload,
      options.workflow.draft?.draft ?? options.sourcePrefillDraft
    ))
    options.setListingPreparationError('')
    options.setListingReviewOpen(true)
    options.setPreparing(true)
    try {
      const result = await options.saveDraftFromForm({ silent: true, draftOverride: currentDraft })
      if (!result?.saved.draftId) {
        options.setListingPreparationError('自动保存草稿失败，请处理页面提示后重试。')
        return
      }
      if (!result.workflow) {
        options.setListingPreparationError(
          '草稿已保存，但暂时无法读取最新上架状态，请刷新页面后重试。'
        )
        return
      }
      if (!presentProductListingWorkflow(result.workflow).allowPrepare) {
        const text = '上架状态已在其他窗口发生变化，本次未提交新的上架检查。'
        options.setListingPreparationError(text)
        message.warning(text)
        return
      }
      const expected = productListingWorkflowIdentity(
        result.workflow,
        result.saved.draftId,
        result.saved.storeCode
      )
      await submitProductListingDryRun({
        draftId: result.saved.draftId,
        storeCode: result.saved.storeCode
      })
      await options.refreshWorkflow(result.saved.draftId, expected)
    } catch (error) {
      const text = normalizeError(error, '提交上架检查失败')
      options.setListingPreparationError(text)
      message.error(text)
    } finally {
      options.setPreparing(false)
    }
  }

  const handleConfirmPublish = async () => {
    const taskId = options.workflow.dryRunTask?.taskId
    const draftId = options.currentDraftId
    if (
      options.confirming
      || options.confirmCommandInFlightRef.current
      || options.confirmationAwaitingWorkflow
      || options.reviewReopenBusy
      || options.workflowIntegrityError
      || options.sourceHydrationBlocked
      || options.workflowLocked
      || !options.canConfirm
      || options.workflow.phase !== 'READY_TO_CONFIRM'
      || options.workflow.nextAction !== 'CONFIRM_PUBLISH'
      || !taskId
      || !draftId
    ) {
      message.warning('当前没有可以确认的上架检查，请刷新流程后重试。')
      return
    }
    const expected = productListingWorkflowIdentity(
      options.workflow,
      draftId,
      options.listingDraftRef.current.storeCode
    )
    options.confirmCommandInFlightRef.current = true
    options.setConfirming(true)
    let commandAccepted = false
    try {
      await confirmProductListingRealRun(taskId, {
        confirmRealNoonWrite: true,
        confirmationNote: 'confirmed from product listing workflow'
      })
      commandAccepted = true
      if (!options.identityMatches(expected)) {
        message.warning('确认结果属于之前的草稿，未应用到当前上架流程。')
        return
      }
      options.setConfirmationAwaitingWorkflow(true)
      const next = await options.refreshWorkflow(draftId, expected)
      if (!shouldAwaitProductListingConfirmationWorkflow(next)) {
        options.setConfirmationAwaitingWorkflow(false)
      }
    } catch (error) {
      if (
        options.identityMatches(expected)
        && (commandAccepted || isAmbiguousProductListingCommandError(error))
      ) {
        options.setConfirmationAwaitingWorkflow(true)
        message.warning('确认命令结果未知，已锁定当前操作并持续刷新后端上架流程。')
      } else {
        options.setConfirmationAwaitingWorkflow(false)
        message.error(normalizeError(error, '确认真实上架失败'))
      }
    } finally {
      options.confirmCommandInFlightRef.current = false
      options.setConfirming(false)
    }
  }

  const closeListingReview = () => {
    if (
      options.allowCloseReview
      && !options.confirming
      && !options.confirmationAwaitingWorkflow
      && !options.workflowIntegrityError
      && !options.reviewReopenBusy
    ) {
      options.setListingReviewOpen(false)
    }
  }
  const handleReturnToEdit = async () => {
    if (
      options.workflowIntegrityError
      || options.sourceHydrationBlocked
      || options.workflowLocked
      || !options.canReturnToEdit
    ) {
      message.warning('当前上架检查不能返回修改，请刷新流程后重试。')
      return
    }
    await options.reopenReview({ kind: 'RETURN_TO_EDIT' })
  }

  return { handleOpenListingReview, handleConfirmPublish, closeListingReview, handleReturnToEdit }
}
