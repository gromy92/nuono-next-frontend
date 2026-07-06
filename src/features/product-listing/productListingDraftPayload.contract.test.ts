import assert from 'node:assert/strict'
import { productListingEditorDraftToPayload, type ProductListingEditorDraft } from './productDetailAdapter'

const draft: ProductListingEditorDraft = {
  storeCode: 'STR245027-NSA',
  sourceType: 'manual_selection_group',
  sourceRefId: 91001,
  psku: 'CASE-NEW-001',
  productFullType: 'electronic_accessories-mobile_accessories-phone_cases',
  productBrand: 'Generic',
  productBrandCode: 'generic',
  productTitleCn: '防摔手机壳',
  productTitleEn: 'Rugged phone case with kickstand',
  productTitleAr: 'Arabic phone case title',
  productDescriptionCn: '中文描述草稿',
  productDescriptionEn: 'English product description for Noon.',
  productDescriptionAr: 'Arabic product description for Noon.',
  productHighlightsCn: ['中文卖点'],
  productHighlightsEn: ['Raised bezel protects the screen'],
  productHighlightsAr: ['Arabic bullet'],
  imageUrls: ['https://images.example.test/case-main.jpg'],
  price: 49.9,
  priceMin: 45,
  priceMax: 59,
  salePrice: 47.5,
  saleStart: '2026-07-06',
  saleEnd: '2026-07-16',
  purchasePrice: 18.5,
  supplyEvidenceType: 'OTHER',
  supplyEvidenceRefId: 91001,
  fbp: true,
  warehouseId: 'W00752151SA',
  warehouseCode: 'Riyadh-FBP',
  quantity: 120,
  idWarranty: 24,
  isActive: false,
  offerNote: '选品组 PSG-91001 已完成利润测算',
  barcode: '6290000000001'
}

const payload = productListingEditorDraftToPayload(draft) as Record<string, unknown>

assert.equal(payload.productTitleCn, '防摔手机壳')
assert.equal(payload.productDescriptionCn, '中文描述草稿')
assert.equal(payload.productDescriptionEn, 'English product description for Noon.')
assert.equal(payload.productDescriptionAr, 'Arabic product description for Noon.')
assert.deepEqual(payload.productHighlightsCn, ['中文卖点'])
assert.deepEqual(payload.productHighlightsEn, ['Raised bezel protects the screen'])
assert.deepEqual(payload.productHighlightsAr, ['Arabic bullet'])
assert.equal(payload.priceMin, 45)
assert.equal(payload.priceMax, 59)
assert.equal(payload.salePrice, 47.5)
assert.equal(payload.saleStart, '2026-07-06')
assert.equal(payload.saleEnd, '2026-07-16')
assert.equal(payload.isActive, false)
assert.equal(payload.offerNote, '选品组 PSG-91001 已完成利润测算')
