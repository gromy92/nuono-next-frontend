import assert from 'node:assert/strict'
import { summarizePurchasePlanProgress } from './purchaseProgress'
import type { PurchaseOrder } from '../purchase-order/types'
import type { ReplenishmentPlanItem } from './types'

const rows = [
  {
    partnerSku: 'PAPERSAYS031',
    airSuggestedUnits: 5,
    seaSuggestedUnits: 0
  },
  {
    partnerSku: 'PAPERSAYS041',
    airSuggestedUnits: 0,
    seaSuggestedUnits: 30
  },
  {
    partnerSku: 'PAPERSAYS167',
    airSuggestedUnits: 0,
    seaSuggestedUnits: 0
  },
  {
    partnerSku: 'PAPERSAYSB428',
    airSuggestedUnits: 5,
    seaSuggestedUnits: 10
  }
] as ReplenishmentPlanItem[]

const orders = [
  {
    id: '1',
    title: '测试-sa',
    orderNo: 'PO-200001',
    storeCode: 'STR108065-NSA',
    items: [
      {
        partnerSku: 'PAPERSAYS031',
        allocations: [
          { site: 'SA', transportMode: 'AIR', quantity: 5 }
        ]
      },
      {
        partnerSku: 'PAPERSAYS041',
        allocations: [
          { site: 'SA', transportMode: 'SEA', quantity: 30 }
        ]
      }
    ]
  },
  {
    id: '2',
    title: '同店铺-AE创建',
    orderNo: 'PO-200002',
    storeCode: 'STR108065-NAE',
    items: [
      {
        partnerSku: 'PAPERSAYSB428',
        allocations: [
          { site: 'SA', transportMode: 'SEA', quantity: 10 },
          { site: 'AE', transportMode: 'AIR', quantity: 99 }
        ]
      }
    ]
  }
] as PurchaseOrder[]

const summary = summarizePurchasePlanProgress(rows, orders, 'SA')

assert.equal(summary.totalReplenishmentSkuCount, 3, 'current plan total must only count rows with air or sea suggestions')
assert.equal(summary.addedSkuCount, 2, 'a product is complete only when every suggested transport reaches its suggested quantity')
assert.equal(summary.partialSkuCount, 1, 'products with only part of their transport plan covered must remain visible')
assert.equal(summary.remainingSkuCount, 1, 'partially covered products must remain in the outstanding count')
assert.equal(summary.airSkuCount, 1, 'air count must only include current-site AIR allocations for the current plan')
assert.equal(summary.airQuantity, 5)
assert.equal(summary.seaSkuCount, 2, 'sea count must include same-logical-store orders even when the order anchor store code is another site')
assert.equal(summary.seaQuantity, 40)
assert.deepEqual(
  summary.orderLabels,
  ['测试-sa / PO-200001', '同店铺-AE创建 / PO-200002'],
  'summary must explain which purchase orders already contain this plan'
)
