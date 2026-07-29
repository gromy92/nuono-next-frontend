import assert from 'node:assert/strict'
import { saveProductListingDraftWithWorkflowRefresh } from './productListingDraftPersistence'
import type {
  ProductListingDraftPayload,
  ProductListingDraftView
} from './types'

const savedDraft: ProductListingDraftView = {
  draftId: 10033,
  draftNo: 'PLD-10033',
  storeCode: 'STR245027-NSA',
  status: 'draft',
  validationIssues: [],
  draft: {
    draftId: 10033,
    storeCode: 'STR245027-NSA',
    psku: 'PSKU-10033',
    imageUrls: []
  }
}
const refreshError = new Error('workflow unavailable')
let saveCalls = 0
let refreshCalls = 0
let observedSavedDraft: ProductListingDraftView | undefined

const result = await saveProductListingDraftWithWorkflowRefresh(
  { storeCode: 'STR245027-NSA', psku: 'PSKU-10033' } as ProductListingDraftPayload,
  {
    saveDraft: async () => {
      saveCalls += 1
      return savedDraft
    },
    refreshWorkflow: async () => {
      refreshCalls += 1
      throw refreshError
    },
    onSaved: (saved) => {
      observedSavedDraft = saved
    }
  }
)

assert.equal(saveCalls, 1)
assert.equal(refreshCalls, 1)
assert.equal(observedSavedDraft, savedDraft)
assert.equal(result.saved, savedDraft)
assert.equal(result.workflow, undefined)
assert.equal(result.workflowRefreshError, refreshError)

const staleWorkflowResult = await saveProductListingDraftWithWorkflowRefresh(
  { storeCode: 'STR245027-NSA', psku: 'PSKU-10033' } as ProductListingDraftPayload,
  {
    saveDraft: async () => savedDraft,
    refreshWorkflow: async () => undefined
  }
)

assert.equal(staleWorkflowResult.saved, savedDraft)
assert.equal(staleWorkflowResult.workflow, undefined)
assert.equal(
  staleWorkflowResult.workflowRefreshError,
  undefined,
  'a stale or unapplied workflow response must preserve the successful draft save without inventing a POST failure'
)
