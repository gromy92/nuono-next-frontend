import assert from 'node:assert/strict'
import {
  buildPurchaseDrafts,
  filterBatchPurchaseDrafts
} from './purchaseDrafts'
import type { ReplenishmentPlanItem } from './types'

const item = {
  partnerSku: 'PAPERSAYSB110',
  sku: 'Z6E3D255016D650A347DZ-1',
  productTitle: '50个18x25cm透明礼品袋',
  airCalculatedUnits: 12,
  airSuggestedUnits: 15,
  seaCalculatedUnits: 7,
  seaSuggestedUnits: 10
} as ReplenishmentPlanItem

const drafts = buildPurchaseDrafts(item, 'SA')

assert.equal(drafts.length, 1, 'same product must render as one purchase draft row with air and sea quantities')
assert.deepEqual(
  drafts.map((draft) => ({
    air: draft.air,
    sea: draft.sea
  })),
  [
    {
      air: { transportMode: 'AIR', quantity: 15, calculatedQuantity: 12, suggestedQuantity: 15 },
      sea: { transportMode: 'SEA', quantity: 10, calculatedQuantity: 7, suggestedQuantity: 10 }
    }
  ],
  'same product row must allow editing air and sea quantities while showing calculation and suggestion before submitting one purchase order'
)
assert.equal(drafts[0].site, 'SA')
assert.equal(drafts[0].partnerSku, 'PAPERSAYSB110')
assert.equal(drafts[0].key, 'PAPERSAYSB110:SA')

assert.deepEqual(
  filterBatchPurchaseDrafts(buildPurchaseDrafts({
    partnerSku: 'PAPERSAYS037',
    sku: 'Z-DUPE',
    productTitle: '2个黑色挂绳易拉扣证件套',
    airCalculatedUnits: 0,
    airSuggestedUnits: 0,
    seaCalculatedUnits: 5,
    seaSuggestedUnits: 10
  } as ReplenishmentPlanItem, 'SA')).map((draft) => ({
    partnerSku: draft.partnerSku,
    seaQuantity: draft.sea.quantity
  })),
  [{ partnerSku: 'PAPERSAYS037', seaQuantity: 10 }],
  'batch purchase modal must keep positive suggestions even if the same transport may already exist in purchase orders'
)

const zeroSuggestionDrafts = buildPurchaseDrafts({
  partnerSku: 'PAPERSAYS065',
  sku: 'Z-ZERO',
  productTitle: 'A4白色不干胶打印纸',
  airCalculatedUnits: 0,
  airSuggestedUnits: 0,
  seaCalculatedUnits: 0,
  seaSuggestedUnits: 0
} as ReplenishmentPlanItem, 'SA')

assert.equal(zeroSuggestionDrafts.length, 1, 'single-row add must keep zero-suggestion rows editable for manual quantities')
assert.equal(zeroSuggestionDrafts[0].air.quantity, 0)
assert.equal(zeroSuggestionDrafts[0].sea.quantity, 0)

assert.deepEqual(
  filterBatchPurchaseDrafts([...drafts, ...zeroSuggestionDrafts]).map((draft) => draft.partnerSku),
  ['PAPERSAYSB110'],
  'batch purchase modal must hide product rows whose air and sea suggestions are both zero'
)
