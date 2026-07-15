import assert from 'node:assert/strict'
import { productListingEditorDraftToSnapshot, type ProductListingEditorDraft } from './productDetailAdapter'

const draft: ProductListingEditorDraft = {
  storeCode: 'STR245027-NSA',
  psku: 'CASE-NEW-001',
  productFullType: 'electronic_accessories-mobile_accessories-phone_cases',
  productBrand: 'Generic',
  productBrandCode: 'generic',
  productTitleCn: '防摔手机壳',
  productTitleEn: 'Rugged phone case with kickstand',
  productTitleAr: 'Arabic phone case title',
  productDescriptionEn: 'English product description for Noon.',
  productHighlightsEn: ['Raised bezel protects the screen'],
  sizeEn: 'One Size',
  sizeAr: 'مقاس واحد',
  imageUrls: ['https://images.example.test/case-main.jpg'],
  price: 49.9,
  purchasePrice: 18.5,
  fbp: true,
  warehouseCode: 'Riyadh-FBP',
  quantity: 120,
  idWarranty: 24,
  isActive: false,
  offerNote: '选品组 PSG-91001 已完成利润测算',
  barcode: '6290000000001'
}

const snapshot = productListingEditorDraftToSnapshot(draft)

assert.equal(snapshot.mode, 'listing-draft')
assert.equal(snapshot.ready, true)
assert.equal(snapshot.storeContext.storeCode, 'STR245027-NSA')
assert.equal(snapshot.storeContext.site, 'SA')
assert.equal(snapshot.identity.partnerSku, 'CASE-NEW-001')
assert.equal(snapshot.identity.skuParent, 'CASE-NEW-001')
assert.equal(snapshot.taxonomy.productFulltype, 'electronic_accessories-mobile_accessories-phone_cases')
assert.equal(snapshot.content.titleCn, '防摔手机壳')
assert.equal(snapshot.content.titleEn, 'Rugged phone case with kickstand')
assert.deepEqual(snapshot.content.images, ['https://images.example.test/case-main.jpg'])
assert.equal(snapshot.variants[0]?.sizeEn, 'One Size')
assert.equal(snapshot.variants[0]?.sizeAr, 'مقاس واحد')
assert.equal(snapshot.pricing.price, 49.9)
assert.equal(snapshot.pricing.purchasePrice, 18.5)
assert.equal(snapshot.stock.quantity, 120)
assert.equal(snapshot.siteOffers[0]?.storeCode, 'STR245027-NSA')
assert.equal(snapshot.siteOffers[0]?.site, 'SA')
assert.equal(snapshot.siteOffers[0]?.isActive, false)
