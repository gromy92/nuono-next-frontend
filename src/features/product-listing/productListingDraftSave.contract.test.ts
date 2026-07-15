import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const pageSource = readFileSync(new URL('./ProductListingPage.tsx', import.meta.url), 'utf8')
const adapterSource = readFileSync(new URL('./productDetailAdapter.ts', import.meta.url), 'utf8')

assert(
  adapterSource.includes("sourceRefId: optionalInteger(draft.sourceRefId)"),
  'product listing payload should preserve sourceRefId from the editor draft'
)
assert(
  pageSource.includes('...listingDraftRef.current') && pageSource.includes('...form.getFieldsValue()'),
  'product listing save should merge hidden metadata form values over the current editor draft'
)
assert(
  pageSource.includes('productListingEditorDraftToPayload(currentDraft, draftView?.draftId)'),
  'product listing save should serialize the normalized editor draft payload'
)
assert(
  adapterSource.includes('ensureProductListingEditorDraftPsku') &&
    !pageSource.includes('ensureProductListingEditorDraftPsku(baseDraft)') &&
    pageSource.includes('PRODUCT_LISTING_REAL_RUN_PSKU_REQUIRED_MESSAGE'),
  'manual-selection listing should not auto-generate a test PSKU when the operator clicks listing'
)
assert(
  pageSource.includes('PRODUCT_LISTING_DRAFT_SAVE_MESSAGE_KEY') &&
    pageSource.includes('draftSaveNotice') &&
    pageSource.includes("setDraftSaveNotice({ type: 'info'") &&
    pageSource.includes('message.loading({') &&
    pageSource.includes("setDraftSaveNotice({ type: 'success'") &&
    pageSource.includes("setDraftSaveNotice({ type: 'error'") &&
    pageSource.includes('product-listing-draft-save-feedback'),
  'manual listing draft save should show immediate saving, success and failure feedback instead of relying on a silent button click'
)
