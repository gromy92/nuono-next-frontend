import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { navigateProductListingTargetInCurrentTab } from './listingTabNavigation'

let navigatedUrl = ''
const targetUrl = '/purchase/listing?listingSource=listing-draft&listingDraftId=10033'

assert.equal(
  navigateProductListingTargetInCurrentTab(targetUrl, (url) => {
    navigatedUrl = url
  }),
  targetUrl
)
assert.equal(navigatedUrl, targetUrl)

const productListingDir = dirname(fileURLToPath(import.meta.url))
const featuresDir = join(productListingDir, '..')
const detailSource = readFileSync(
  join(featuresDir, 'product-management/components/ProductDetailSummaryPanel.tsx'),
  'utf8'
)
const drawerSource = readFileSync(
  join(featuresDir, 'product-management/components/ProductListingDraftDrawer.tsx'),
  'utf8'
)

assert.match(detailSource, /navigateProductListingTargetInCurrentTab\(listingDraftTarget\)/)
assert.doesNotMatch(detailSource, /openProductListingTargetInNewTab\(listingDraftTarget\)/)
assert.match(drawerSource, /navigateProductListingTargetInCurrentTab/)
