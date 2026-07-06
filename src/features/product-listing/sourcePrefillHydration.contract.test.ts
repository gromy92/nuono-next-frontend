import assert from 'node:assert/strict'
import * as sourcePrefill from './sourcePrefill'
import type { ManualSelectionGroupView, ManualSelectionGroupProfitEstimateSnapshot } from '../manual-selection/types'
import type { ProductSelectionSourceCollection } from '../source-collection/types'

function sourceRecord(id: string): ProductSelectionSourceCollection {
  return {
    id,
    collectionNo: `PSC-${id}`,
    storeCode: 'STR245027-NSA',
    siteCode: 'SA',
    sourceType: 'marketplace-url',
    collectionSource: 'plugin',
    sourcePlatform: 'Noon',
    sourceUrl: `https://www.noon.com/saudi-en/source-${id}/p/`,
    pageUrl: `https://www.noon.com/saudi-en/source-${id}/p/`,
    sourceTitle: `Rugged phone case ${id}`,
    sourceTitleCn: `防摔手机壳 ${id}`,
    sourceTitleAr: `Arabic title ${id}`,
    sourceDescriptionEn: `English description ${id}`,
    sourceDescriptionAr: `Arabic description ${id}`,
    sourceSellingPointsEn: [`English selling point ${id}`],
    sourceSellingPointsAr: [`Arabic selling point ${id}`],
    sourceImageUrl: `https://images.example.test/${id}.jpg`,
    imageUrls: [`https://images.example.test/${id}-detail.jpg`],
    priceSummary: 'SAR 78.00',
    specHints: [],
    status: 'success',
    statusText: '采集成功',
    collectedAt: '2026-07-06 10:00:00',
    collectedBy: '插件',
    collectedFieldCount: 10,
    imageCount: 2
  }
}

const group: ManualSelectionGroupView = {
  groupId: '91001',
  groupNo: 'PSG-91001',
  groupName: '防摔手机壳组合',
  siteCode: 'SA',
  status: 'active',
  materialCount: 1,
  materials: [
    {
      materialId: '92001',
      groupId: '91001',
      sourceCollectionId: '86001',
      status: 'active',
      sourceCollection: sourceRecord('86001')
    }
  ],
  procurement: {
    ali1688PurchaseUrl: 'https://detail.1688.com/offer/1001.html',
    purchasePriceRmb: 18.5,
    purchasePrice: 18.5,
    status: 'active'
  },
  competitors: [
    {
      id: '93001',
      url: 'https://www.noon.com/saudi-en/competitor/p/',
      fetchStatus: 'success',
      fetchedTitle: 'Competitor case title',
      fetchedDescriptionEn: 'Competitor English description',
      fetchedSellingPointsEn: ['Competitor selling point'],
      fetchedSourceHost: 'noon',
      fetchedAt: '2026-07-06 10:10:00'
    }
  ]
}

const profitEstimate: ManualSelectionGroupProfitEstimateSnapshot = {
  groupId: '91001',
  status: 'saved',
  snapshot: {
    selectedCategory: {
      value: 'electronic_accessories-mobile_accessories-phone_cases',
      label: 'Phone cases'
    }
  }
}

const buildFromGroup = (sourcePrefill as Record<string, unknown>).buildManualSelectionGroupListingPrefillFromGroup
assert.equal(typeof buildFromGroup, 'function')

const prefill = (buildFromGroup as Function)(group, 'STR245027-NSA', profitEstimate)

assert.equal(prefill.source, 'manual-selection')
assert.equal(prefill.sourceGroupId, '91001')
assert.equal(prefill.sourceGroupNo, 'PSG-91001')
assert.equal(prefill.collectionNo, 'PSG-91001')
assert.equal(prefill.sourceTitleCn, '防摔手机壳组合')
assert.equal(prefill.draft.storeCode, 'STR245027-NSA')
assert.equal(prefill.draft.productTitleCn, '防摔手机壳组合')
assert.equal(prefill.draft.productTitleEn, 'Rugged phone case 86001')
assert.equal(prefill.draft.productDescriptionEn, 'English description 86001')
assert.deepEqual(prefill.draft.productHighlightsEn, ['English selling point 86001'])
assert.equal(prefill.draft.productFullType, 'electronic_accessories-mobile_accessories-phone_cases')
assert.equal(prefill.draft.purchasePrice, 18.5)
assert.equal(prefill.draft.sourceType, 'manual_selection_group')
assert.equal(prefill.draft.sourceRefId, 91001)
assert.equal(prefill.competitorMaterials.length, 2)
