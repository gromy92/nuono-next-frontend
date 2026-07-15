import assert from 'node:assert/strict'
import { buildProductListingChangeSummary } from './productListingChangeSummary'
import type { ProductListingDraftPayload } from './types'

const baseline: ProductListingDraftPayload = {
  storeCode: 'STR245027-NSA',
  psku: 'CASE-001',
  productFullType: 'electronics-accessories-phone_cases',
  productBrand: 'Generic',
  productTitleEn: 'Plain phone case',
  imageUrls: ['https://example.test/old-main.jpg'],
  price: 49.9,
  purchasePrice: 18,
  supplyEvidenceType: 'OTHER',
  isActive: true
}

const changes = buildProductListingChangeSummary(
  {
    ...baseline,
    productTitleEn: 'Rugged phone case with stand',
    imageUrls: ['https://example.test/old-main.jpg', 'https://example.test/detail.jpg'],
    salePrice: 45,
    isActive: false,
    barcode: '6290000000001'
  },
  baseline
)

assert.deepEqual(
  changes.map((change) => change.fieldKey),
  ['productTitleEn', 'imageUrls', 'salePrice', 'isActive', 'barcode']
)
assert.equal(changes[0].before, 'Plain phone case')
assert.equal(changes[0].after, 'Rugged phone case with stand')
assert.equal(changes[1].before, '1 张')
assert.equal(changes[1].after, '2 张')
assert.equal(changes[3].before, '启用')
assert.equal(changes[3].after, '停用')

const firstSubmitChanges = buildProductListingChangeSummary(
  {
    storeCode: 'STR245027-NSA',
    psku: 'CASE-002',
    productTitleEn: 'New listing title',
    imageUrls: ['https://example.test/main.jpg'],
    price: 39.9
  },
  undefined
)

assert.deepEqual(
  firstSubmitChanges.map((change) => change.fieldKey),
  ['storeCode', 'psku', 'productTitleEn', 'imageUrls', 'price']
)
assert(firstSubmitChanges.every((change) => change.before === '-'))

const defaultTemplateOnlyChanges = buildProductListingChangeSummary(
  {
    storeCode: 'STR245027-NSA',
    keyAttributes: [
      { code: 'base_material', label: 'Base Material' },
      { code: 'care_instructions', label: 'Care Instructions', commonValue: '' },
      { code: 'barcode', label: 'Barcode', commonValue: 'test1101' }
    ],
    fbp: true,
    isActive: true,
    barcode: 'test1101'
  },
  {
    storeCode: 'STR245027-NSA'
  }
)

assert.deepEqual(
  defaultTemplateOnlyChanges.map((change) => change.fieldKey),
  ['barcode'],
  'change summary should ignore empty key attribute templates and default listing switches'
)
assert.equal(defaultTemplateOnlyChanges[0].after, 'test1101')

const filledAttributeChanges = buildProductListingChangeSummary(
  {
    storeCode: 'STR245027-NSA',
    keyAttributes: [
      { code: 'base_material', label: 'Base Material', commonValue: 'TPU' },
      { code: 'care_instructions', label: 'Care Instructions', commonValue: '' },
      { code: 'barcode', label: 'Barcode', commonValue: 'test1102' }
    ]
  },
  {
    storeCode: 'STR245027-NSA'
  }
)

assert.deepEqual(filledAttributeChanges.map((change) => change.fieldKey), ['keyAttributes'])
assert.equal(filledAttributeChanges[0].after, '1 个')
