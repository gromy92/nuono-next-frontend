import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { openProductListingTargetInNewTab } from './listingTabNavigation'

const productListingDir = dirname(fileURLToPath(import.meta.url))
const featuresDir = join(productListingDir, '..')

function source(path: string) {
  return readFileSync(join(featuresDir, path), 'utf8')
}

const draftDrawerSource = source('./product-management/components/ProductListingDraftDrawer.tsx')
const manualSelectionSource = source('./manual-selection/listingNavigation.ts')

assert.doesNotMatch(
  draftDrawerSource,
  /window\.location\.assign\(withCurrentWorkspaceDevQuery\(`\$\{PURCHASE_LISTING_PATH\}/,
  '上架草稿继续编辑不能替换当前页，必须打开新标签页'
)

assert.match(
  draftDrawerSource,
  /openProductListingTargetInNewTab/,
  '上架草稿继续编辑必须复用统一新标签页工具'
)

assert.match(
  manualSelectionSource,
  /openProductListingTargetInNewTab/,
  '人工选品进入商品上架必须复用统一新标签页工具'
)

let openedUrl = ''
let openedTarget = ''
let openedFeatures = ''
const didOpen = openProductListingTargetInNewTab('/purchase/listing?listingSource=test', (url, target, features) => {
  openedUrl = url
  openedTarget = target || ''
  openedFeatures = features || ''
  return {} as Window
})

assert.equal(didOpen, true)
assert.equal(openedUrl, '/purchase/listing?listingSource=test')
assert.equal(openedTarget, '_blank')
assert.match(openedFeatures, /noopener/)
assert.match(openedFeatures, /noreferrer/)
