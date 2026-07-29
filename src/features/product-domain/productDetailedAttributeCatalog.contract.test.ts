import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import {
  PRODUCT_DETAILED_ATTRIBUTE_GROUPS,
  PRODUCT_DETAILED_ATTRIBUTE_VALUE_LABELS
} from './productDetailedAttributeCatalog'

assert.deepEqual(
  PRODUCT_DETAILED_ATTRIBUTE_GROUPS.map((group) => group.key),
  ['product-detail', 'identifiers', 'shipping', 'finance'],
  'fallback catalog must preserve the four Noon detailed attribute groups and ordering'
)

const fields = PRODUCT_DETAILED_ATTRIBUTE_GROUPS.flatMap((group) => group.fields)
const fieldCodes = fields.map((field) => field.code)
assert.equal(new Set(fieldCodes).size, fieldCodes.length, 'fallback detailed attribute codes must remain unique')
assert.equal(
  PRODUCT_DETAILED_ATTRIBUTE_GROUPS[0]?.officialGroupNames[0],
  'Product Detail',
  'listing defaults use the first official group name'
)
assert.deepEqual(
  PRODUCT_DETAILED_ATTRIBUTE_GROUPS[2]?.fields.map((field) => field.code),
  ['shipping_height', 'shipping_length', 'shipping_weight', 'shipping_width_depth'],
  'shipping fallback field ordering is part of the listing and editor Interface'
)
assert(fieldCodes.includes('base_material'))
assert(fieldCodes.includes('whats_in_the_box'))
assert(fieldCodes.includes('shipping_weight'))
assert(fieldCodes.includes('vat_rate_sa'))
assert.deepEqual(PRODUCT_DETAILED_ATTRIBUTE_VALUE_LABELS.plastic, {
  en: 'Plastic',
  ar: 'بلاستيك',
  zh: '塑料'
})

const moduleSource = readFileSync('src/features/product-domain/productDetailedAttributeCatalog.ts', 'utf8')
assert.doesNotMatch(moduleSource, /product-management/, 'detailed attribute catalog must remain a leaf domain Module')
assert.equal(
  existsSync('src/features/product-management/productDetailedContentConfig.ts'),
  false,
  'product-management must not retain a detailed attribute catalog Adapter'
)

const callers = [
  'src/features/product-listing/productDetailAdapter.ts',
  'src/features/product-editor/ProductAttributeFieldControl.tsx',
  'src/features/product-editor/productAttributeTemplate.ts'
]

callers.forEach((filePath) => {
  const source = filePath.endsWith('productDetailAdapter.ts')
    ? [
        filePath,
        'src/features/product-listing/productDetailAdapterNormalization.ts'
      ].map((path) => readFileSync(path, 'utf8')).join('\n')
    : readFileSync(filePath, 'utf8')
  assert.match(
    source,
    /product-domain\/productDetailedAttributeCatalog/,
    `${filePath} must use the product detailed attribute catalog Seam`
  )
  assert.doesNotMatch(source, /productDetailedContentConfig/, `${filePath} must not use the old Module`)
})
