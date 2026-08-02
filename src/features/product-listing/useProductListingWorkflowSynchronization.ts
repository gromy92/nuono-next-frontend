import { message } from 'antd'
import { useEffect } from 'react'
import type { MutableRefObject } from 'react'
import { normalizeError } from '../../shared/api'
import { normalizeProductListingEditorDraft, type ProductListingEditorDraft } from './productDetailAdapter'
import { shouldAwaitProductListingConfirmationWorkflow } from './productListingConfirmationRefresh'
import {
  productListingWorkflowIdentity,
  type ProductListingWorkflowIdentity
} from './productListingWorkflowIdentity'
import { subscribeProductListingWorkflowRefresh } from './productListingWorkflowRefreshEvents'
import type { ProductListingWorkflowView } from './types'

type Options = {
  storeCode?: string
  listingDraft: ProductListingEditorDraft
  workflow: ProductListingWorkflowView
  currentDraftId?: number
  confirmationAwaitingWorkflow: boolean
  listingDraftRef: MutableRefObject<ProductListingEditorDraft>
  workflowIdentityRef: MutableRefObject<ProductListingWorkflowIdentity>
  updateEditorDraft: (draft: ProductListingEditorDraft) => void
  refreshWorkflow: (
    draftId: number,
    expected?: ProductListingWorkflowIdentity
  ) => Promise<ProductListingWorkflowView | undefined>
  identityMatches: (identity: ProductListingWorkflowIdentity) => boolean
  markLoadError: (message: string) => void
}

export function useProductListingWorkflowSynchronization(options: Options) {
  const {
    storeCode, listingDraft, workflow, currentDraftId,
    confirmationAwaitingWorkflow, listingDraftRef, workflowIdentityRef,
    updateEditorDraft, refreshWorkflow, identityMatches, markLoadError
  } = options

  useEffect(() => {
    listingDraftRef.current = listingDraft
    workflowIdentityRef.current = productListingWorkflowIdentity(
      workflow,
      listingDraft.draftId,
      listingDraft.storeCode
    )
  }, [listingDraft, listingDraftRef, workflow, workflowIdentityRef])

  useEffect(() => {
    if (!storeCode || listingDraft.storeCode) return
    updateEditorDraft(normalizeProductListingEditorDraft({ ...listingDraft, storeCode }, storeCode))
    // The persisted draft store becomes authoritative after hydration.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingDraft, storeCode])

  useEffect(() => {
    if (!currentDraftId) return
    let cancelled = false
    void refreshWorkflow(currentDraftId).catch((error) => {
      if (!cancelled) {
        const text = normalizeError(error, '读取上架流程失败')
        markLoadError(text)
        message.warning(text)
      }
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDraftId, listingDraft.storeCode])

  useEffect(() => {
    if (!currentDraftId) return
    return subscribeProductListingWorkflowRefresh(window, () => {
      const expected = workflowIdentityRef.current
      if (expected.draftId !== currentDraftId) return
      void refreshWorkflow(currentDraftId, expected).catch((error) => {
        message.warning(normalizeError(error, '恢复窗口后刷新上架流程失败'))
      })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDraftId, listingDraft.storeCode])

  useEffect(() => {
    const shouldPoll = (next: ProductListingWorkflowView | undefined) =>
      !next ||
      next.phase === 'PUBLISHING' ||
      next.nextAction === 'WAIT_FOR_AUTHORIZATION'
    if (!shouldPoll(workflow) || !currentDraftId) return
    let cancelled = false
    let timeoutId: number | undefined
    const expected = productListingWorkflowIdentity(
      workflow,
      currentDraftId,
      listingDraftRef.current.storeCode
    )
    const poll = async () => {
      try {
        const next = await refreshWorkflow(currentDraftId, expected)
        if (!cancelled && identityMatches(expected) && shouldPoll(next)) {
          timeoutId = window.setTimeout(() => void poll(), 3000)
        }
      } catch (error) {
        if (!cancelled) {
          message.warning(normalizeError(error, '刷新上架流程失败'))
          timeoutId = window.setTimeout(() => void poll(), 3000)
        }
      }
    }
    timeoutId = window.setTimeout(() => void poll(), 3000)
    return () => {
      cancelled = true
      if (timeoutId !== undefined) window.clearTimeout(timeoutId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDraftId, workflow.phase, workflow.nextAction, workflow.realRunTask?.taskId])

  useEffect(() => {
    if (!confirmationAwaitingWorkflow || !currentDraftId) return
    let cancelled = false
    let timeoutId: number | undefined
    const retry = async () => {
      try {
        const next = await refreshWorkflow(currentDraftId, workflowIdentityRef.current)
        if (!cancelled && shouldAwaitProductListingConfirmationWorkflow(next)) {
          timeoutId = window.setTimeout(() => void retry(), 2500)
        }
      } catch {
        if (!cancelled) timeoutId = window.setTimeout(() => void retry(), 2500)
      }
    }
    timeoutId = window.setTimeout(() => void retry(), 1500)
    return () => {
      cancelled = true
      if (timeoutId !== undefined) window.clearTimeout(timeoutId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmationAwaitingWorkflow, currentDraftId])
}
