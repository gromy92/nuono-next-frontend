import type { ProductListingEditorDraft } from './productDetailAdapter'
import type { ProductListingWorkflowView } from './types'

export type ProductListingWorkflowClientState = {
  editorDraft: ProductListingEditorDraft
  workflow: ProductListingWorkflowView
}

export function applyProductListingWorkflowRefresh(
  current: ProductListingWorkflowClientState,
  workflow: ProductListingWorkflowView
): ProductListingWorkflowClientState {
  return {
    editorDraft: current.editorDraft,
    workflow
  }
}
