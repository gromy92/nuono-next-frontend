import type {
  ProductListingDraftPayload,
  ProductListingDraftView,
  ProductListingWorkflowView
} from './types'

type ProductListingDraftPersistenceDependencies = {
  saveDraft: (payload: ProductListingDraftPayload) => Promise<ProductListingDraftView>
  refreshWorkflow: (draftId: number) => Promise<ProductListingWorkflowView | undefined>
  onSaved?: (saved: ProductListingDraftView) => void
}

export type ProductListingDraftPersistenceResult = {
  saved: ProductListingDraftView
  workflow?: ProductListingWorkflowView
  workflowRefreshError?: unknown
}

export async function saveProductListingDraftWithWorkflowRefresh(
  payload: ProductListingDraftPayload,
  dependencies: ProductListingDraftPersistenceDependencies
): Promise<ProductListingDraftPersistenceResult> {
  const saved = await dependencies.saveDraft(payload)
  dependencies.onSaved?.(saved)
  try {
    return {
      saved,
      workflow: await dependencies.refreshWorkflow(saved.draftId)
    }
  } catch (workflowRefreshError) {
    return {
      saved,
      workflowRefreshError
    }
  }
}
