import assert from 'node:assert/strict'
import { createProductMasterSnapshotPayload } from './utils/productMasterSnapshotFactory'

const snapshot = createProductMasterSnapshotPayload({
  mode: 'listing-draft',
  message: 'draft',
  identity: {
    partnerSku: 'CASE-NEW-001'
  },
  content: {
    titleEn: 'Rugged phone case'
  }
})

assert.equal(snapshot.mode, 'listing-draft')
assert.equal(snapshot.ready, true)
assert.equal(snapshot.message, 'draft')
assert.equal(snapshot.identity.partnerSku, 'CASE-NEW-001')
assert.equal(snapshot.content.titleEn, 'Rugged phone case')
assert.deepEqual(snapshot.warnings, [])
assert.deepEqual(snapshot.missingCoreTables, [])
assert.deepEqual(snapshot.storeContext, {})
assert.deepEqual(snapshot.taxonomy, {})
assert.deepEqual(snapshot.platformSignals, {})
assert.deepEqual(snapshot.keyAttributes, [])
assert.deepEqual(snapshot.group, { axes: [] })
assert.deepEqual(snapshot.variants, [])
assert.deepEqual(snapshot.pricing, {})
assert.deepEqual(snapshot.stock, {})
assert.deepEqual(snapshot.siteOffers, [])
