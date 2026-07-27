import assert from 'node:assert/strict'
import {
  applyProductListingWorkflowRefresh,
  type ProductListingWorkflowClientState
} from './productListingWorkflowClientState'

const state: ProductListingWorkflowClientState = {
  editorDraft: {
    draftId: 1001,
    storeCode: 'STR108065-NSA',
    psku: 'PSKU-1001',
    productTitleEn: 'Unsaved local title',
    imageUrls: []
  },
  workflow: {
    phase: 'EDITING',
    writeCertainty: 'NOT_STARTED',
    nextAction: 'REVIEW_DRAFT'
  }
}

const refreshed = applyProductListingWorkflowRefresh(state, {
  phase: 'EDITING',
  writeCertainty: 'NOT_STARTED',
  nextAction: 'REVIEW_DRAFT',
  draft: {
    draftId: 1001,
    storeCode: 'STR108065-NSA',
    status: 'draft',
    validationIssues: [],
    draft: {
      storeCode: 'STR108065-NSA',
      psku: 'PSKU-1001',
      productTitleEn: 'Older persisted title',
      imageUrls: []
    }
  }
})

assert.equal(refreshed.workflow.draft?.draftId, 1001)
assert.equal(refreshed.editorDraft.productTitleEn, 'Unsaved local title')
assert.equal(
  refreshed.editorDraft,
  state.editorDraft,
  'focus, pageshow, and polling refreshes must preserve the editor object'
)
