import assert from 'node:assert/strict'
import * as sourcePrefill from './sourcePrefill'
import { hydrateProductListingSourcePrefill } from './sourcePrefillHydration'
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
    categoryName: 'Phone Cases',
    categoryPath: 'Electronics > Mobiles > Phone Cases',
    categoryUrl: 'https://www.noon.com/saudi-en/electronics/mobiles/phone-cases/',
    categoryLinks: [
      {
        name: 'Phone Cases',
        path: 'Electronics > Mobiles > Phone Cases',
        url: 'https://www.noon.com/saudi-en/electronics/mobiles/phone-cases/'
      }
    ],
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
      fetchedCategoryName: 'Phone Cases',
      fetchedCategoryPath: 'Electronics / Mobiles / Cases',
      fetchedCategoryUrl: 'https://www.noon.com/saudi-en/mobiles-accessories/c/',
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

const displayOnlyProfitEstimate: ManualSelectionGroupProfitEstimateSnapshot = {
  groupId: '91001',
  status: 'saved',
  snapshot: {
    selectedCategory: {
      value: 'Kitchen Utensils & Gadgets',
      label: 'Kitchen Utensils & Gadgets'
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
assert.equal(prefill.competitorMaterials[0]?.categoryName, 'Phone Cases')
assert.equal(prefill.competitorMaterials[0]?.categoryLinks?.length, 1)
assert.equal(prefill.competitorMaterials[1]?.categoryPath, 'Electronics / Mobiles / Cases')
assert.equal(prefill.competitorMaterials[1]?.categoryUrl, 'https://www.noon.com/saudi-en/mobiles-accessories/c/')

const displayOnlyPrefill = (buildFromGroup as Function)(group, 'STR245027-NSA', displayOnlyProfitEstimate)

assert.equal(displayOnlyPrefill.draft.productFullType, '')

const hydrated = await hydrateProductListingSourcePrefill({
  source: 'manual-selection',
  sourceGroupId: '91001',
  pendingServerHydration: true,
  draft: {}
}, 'STR245027-NSA', {
  loadManualSelectionGroup: async (groupId) => {
    assert.equal(groupId, '91001')
    return group
  },
  loadManualSelectionGroupProfitEstimate: async (groupId) => {
    assert.equal(groupId, '91001')
    return profitEstimate
  }
})

assert.equal(hydrated.pendingServerHydration, undefined)
assert.equal(hydrated.sourceGroupNo, 'PSG-91001')
assert.equal(hydrated.draft.productFullType, 'electronic_accessories-mobile_accessories-phone_cases')
assert.equal(hydrated.competitorMaterials?.length, 2)
assert.equal(hydrated.competitorMaterials?.[1]?.categoryName, 'Phone Cases')

const draftHydrated = await hydrateProductListingSourcePrefill({
  source: 'listing-draft',
  sourceDraftId: '12001',
  pendingServerHydration: true,
  draft: {}
}, 'STR245027-NSA', {
  fetchProductListingDraft: async (draftId) => {
    assert.equal(draftId, 12001)
    return {
      draftId,
      draftNo: 'PLD-12001',
      storeCode: 'STR245027-NSA',
      status: 'ready_for_dry_run',
      validationIssues: [],
      draft: {
        draftId,
        storeCode: 'STR245027-NSA',
        psku: 'CASE-DRAFT-001',
        productFullType: 'Kitchen Utensils & Gadgets',
        productTitleEn: 'Recovered listing draft title',
        imageUrls: [],
        competitorMaterials: [
          {
            id: 'noon-zsku-1',
            sourceHost: 'Noon',
            externalSku: 'ZCOMPETITOR1',
            titleEn: 'Competitor title from saved draft',
            sellingPointsEn: ['Competitor point']
          }
        ]
      }
    }
  }
})

assert.equal(draftHydrated.source, 'listing-draft')
assert.equal(draftHydrated.sourceDraftId, '12001')
assert.equal(draftHydrated.competitorMaterials?.length, 1)
assert.equal(draftHydrated.competitorMaterials?.[0]?.titleEn, 'Competitor title from saved draft')
assert.equal(draftHydrated.draft.competitorMaterials?.length, 1)
assert.equal(draftHydrated.draft.productFullType, '')

const legacyDraftHydrated = await hydrateProductListingSourcePrefill({
  source: 'listing-draft',
  sourceDraftId: '12002',
  pendingServerHydration: true,
  draft: {}
}, 'STR245027-NSA', {
  fetchProductListingDraft: async (draftId) => {
    assert.equal(draftId, 12002)
    return {
      draftId,
      draftNo: 'PLD-12002',
      storeCode: 'STR245027-NSA',
      status: 'ready_for_dry_run',
      validationIssues: [],
      draft: {
        draftId,
        storeCode: 'STR245027-NSA',
        sourceType: 'manual_selection_group',
        sourceRefId: 91001,
        psku: 'CASE-LEGACY-DRAFT-001',
        productTitleEn: 'Legacy draft before competitor materials were persisted',
        imageUrls: []
      }
    }
  },
  loadManualSelectionGroup: async (groupId) => {
    assert.equal(groupId, '91001')
    return group
  }
})

assert.equal(legacyDraftHydrated.draft.productTitleEn, 'Legacy draft before competitor materials were persisted')
assert.equal(legacyDraftHydrated.competitorMaterials?.length, 2)
assert.equal(legacyDraftHydrated.draft.competitorMaterials?.length, 2)

const categoryRefreshedDraft = await hydrateProductListingSourcePrefill({
  source: 'listing-draft',
  sourceDraftId: '12003',
  pendingServerHydration: true,
  draft: {}
}, 'STR245027-NSA', {
  fetchProductListingDraft: async (draftId) => ({
    draftId,
    draftNo: 'PLD-12003',
    storeCode: 'STR245027-NSA',
    status: 'ready_for_dry_run',
    validationIssues: [],
    draft: {
      draftId,
      storeCode: 'STR245027-NSA',
      sourceType: 'manual_selection_group',
      sourceRefId: 91001,
      psku: 'CASE-CATEGORY-REFRESH-001',
      imageUrls: [],
      competitorMaterials: [
        {
          id: '86001',
          titleEn: 'Saved title that must not be replaced'
        }
      ]
    }
  }),
  loadManualSelectionGroup: async () => group
})

assert.equal(categoryRefreshedDraft.competitorMaterials?.[0]?.titleEn, 'Saved title that must not be replaced')
assert.equal(categoryRefreshedDraft.competitorMaterials?.[0]?.categoryName, 'Phone Cases')
assert.equal(categoryRefreshedDraft.competitorMaterials?.[0]?.categoryLinks?.length, 1)

const unchanged = await hydrateProductListingSourcePrefill({
  source: 'manual-selection',
  sourceGroupId: '91002',
  draft: { productTitleCn: 'Already hydrated' }
}, 'STR245027-NSA')

assert.equal(unchanged.draft.productTitleCn, 'Already hydrated')
