import assert from 'node:assert/strict'
import {
  normalizeProductListingEditorDraft,
  productListingEditorDraftToPayload,
  productListingEditorDraftToSnapshot,
  updateProductListingKeyAttributeField,
  type ProductListingEditorDraft
} from './productDetailAdapter'

const withColor = updateProductListingKeyAttributeField([], 'colour_name', 'enValue', 'Black')
const withBarcode = normalizeProductListingEditorDraft({
  storeCode: 'STR245027-NSA',
  psku: 'CASE-NEW-001',
  barcode: '6290000000001',
  keyAttributes: withColor
})

const payload = productListingEditorDraftToPayload(withBarcode)
const snapshot = productListingEditorDraftToSnapshot(withBarcode, 306)

assert(
  Array.isArray(payload.keyAttributes) && payload.keyAttributes.some((item) => item.code === 'colour_name'),
  'listing draft payload should keep edited official key attributes'
)
assert(
  payload.keyAttributes?.some((item) => item.code === 'barcode' && item.commonValue === '6290000000001'),
  'listing draft payload should mirror barcode into the barcode key attribute'
)
assert(
  snapshot.keyAttributes.some((item) => item.code === 'colour_name'),
  'listing snapshot should expose official template attributes in the Content tab'
)
assert.equal(snapshot.storeContext.ownerUserId, 306)

const withoutBarcode = normalizeProductListingEditorDraft({
  ...withBarcode,
  barcode: ''
})
const payloadWithoutBarcode = productListingEditorDraftToPayload(withoutBarcode)
const snapshotWithoutBarcode = productListingEditorDraftToSnapshot(withoutBarcode, 306)
const clearedBarcodeAttribute = payloadWithoutBarcode.keyAttributes?.find((item) => item.code === 'barcode')

assert.equal(payloadWithoutBarcode.barcode, undefined)
assert.equal(clearedBarcodeAttribute?.commonValue, '')
assert.equal(clearedBarcodeAttribute?.enValue, '')
assert.equal(clearedBarcodeAttribute?.arValue, '')
assert.equal(snapshotWithoutBarcode.identity.barcode, '')
assert.equal(snapshotWithoutBarcode.pricing.barcode, '')

const updated = updateProductListingKeyAttributeField(
  (withBarcode as ProductListingEditorDraft).keyAttributes,
  'colour_name',
  'arValue',
  'أسود'
)
assert(
  updated.some((item) => item.code === 'colour_name' && item.enValue === 'Black' && item.arValue === 'أسود'),
  'key attribute editing should preserve existing values while updating the requested field'
)
