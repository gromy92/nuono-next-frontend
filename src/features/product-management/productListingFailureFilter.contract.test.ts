import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  countProductListStatuses,
  filterAndSortProductListItems,
  resolveProductListRowManagementStatus
} from './utils/productListFilters'
import type { ProductListFilters, ProductListRowPayload } from './types'

function row(
  partnerSku: string,
  syncStatus: ProductListRowPayload['syncStatus'],
  listingStatus?: string
): ProductListRowPayload {
  return {
    skuParent: `LOCAL-${partnerSku}`,
    partnerSku,
    syncStatus,
    siteLabels: [],
    liveStatuses: [],
    issueTags: [],
    ...(listingStatus
      ? {
          listingPublishTask: {
            status: listingStatus
          }
        }
      : {})
  }
}

const explicitFailure = row('FAIL-001', 'draft', 'failed')
const rejected = row('REJECT-001', 'draft', 'rejected')
const writtenReadbackFailure = row('VERIFY-001', 'draft', 'written_verify_failed')
const ordinaryDraft = row('DRAFT-001', 'draft')
const syncFailure = row('SYNC-FAIL-001', 'failed')

assert.equal(resolveProductListRowManagementStatus(explicitFailure, {}, false), 'failed')
assert.equal(resolveProductListRowManagementStatus(rejected, {}, false), 'failed')
assert.equal(resolveProductListRowManagementStatus(writtenReadbackFailure, {}, false), 'draft')
assert.equal(resolveProductListRowManagementStatus(ordinaryDraft, {}, false), 'draft')
assert.equal(resolveProductListRowManagementStatus(syncFailure, {}, false), 'failed')

const items = [
  explicitFailure,
  rejected,
  writtenReadbackFailure,
  ordinaryDraft,
  syncFailure
]
const counts = countProductListStatuses(items, {}, false)
assert.deepEqual(counts, {
  synced: 0,
  draft: 2,
  conflict: 0,
  failed: 3
})

const filters: ProductListFilters = {
  skuQuery: '',
  titleQuery: '',
  brandQuery: '',
  issueFilter: 'all',
  liveFilter: 'all',
  syncFilter: 'failed',
  stockFilter: 'all',
  operationStageFilter: 'all'
}
const failedItems = filterAndSortProductListItems({
  filters,
  sortKey: 'recent',
  sourceItems: items,
  uiStates: {},
  usingMockProductList: false
})

assert.deepEqual(
  failedItems.map((item) => item.partnerSku),
  ['FAIL-001', 'REJECT-001', 'SYNC-FAIL-001']
)

const mutationSource = readFileSync(
  new URL('./hooks/useProductListMutations.ts', import.meta.url),
  'utf8'
)
assert.match(
  mutationSource,
  /countProductListStatuses\(nextItems,\s*\{\},\s*false\)/,
  'local summary updates must reuse the same failed/rejected status rule as filters and badges'
)
