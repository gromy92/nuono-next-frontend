import assert from 'node:assert/strict'
import * as sourcePrefill from './sourcePrefill'
import { hydrateProductListingSourcePrefill } from './sourcePrefillHydration'
import {
  displayOnlyProfitEstimate,
  manualSelectionGroup as group,
  manualSelectionProfitEstimate as profitEstimate
} from './sourcePrefillHydration.contract.fixtures'

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

const groupWithoutStore = {
  ...group,
  materials: group.materials.map((material) => ({
    ...material,
    sourceCollection: { ...material.sourceCollection, storeCode: '' }
  }))
}
const hydrated = await hydrateProductListingSourcePrefill({
  source: 'manual-selection',
  sourceGroupId: '91001',
  pendingServerHydration: true,
  draft: { storeCode: 'STR-SOURCE-NSA' }
}, 'STR-SHELL-NSA', {
  loadManualSelectionGroup: async (groupId) => {
    assert.equal(groupId, '91001')
    return groupWithoutStore
  },
  loadManualSelectionGroupProfitEstimate: async (groupId) => {
    assert.equal(groupId, '91001')
    return profitEstimate
  },
  fetchActiveProductListingDraft: async (storeCode) => {
    assert.equal(storeCode, 'STR-SOURCE-NSA')
    return undefined
  }
})

assert.equal(hydrated.pendingServerHydration, undefined)
assert.equal(hydrated.sourceGroupNo, 'PSG-91001')
assert.equal(hydrated.draft.storeCode, 'STR-SOURCE-NSA')
assert.equal(hydrated.draft.productFullType, 'electronic_accessories-mobile_accessories-phone_cases')
assert.equal(hydrated.competitorMaterials?.length, 2)
assert.equal(hydrated.competitorMaterials?.[1]?.categoryName, 'Phone Cases')

const activeDraftRecovered = await hydrateProductListingSourcePrefill({
  source: 'manual-selection',
  sourceGroupId: '91001',
  pendingServerHydration: true,
  draft: {}
}, 'STR245027-NSA', {
  loadManualSelectionGroup: async () => group,
  loadManualSelectionGroupProfitEstimate: async () => profitEstimate,
  fetchActiveProductListingDraft: async (storeCode, sourceType, sourceRefId) => {
    assert.equal(storeCode, 'STR245027-NSA')
    assert.equal(sourceType, 'manual_selection_group')
    assert.equal(sourceRefId, 91001)
    return {
      draftId: 12004,
      draftNo: 'PLD-12004',
      storeCode,
      status: 'ready_for_dry_run',
      validationIssues: []
    }
  },
  fetchProductListingDraft: async (draftId) => {
    assert.equal(draftId, 12004)
    return {
      draftId,
      draftNo: 'PLD-12004',
      storeCode: 'STR245027-NSA',
      status: 'ready_for_dry_run',
      validationIssues: [],
      draft: {
        draftId,
        storeCode: 'STR245027-NSA',
        sourceType: 'manual_selection_group',
        sourceRefId: 91001,
        psku: 'CASE-RECOVERED-FROM-SOURCE',
        productTitleEn: 'Saved operator title must remain authoritative',
        productFullType: 'electronic_accessories-mobile_accessories-phone_cases',
        purchasePrice: 21,
        imageUrls: [],
        listingKeywordSuggestionsEn: ['saved keyword'],
        competitorMaterials: [
          {
            id: '86001',
            titleEn: 'Saved competitor title must not be replaced'
          }
        ]
      }
    }
  }
})

assert.equal(activeDraftRecovered.source, 'listing-draft')
assert.equal(activeDraftRecovered.sourceDraftId, '12004')
assert.equal(activeDraftRecovered.draft.draftId, 12004)
assert.equal(activeDraftRecovered.draft.psku, 'CASE-RECOVERED-FROM-SOURCE')
assert.equal(activeDraftRecovered.draft.productTitleEn, 'Saved operator title must remain authoritative')
assert.equal(activeDraftRecovered.draft.purchasePrice, 21)
assert.deepEqual(activeDraftRecovered.draft.listingKeywordSuggestionsEn, ['saved keyword'])
assert.equal(activeDraftRecovered.competitorMaterials?.[0]?.titleEn, 'Saved competitor title must not be replaced')
assert.equal(activeDraftRecovered.competitorMaterials?.[0]?.categoryName, 'Phone Cases')
assert.equal(activeDraftRecovered.competitorMaterials?.length, 2)

await assert.rejects(
  () => hydrateProductListingSourcePrefill({
    source: 'manual-selection',
    sourceGroupId: '91001',
    pendingServerHydration: true,
    draft: {}
  }, 'STR245027-NSA', {
    loadManualSelectionGroup: async () => group,
    loadManualSelectionGroupProfitEstimate: async () => profitEstimate,
    fetchActiveProductListingDraft: async () => {
      throw new Error('active draft lookup failed')
    }
  }),
  /active draft lookup failed/
)

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
assert.equal(legacyDraftHydrated.draft.purchasePrice, 18.5)
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
