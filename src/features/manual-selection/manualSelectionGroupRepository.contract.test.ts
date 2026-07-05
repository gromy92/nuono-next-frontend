import assert from 'node:assert/strict'
import { loadManualSelectionGroupWorkspace } from './manualSelectionGroupRepository'
import type { ManualSelectionAnalysisItemView, ManualSelectionGroupView } from './types'
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
    projectName: 'Legacy group',
    projectMaterialCount: 1,
    sourceCollectionId: 'S1',
    sourceCollection: sourceRecord('S1')
  }
]

const canonicalGroups: ManualSelectionGroupView[] = [
  {
    groupId: 'G2',
    groupName: 'Canonical group',
    materials: []
  }
]

const loadedGroups = await loadManualSelectionGroupWorkspace('canman', 'STR245027-NAE', {
  loadGroups: async () => canonicalGroups,
  loadLegacyAnalysisItems: async () => {
    throw new Error('legacy adapter should not be used when groups load succeeds')
  }
})

assert.equal(loadedGroups[0].groupId, 'G2')

let fallbackUsed = false
const fallbackGroups = await loadManualSelectionGroupWorkspace('canman', 'STR245027-NAE', {
  loadGroups: async () => {
    throw new Error('Request failed: 404')
  },
  loadLegacyAnalysisItems: async () => {
    fallbackUsed = true
    return legacyItems
  }
})

assert.equal(fallbackUsed, true)
assert.equal(fallbackGroups[0].groupId, 'G1')

let forbiddenFallbackUsed = false
await assert.rejects(
  () => loadManualSelectionGroupWorkspace('canman', 'STR245027-NAE', {
    loadGroups: async () => {
      throw new Error('Request failed: 403')
    },
    loadLegacyAnalysisItems: async () => {
      forbiddenFallbackUsed = true
      return legacyItems
    }
  }),
  /403/
)
assert.equal(forbiddenFallbackUsed, false)

let serverErrorFallbackUsed = false
await assert.rejects(
  () => loadManualSelectionGroupWorkspace('canman', 'STR245027-NAE', {
    loadGroups: async () => {
      throw new Error('Request failed: 500')
    },
    loadLegacyAnalysisItems: async () => {
      serverErrorFallbackUsed = true
      return legacyItems
    }
  }),
  /500/
)
assert.equal(serverErrorFallbackUsed, false)
