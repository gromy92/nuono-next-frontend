import { message } from 'antd'
import type { FormInstance } from 'antd'
import type { MutableRefObject } from 'react'
import { saveProductListingDraft } from './api'
import {
  normalizeProductListingEditorDraft,
  productListingEditorDraftToPayload,
  type ProductListingEditorDraft,
  type ProductListingMetadataFormValues
} from './productDetailAdapter'
import { saveProductListingDraftWithWorkflowRefresh } from './productListingDraftPersistence'
import type { ProductListingDraftView, ProductListingWorkflowView } from './types'
import type { ProductListingWorkflowIdentity } from './productListingWorkflowIdentity'
import { useProductListingDraftSaveFeedback } from './useProductListingDraftSaveFeedback'

type Options = {
  form: FormInstance<ProductListingMetadataFormValues>
  storeCode?: string
  listingDraftRef: MutableRefObject<ProductListingEditorDraft>
  currentDraftId?: number
  workflowIntegrityError: string
  sourceHydrationBlocked: boolean
  hydrationBlockedMessage?: string
  workflowLocked: boolean
  workflowBlockedMessage?: string
  canEditAndSave: boolean
  updateEditorDraft: (draft: ProductListingEditorDraft) => void
  refreshWorkflow: (
    draftId: number,
    expected?: ProductListingWorkflowIdentity
  ) => Promise<ProductListingWorkflowView | undefined>
  setSaving: (saving: boolean) => void
}

export function useProductListingDraftPersistence(options: Options) {
  const feedback = useProductListingDraftSaveFeedback()
  const currentListingDraftFromForm = () => normalizeProductListingEditorDraft({
    ...options.listingDraftRef.current,
    ...options.form.getFieldsValue()
  }, options.listingDraftRef.current.storeCode || options.storeCode)

  const saveDraftFromForm = async (saveOptions?: {
    silent?: boolean
    draftOverride?: ProductListingEditorDraft
  }) => {
    if (
      options.workflowIntegrityError
      || options.sourceHydrationBlocked
      || options.workflowLocked
      || !options.canEditAndSave
    ) {
      message.warning(
        options.sourceHydrationBlocked
          ? options.hydrationBlockedMessage
          : options.workflowLocked
            ? options.workflowBlockedMessage
            : '当前上架状态不允许保存草稿，请先完成当前动作。'
      )
      return undefined
    }
    feedback.start(saveOptions?.silent)
    options.setSaving(true)
    try {
      const currentDraft = saveOptions?.draftOverride
        ? normalizeProductListingEditorDraft(
            saveOptions.draftOverride,
            saveOptions.draftOverride.storeCode || options.storeCode
          )
        : currentListingDraftFromForm()
      options.updateEditorDraft(currentDraft)
      const refreshWorkflow = options.refreshWorkflow
      const saveResult = await saveProductListingDraftWithWorkflowRefresh(
        productListingEditorDraftToPayload(currentDraft, options.currentDraftId),
        {
          saveDraft: saveProductListingDraft,
          refreshWorkflow: savedDraftId => refreshWorkflow(savedDraftId),
          onSaved: saved => {
            options.updateEditorDraft(editorDraftFromSaved(currentDraft, saved))
            feedback.success(saved, saveOptions?.silent)
          }
        }
      )
      if (!saveResult.workflow) {
        feedback.workflowRefreshFailure(saveOptions?.silent)
      }
      return saveResult
    } catch (error) {
      feedback.failure(error, saveOptions?.silent)
      return undefined
    } finally {
      options.setSaving(false)
    }
  }

  return {
    currentListingDraftFromForm,
    saveDraftFromForm,
    draftSaveNotice: feedback.notice
  }
}

function editorDraftFromSaved(
  currentDraft: ProductListingEditorDraft,
  saved: ProductListingDraftView
) {
  return normalizeProductListingEditorDraft({
    ...currentDraft,
    ...(saved.draft ?? {}),
    draftId: saved.draftId,
    storeCode: saved.storeCode
  }, saved.storeCode)
}
