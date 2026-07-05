import assert from 'node:assert/strict'
import {
  analysisProjectFromGroup,
  groupsFromLegacyAnalysisItems,
  mergeManualSelectionGroups,
  replaceGroupCompetitors
} from './manualSelectionGroupWorkspace'
import type {
  ManualSelectionAnalysisItemView,
  ManualSelectionGroupView
} from './types'
import type { ProductSelectionSourceCollection } from '../source-collection/types'

function sourceRecord(id: string): ProductSelectionSourceCollection {
  return {
    id,
    collectionNo: `PSC-${id}`,
    storeCode: 'STR245027-NAE',
    siteCode: 'AE',
    sourceType: 'marketplace-url',
    collectionSource: 'plugin',
    sourcePlatform: 'Noon',
    sourceUrl: `https://www.noon.com/uae-en/source-${id}/p/`,
    pageUrl: `https://www.noon.com/uae-en/source-${id}/p/`,
    sourceTitle: `Source product ${id}`,
    sourceTitleCn: `源头商品 ${id}`,
    sourceImageUrl: `https://images.example.test/${id}.jpg`,
    imageUrls: [`https://images.example.test/${id}.jpg`],
    priceSummary: 'AED 19.90',
    specHints: [],
    status: 'success',
    statusText: '采集成功',
    collectedAt: '2026-07-01 10:00:00',
    collectedBy: '插件',
    collectedFieldCount: 8,
    imageCount: 1
  }
}

const legacyItems: ManualSelectionAnalysisItemView[] = [
  {
    id: '10',
    projectId: 'G1',
    projectName: 'Desk organizer',
    projectMaterialCount: 2,
    sourceCollectionId: 'S1',
    ali1688PurchaseUrl: 'https://detail.1688.com/offer/1001.html',
    purchasePrice: 8.5,
    sourceCollection: sourceRecord('S1')
  },
  {
    id: '11',
    projectId: 'G1',
    projectName: 'Desk organizer',
    projectMaterialCount: 2,
    sourceCollectionId: 'S2',
    ali1688PurchaseUrl: 'https://detail.1688.com/offer/1001.html',
    purchasePrice: 8.5,
    sourceCollection: sourceRecord('S2')
  }
]

const groups = groupsFromLegacyAnalysisItems(legacyItems)

assert.equal(groups.length, 1)
assert.equal(groups[0].groupId, 'G1')
assert.equal(groups[0].groupName, 'Desk organizer')
assert.equal(groups[0].materialCount, 2)
assert.deepEqual(
  groups[0].materials.map((item) => item.sourceCollectionId),
  ['S1', 'S2']
)
assert.deepEqual(groups[0].procurement, {
  ali1688PurchaseUrl: 'https://detail.1688.com/offer/1001.html',
  purchasePriceRmb: 8.5,
  purchasePrice: 8.5,
  status: 'active'
})

const currentGroups: ManualSelectionGroupView[] = [
  {
    groupId: 'G1',
    groupName: 'Old group name',
    materials: [],
    competitors: [{ id: 'old', url: 'https://old.example.test' }]
  },
  {
    groupId: 'G2',
    groupName: 'Keep me',
    materials: [],
    competitors: [{ id: 'keep', url: 'https://keep.example.test' }]
  }
]

const replaced = replaceGroupCompetitors(currentGroups, 'G1', [
  { id: 'C1', url: 'https://www.noon.com/uae-en/competitor/p/' }
])

assert.deepEqual(replaced[0].competitors, [
  { id: 'C1', url: 'https://www.noon.com/uae-en/competitor/p/' }
])
assert.deepEqual(replaced[1].competitors, currentGroups[1].competitors)
assert.deepEqual(analysisProjectFromGroup(replaced[0]).competitors, replaced[0].competitors)

const merged = mergeManualSelectionGroups(currentGroups, [
  {
    groupId: 'G1',
    groupName: 'Saved group name',
    materials: [{ sourceCollectionId: 'S3', sourceCollection: sourceRecord('S3') }],
    competitors: [{ id: 'saved', url: 'https://saved.example.test' }]
  }
])

assert.equal(merged.length, 2)
assert.equal(merged[0].groupName, 'Saved group name')
assert.deepEqual(
  merged[0].materials.map((item) => item.sourceCollectionId),
  ['S3']
)
assert.deepEqual(merged[0].competitors, [{ id: 'saved', url: 'https://saved.example.test' }])
assert.equal(merged[1].groupName, 'Keep me')
