import { message } from 'antd'
import type { FormInstance } from 'antd'
import type { MutableRefObject } from 'react'
import { normalizeError } from '../../shared/api'
import { saveProductListingDraft } from './api'
import {
  normalizeProductListingEditorDraft,
  productListingEditorDraftToPayload,
  type ProductListingEditorDraft,
  type ProductListingMetadataFormValues
} from './productDetailAdapter'
import type { ProductListingNotice } from './ProductListingPageStatus'
import type { ProductListingDraftView, ProductListingWorkflowView } from './types'
import type { ProductListingWorkflowIdentity } from './productListingWorkflowIdentity'

const PRODUCT_LISTING_DRAFT_SAVE_MESSAGE_KEY = 'product-listing-draft-save'

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
  setDraftSaveNotice: (notice: ProductListingNotice) => void
}

export function useProductListingDraftPersistence(options: Options) {
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
    showStart(saveOptions?.silent)
    options.setSaving(true)
    try {
      const currentDraft = saveOptions?.draftOverride
        ? normalizeProductListingEditorDraft(
            saveOptions.draftOverride,
            saveOptions.draftOverride.storeCode || options.storeCode
          )
        : currentListingDraftFromForm()
      options.updateEditorDraft(currentDraft)
      const saved = await saveProductListingDraft(
        productListingEditorDraftToPayload(currentDraft, options.currentDraftId)
      )
      options.updateEditorDraft(editorDraftFromSaved(currentDraft, saved))
      const workflow = await options.refreshWorkflow(saved.draftId)
      showSuccess(saved, saveOptions?.silent)
      return { saved, workflow }
    } catch (error) {
      showFailure(error, saveOptions?.silent)
      return undefined
    } finally {
      options.setSaving(false)
    }
  }

  const showStart = (silent?: boolean) => {
    if (silent) return
    options.setDraftSaveNotice({ type: 'info', message: '正在保存上架草稿...' })
    message.loading({ key: PRODUCT_LISTING_DRAFT_SAVE_MESSAGE_KEY, content: '正在保存上架草稿...', duration: 0 })
  }
  const showSuccess = (saved: ProductListingDraftView, silent?: boolean) => {
    if (silent) return
    const text = saved.draftNo ? `上架草稿已保存：${saved.draftNo}` : '上架草稿已保存'
    options.setDraftSaveNotice({ type: 'success', message: text })
    message.success({ key: PRODUCT_LISTING_DRAFT_SAVE_MESSAGE_KEY, content: text })
  }
  const showFailure = (error: unknown, silent?: boolean) => {
    const text = normalizeError(error, '保存上架草稿失败')
    if (!silent) {
      options.setDraftSaveNotice({ type: 'error', message: text })
      message.error({ key: PRODUCT_LISTING_DRAFT_SAVE_MESSAGE_KEY, content: text })
    } else {
      message.error(text)
    }
  }

  return { currentListingDraftFromForm, saveDraftFromForm }
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
