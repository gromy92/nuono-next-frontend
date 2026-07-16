import assert from 'node:assert/strict'
import {
  PRODUCT_LISTING_DRAFT_REQUIRED_FIELD_KEYS,
  collectProductListingDraftCompletenessIssues,
  productListingDraftProgress
} from './productListingDraftCompleteness'
import { createProductListingEditorDraft, productListingEditorDraftDomains } from './productDetailAdapter'

const missingDraft = createProductListingEditorDraft()
const issues = collectProductListingDraftCompletenessIssues(missingDraft)
const requiredIssueKeys = issues.filter((item) => item.severity === 'error').map((item) => item.fieldKey)

assert.deepEqual(PRODUCT_LISTING_DRAFT_REQUIRED_FIELD_KEYS, [
  'storeCode',
  'psku',
  'productFullType',
  'productTitleEn',
  'price',
  'purchasePrice',
  'supplyEvidenceType'
])
assert(requiredIssueKeys.includes('purchasePrice'))
assert(requiredIssueKeys.includes('supplyEvidenceType'))
assert(!requiredIssueKeys.includes('imageUrls'), 'listing images are optional for upload')
assert(!requiredIssueKeys.includes('quantity'), 'empty quantity is not a blocking field')

const invalidQuantityIssues = collectProductListingDraftCompletenessIssues({
  ...missingDraft,
  quantity: 0
})
assert(
  invalidQuantityIssues.some((item) => item.fieldKey === 'quantity' && item.code === 'invalid_number'),
  'quantity is optional but must be positive when present'
)

const domains = productListingEditorDraftDomains(missingDraft)
assert(domains.site.issues.some((item) => item.includes('采购成本')))
assert(domains.site.issues.some((item) => item.includes('供货证据')))

const progress = productListingDraftProgress({
  ...missingDraft,
  storeCode: 'STR245027-NAE',
  psku: 'NUONO-TEST-001',
  productFullType: 'beauty-tools',
  productTitleEn: 'Beauty tools set',
  imageUrls: [],
  price: 39.9,
  purchasePrice: 12.3,
  supplyEvidenceType: '1688_OFFER'
})

assert.equal(progress.done, progress.total)
