import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { buildProductDetailListingTarget } from './utils/productDetailListingNavigation'

const originalWindow = globalThis.window
Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: {
    location: {
      search: '?devSession=1&grantPurchase=1&devStore=STR108065-NAE&devSite=AE'
    }
  }
})

try {
  const target = buildProductDetailListingTarget({
    mode: 'listing-draft',
    ready: true,
    warnings: [],
    missingCoreTables: [],
    storeContext: { storeCode: 'STR245027-NSA' },
    identity: { listingDraftId: 10068 },
    taxonomy: {},
    content: {},
    platformSignals: {},
    keyAttributes: [],
    group: {},
    variants: [],
    pricing: {},
    stock: {},
    siteOffers: []
  })

  assert.ok(target?.startsWith('/purchase/listing?'))
  assert.match(target ?? '', /listingSource=listing-draft/)
  assert.match(target ?? '', /listingDraftId=10068/)
  assert.match(target ?? '', /devStore=STR245027-NSA/)
  assert.match(target ?? '', /devSite=SA/)

  globalThis.window.location.search = ''
  const productionTarget = buildProductDetailListingTarget({
    mode: 'listing-draft',
    ready: true,
    warnings: [],
    missingCoreTables: [],
    storeContext: { storeCode: 'STR245027-NSA' },
    identity: { listingDraftId: 10068 },
    taxonomy: {},
    content: {},
    platformSignals: {},
    keyAttributes: [],
    group: {},
    variants: [],
    pricing: {},
    stock: {},
    siteOffers: []
  })
  const productionParams = new URLSearchParams(
    productionTarget?.split('?')[1]
  )
  assert.equal(productionParams.get('listingDraftId'), '10068')
  assert.equal(productionParams.get('listingSource'), 'listing-draft')
  assert.equal(productionParams.has('devSession'), false)
} finally {
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: originalWindow
  })
}

const summaryPanelSource = readFileSync(
  new URL('./components/ProductDetailSummaryPanel.tsx', import.meta.url),
  'utf8'
)

assert.match(
  summaryPanelSource,
  /productNotReadyForCurrentPublish\s*\?\s*'上架'/,
  '尚未成功上架的商品必须在查看详情中显示唯一的上架入口'
)
assert.match(
  summaryPanelSource,
  /buildProductDetailListingTarget\(productSnapshotView\)/,
  '详情内上架必须恢复当前商品关联的原上架草稿'
)
