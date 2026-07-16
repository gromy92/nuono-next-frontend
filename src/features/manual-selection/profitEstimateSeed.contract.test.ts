import assert from 'node:assert/strict'
import { createManualSelectionProfitEstimateSeed } from './profitEstimateSeed'
import type { ManualSelectionAnalysisProjectView } from './types'
import type { ProductSelectionSourceCollection } from '../source-collection/types'

function sourceRecord(id: string, priceSummary?: string): ProductSelectionSourceCollection {
  return {
    id,
    collectionNo: `PSC-${id}`,
    storeCode: 'STR245027-NSA',
    siteCode: 'SA',
    sourceType: 'marketplace-url',
    collectionSource: 'plugin',
    sourcePlatform: 'Noon',
    sourceUrl: `https://www.noon.com/saudi-en/item-${id}/p/`,
    pageUrl: `https://www.noon.com/saudi-en/item-${id}/p/`,
    sourceTitle: `Noon competitor ${id}`,
    sourceImageUrl: '',
    imageUrls: [],
    priceSummary,
    specHints: [],
    status: 'success',
    statusText: '采集成功',
    collectedAt: '2026-06-25 10:00:00',
    collectedBy: '插件',
    collectedFieldCount: 10,
    imageCount: 1
  }
}

function projectFixture(overrides: Partial<ManualSelectionAnalysisProjectView> = {}): ManualSelectionAnalysisProjectView {
  return {
    projectId: '91016',
    groupId: '91016',
    projectName: 'iPhone 15 透明软边基础款',
    projectMaterialCount: 2,
    procurement: {
      ali1688PurchaseUrl: '',
      purchasePriceRmb: undefined,
      purchasePrice: undefined,
      status: 'missing'
    },
    competitors: [
      {
        id: 'c-1',
        fetchStatus: 'success',
        fetchedTitle: 'Amazon iPhone 15 clear case',
        fetchedPriceSummary: 'SAR 22.90'
      },
      {
        id: 'c-2',
        fetchStatus: 'success',
        fetchedTitle: 'Noon iPhone 15 clear case',
        fetchedPriceSummary: 'SAR 19.85'
      },
      {
        id: 'c-3',
        fetchStatus: 'failed',
        fetchedTitle: 'Failed competitor',
        fetchedPriceSummary: ''
      }
    ],
    items: [],
    records: [
      sourceRecord('r-1', 'SAR 29.99'),
      sourceRecord('r-2', 'SAR 24.50')
    ],
    ...overrides
  }
}

const seedWithoutProcurement = createManualSelectionProfitEstimateSeed(projectFixture())

assert.equal(seedWithoutProcurement.salePrice, 19.85)
assert.equal(seedWithoutProcurement.purchasePrice, undefined)
assert.equal(seedWithoutProcurement.title, 'iPhone 15 透明软边基础款')
assert.deepEqual(seedWithoutProcurement.competitors?.map((item) => item.id), ['c-1', 'c-2', 'c-3'])

const seedWithProcurement = createManualSelectionProfitEstimateSeed(projectFixture({
  procurement: {
    ali1688PurchaseUrl: 'https://detail.1688.com/offer/123.html',
    purchasePriceRmb: 12.8,
    purchasePrice: undefined,
    status: 'active'
  }
}))

assert.equal(seedWithProcurement.purchasePrice, 12.8)
assert.equal(seedWithProcurement.ali1688Url, 'https://detail.1688.com/offer/123.html')
