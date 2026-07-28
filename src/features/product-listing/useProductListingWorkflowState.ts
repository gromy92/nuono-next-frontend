import type { FormInstance } from 'antd'
import { useMemo, useRef, useState } from 'react'
import { fetchProductListingWorkflow } from './api'
import {
  createProductListingEditorDraft,
  mergeProductListingPrefillDraft,
  normalizeProductListingEditorDraft,
  productListingEditorDraftToMetadataValues,
  type ProductListingEditorDraft,
  type ProductListingMetadataFormValues
} from './productDetailAdapter'
import { shouldAwaitProductListingConfirmationWorkflow } from './productListingConfirmationRefresh'
import type { DangerousProductListingRecoveryAction } from './productListingAmbiguousOutcome'
import { applyProductListingWorkflowRefresh } from './productListingWorkflowClientState'
import { resolveProductListingWorkflowEditSession } from './productListingWorkflowEditSession'
import {
  canApplyProductListingWorkflowResponse,
  productListingWorkflowIdentity,
  sameProductListingWorkflowIdentity,
  validateProductListingWorkflowResponse,
  type ProductListingWorkflowIdentity
} from './productListingWorkflowIdentity'
import {
  createEditingProductListingWorkflow,
  presentProductListingWorkflow
} from './productListingWorkflowPresentation'
import type { ProductListingSourcePrefill } from './sourcePrefill'
import type { ProductListingWorkflowView } from './types'
import { useProductListingWorkflowReadiness } from './useProductListingWorkflowReadiness'

type Options = {
  storeCode?: string
  form: FormInstance<ProductListingMetadataFormValues>
}

export function useProductListingWorkflowState({ storeCode, form }: Options) {
  const [listingDraft, setListingDraft] = useState<ProductListingEditorDraft>(
    () => createProductListingEditorDraft(storeCode)
  )
  const [workflow, setWorkflow] = useState<ProductListingWorkflowView>(
    createEditingProductListingWorkflow
  )
  const [confirmationAwaitingWorkflow, setConfirmationAwaitingWorkflow] = useState(false)
  const [dangerousActionAwaitingWorkflow, setDangerousActionAwaitingWorkflow] =
    useState<DangerousProductListingRecoveryAction>()
  const [workflowIntegrityError, setWorkflowIntegrityError] = useState('')
  const listingDraftRef = useRef(listingDraft)
  const workflowIdentityRef = useRef<ProductListingWorkflowIdentity>(
    productListingWorkflowIdentity(workflow, listingDraft.draftId, listingDraft.storeCode)
  )
  const workflowRequestSequenceRef = useRef(0)
  const workflowPresentation = useMemo(() => presentProductListingWorkflow(workflow), [workflow])
  const editSession = useMemo(() => resolveProductListingWorkflowEditSession(workflow), [workflow])
  const currentDraftId = listingDraft.draftId ?? workflow.draft?.draftId
  const workflowReadiness = useProductListingWorkflowReadiness(currentDraftId, listingDraft.storeCode)

  function updateEditorDraft(nextDraft: ProductListingEditorDraft) {
    const currentDraft = listingDraftRef.current
    workflowReadiness.invalidateIfScopeChanged(
      currentDraft.draftId,
      currentDraft.storeCode,
      nextDraft.draftId,
      nextDraft.storeCode
    )
    listingDraftRef.current = nextDraft
    setListingDraft(nextDraft)
    form.setFieldsValue(productListingEditorDraftToMetadataValues(nextDraft))
  }

  function applySourcePrefill(nextPrefill: ProductListingSourcePrefill) {
    const currentDraft = listingDraftRef.current
    const nextDraft = normalizeProductListingEditorDraft({
      ...mergeProductListingPrefillDraft(currentDraft, nextPrefill.draft),
      competitorMaterials:
        nextPrefill.competitorMaterials
        ?? nextPrefill.draft.competitorMaterials
        ?? currentDraft.competitorMaterials,
      storeCode: nextPrefill.draft.storeCode || currentDraft.storeCode || storeCode
    }, nextPrefill.draft.storeCode || currentDraft.storeCode || storeCode)
    if (nextDraft.draftId !== currentDraft.draftId) {
      const editingWorkflow = createEditingProductListingWorkflow()
      setWorkflow(editingWorkflow)
      workflowIdentityRef.current = productListingWorkflowIdentity(
        editingWorkflow,
        nextDraft.draftId,
        nextDraft.storeCode
      )
      workflowRequestSequenceRef.current += 1
      setDangerousActionAwaitingWorkflow(undefined)
    }
    updateEditorDraft(nextDraft)
  }

  function applyWorkflow(nextWorkflow: ProductListingWorkflowView) {
    const activeDraft = listingDraftRef.current
    if (!activeDraft.draftId || !activeDraft.storeCode) {
      setWorkflowIntegrityError('上架流程缺少当前草稿身份，已停止可执行操作。')
      return false
    }
    const validation = validateProductListingWorkflowResponse(nextWorkflow, {
      draftId: activeDraft.draftId,
      storeCode: activeDraft.storeCode
    })
    if (!validation.valid) {
      setWorkflowIntegrityError(
        `上架流程身份校验失败（${validation.reason || 'unknown'}），已停止可执行操作。`
      )
      return false
    }
    const nextState = applyProductListingWorkflowRefresh(
      { editorDraft: listingDraftRef.current, workflow },
      nextWorkflow
    )
    setWorkflowIntegrityError('')
    workflowReadiness.markLoaded(activeDraft.draftId, activeDraft.storeCode)
    setWorkflow(nextState.workflow)
    if (!shouldAwaitProductListingConfirmationWorkflow(nextState.workflow)) {
      setConfirmationAwaitingWorkflow(false)
    }
    workflowIdentityRef.current = productListingWorkflowIdentity(
      nextState.workflow,
      nextState.editorDraft.draftId,
      nextState.editorDraft.storeCode
    )
    return true
  }

  function identityMatches(expected: ProductListingWorkflowIdentity) {
    return sameProductListingWorkflowIdentity(workflowIdentityRef.current, expected)
  }

  async function refreshWorkflow(draftId: number, expected?: ProductListingWorkflowIdentity) {
    const requestSequence = ++workflowRequestSequenceRef.current
    const nextWorkflow = await fetchProductListingWorkflow(draftId)
    const activeDraftId = listingDraftRef.current.draftId ?? workflowIdentityRef.current.draftId
    if (!canApplyProductListingWorkflowResponse({
      requestSequence,
      latestSequence: workflowRequestSequenceRef.current,
      requestedDraftId: draftId,
      activeDraftId,
      expectedIdentity: expected,
      currentIdentity: workflowIdentityRef.current
    })) {
      return undefined
    }
    return applyWorkflow(nextWorkflow) ? nextWorkflow : undefined
  }

  return {
    listingDraft, setListingDraft, workflow, setWorkflow,
    confirmationAwaitingWorkflow, setConfirmationAwaitingWorkflow,
    dangerousActionAwaitingWorkflow, setDangerousActionAwaitingWorkflow,
    workflowIntegrityError, listingDraftRef, workflowIdentityRef,
    workflowRequestSequenceRef, workflowPresentation, editSession,
    currentDraftId, workflowReadiness, updateEditorDraft, applySourcePrefill,
    applyWorkflow, identityMatches, refreshWorkflow
  }
}
