import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  createProductListingEditorDraft,
  normalizeProductListingEditorDraft,
  productListingEditorDraftToPayload,
  type ProductListingEditorDraft
} from './productDetailAdapter'

const newDraft = createProductListingEditorDraft('STR245027-NSA') as Record<string, unknown>
assert.equal('fbp' in newDraft, false, 'new drafts must not default an unsupported FBP mode')

const legacyDraft = normalizeProductListingEditorDraft({
  storeCode: 'STR245027-NSA',
  psku: 'LEGACY-001',
  imageUrls: [],
  fbp: true,
  warehouseId: 'W00752151SA',
  warehouseCode: 'Riyadh-FBP',
  quantity: 120
} as Partial<ProductListingEditorDraft>)
const payload = productListingEditorDraftToPayload(legacyDraft) as Record<string, unknown>

for (const field of ['fbp', 'warehouseId', 'warehouseCode', 'quantity']) {
  assert.equal(field in legacyDraft, false, `legacy ${field} must be removed during hydration`)
  assert.equal(field in payload, false, `${field} must not be sent to the listing API`)
}

const editorSource = readFileSync(new URL('./ProductListingDetailEditor.tsx', import.meta.url), 'utf8')
const offerTabSource = readFileSync(
  new URL('../product-editor/ProductOfferTab.tsx', import.meta.url),
  'utf8'
)

assert(
  !editorSource.includes('offerStockSection=') &&
    offerTabSource.includes('{offerStockSection ? (') &&
    offerTabSource.includes('{offerStockSection}'),
  'the listing editor must omit the management-owned inventory slot that Noon listing does not write'
)
