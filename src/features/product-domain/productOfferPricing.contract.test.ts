import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { collectProductOfferPricingValidationIssues } from './productOfferPricing'

const moduleSource = readFileSync('src/features/product-domain/productOfferPricing.ts', 'utf8')
assert.doesNotMatch(moduleSource, /product-management/, 'product Offer pricing must remain a leaf domain Module')

const saleNotLowerIssues = collectProductOfferPricingValidationIssues(
  {
    price: '59.99',
    salePrice: '59.99',
    priceMin: '20',
    priceMax: '60'
  },
  '当前站点'
)

assert.deepEqual(
  saleNotLowerIssues.map((issue) => [issue.fieldKey, issue.code, issue.message]),
  [['salePrice', 'sale_price_must_be_lower_than_price', '当前站点的售价必须小于原价。']]
)

const priceRangeIssues = collectProductOfferPricingValidationIssues(
  {
    price: '60.01',
    salePrice: '19.99',
    priceMin: '20',
    priceMax: '60'
  },
  '当前站点'
)

assert.deepEqual(
  priceRangeIssues.map((issue) => [issue.fieldKey, issue.code, issue.message]),
  [
    ['price', 'price_above_max', '当前站点的原价必须在最低价和最高价之间。'],
    ['salePrice', 'sale_price_below_min', '当前站点的售价必须在最低价和最高价之间。']
  ]
)

assert.deepEqual(
  collectProductOfferPricingValidationIssues(
    {
      price: '1,299.99',
      salePrice: '999.99',
      priceMin: '900',
      priceMax: '1,300'
    },
    '当前站点'
  ),
  [],
  'product offer amounts must preserve comma-separated numeric input semantics'
)

const oldModulePath = 'src/features/product-management/utils/offerPricingValidation.ts'
assert.equal(existsSync(oldModulePath), false, 'product-management must not retain an Offer pricing Adapter')

const callers = [
  'src/features/product-listing/productListingDraftCompleteness.ts',
  'src/features/product-management/components/ProductOfferPricingSection.tsx',
  'src/features/product-management/utils/fieldDomainIssues.ts'
]

callers.forEach((filePath) => {
  const source = readFileSync(filePath, 'utf8')
  assert.match(source, /product-domain\/productOfferPricing/, `${filePath} must use the product Offer pricing Seam`)
  assert.doesNotMatch(source, /utils\/offerPricingValidation/, `${filePath} must not use the old Module`)
})
