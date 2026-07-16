import assert from 'node:assert/strict'
import * as sourcePrefill from './sourcePrefill'
import { hydrateProductListingSourcePrefill } from './sourcePrefillHydration'
import type { ProductListingDraftView } from './types'

const draftView: ProductListingDraftView = {
  draftId: 10033,
  draftNo: 'PLD-10033',
  ownerUserId: 10002,
  storeCode: 'STR245027-NSA',
  status: 'ready_for_dry_run',
  validationIssues: [],
  draft: {
    draftId: 10033,
    storeCode: 'STR245027-NSA',
    psku: 'NN-DRAFT-CASE',
    productTitleCn: '防摔手机壳草稿',
    productTitleEn: 'Rugged phone case draft',
    imageUrls: [],
    sourceType: 'manual_selection_group',
    sourceRefId: 91015
  }
}

const buildRecoveryPrefill = (sourcePrefill as Record<string, unknown>).buildProductListingDraftRecoveryPrefill
assert.equal(typeof buildRecoveryPrefill, 'function')

const prefill = (buildRecoveryPrefill as Function)(draftView)

assert.equal(prefill.source, 'listing-draft')
assert.equal(prefill.sourceDraftId, '10033')
assert.equal(prefill.collectionNo, 'PLD-10033')
assert.equal(prefill.sourceTitleCn, '防摔手机壳草稿')
assert.equal(prefill.draft.draftId, 10033)
assert.equal(prefill.draft.storeCode, 'STR245027-NSA')
assert.equal(prefill.draft.psku, 'NN-DRAFT-CASE')
assert.equal(prefill.draft.productTitleEn, 'Rugged phone case draft')

const sessionStorage = new Map<string, string>()
;(globalThis as Record<string, unknown>).window = {
  location: {
    search: '?listingSource=listing-draft&listingDraftId=10033'
  },
  sessionStorage: {
    getItem: (key: string) => sessionStorage.get(key) ?? null,
    setItem: (key: string, value: string) => sessionStorage.set(key, value)
  }
}
sourcePrefill.saveProductListingDraftRecoveryPrefill({
  ...draftView,
  draft: {
    ...draftView.draft!,
    psku: 'STALE-SESSION-PSKU'
  }
})

const urlLocatorPrefill = sourcePrefill.readProductListingSourcePrefill()
assert.equal(urlLocatorPrefill?.source, 'listing-draft')
assert.equal(urlLocatorPrefill?.sourceDraftId, '10033')
assert.equal(urlLocatorPrefill?.pendingServerHydration, true)
assert.equal(urlLocatorPrefill?.draft.draftId, 10033)
assert.equal(urlLocatorPrefill?.draft.psku, undefined)
delete (globalThis as Record<string, unknown>).window

const hydrated = await hydrateProductListingSourcePrefill({
  source: 'listing-draft',
  sourceDraftId: '10033',
  pendingServerHydration: true,
  draft: {}
} as any, undefined, {
  fetchProductListingDraft: async (draftId: number) => {
    assert.equal(draftId, 10033)
    return draftView
  }
} as any)

assert.equal(hydrated.source, 'listing-draft')
assert.equal(hydrated.pendingServerHydration, undefined)
assert.equal(hydrated.draft.draftId, 10033)
assert.equal(hydrated.draft.psku, 'NN-DRAFT-CASE')
