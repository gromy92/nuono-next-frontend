import assert from 'node:assert/strict'
import { formatPurchaseDuplicateNotice } from './purchaseDuplicateNotice'
import type { PurchaseOrder } from '../purchase-order/types'
import type { PurchaseDraftRow } from './purchaseDrafts'

const zeroSuggestionDrafts = [
  {
    key: 'PAPERSAYSB110:AE',
    partnerSku: 'PAPERSAYSB110',
    sku: 'Z6E3D255016D650A347D7Z-1',
    productTitle: '50个18x25cm透明礼品袋',
    site: 'AE',
    air: {
      transportMode: 'AIR',
      calculatedQuantity: 0,
      suggestedQuantity: 0,
      quantity: 0
    },
    sea: {
      transportMode: 'SEA',
      calculatedQuantity: 0,
      suggestedQuantity: 0,
      quantity: 0
    }
  }
] as PurchaseDraftRow[]

const orders = [
  {
    id: '200001',
    title: '测试-sa',
    orderNo: 'PO-200001',
    storeCode: 'STR108065-NSA',
    status: 'pending_collection',
    items: [
      {
        partnerSku: 'PAPERSAYSB110',
        allocations: [
          {
            site: 'AE',
            transportMode: 'SEA',
            quantity: 10
          }
        ]
      }
    ]
  }
] as PurchaseOrder[]

const notice = formatPurchaseDuplicateNotice(zeroSuggestionDrafts, orders)

assert.match(
  notice,
  /PAPERSAYSB110 AE \/ 海运 已在 测试-sa \/ PO-200001（待采集），数量 10/,
  'duplicate notice must still show existing purchase order facts when the current replenishment suggestion is zero'
)
assert.match(notice, /可继续重复加入/, 'duplicate notice must explain that repeated add is allowed')

const sealedNotice = formatPurchaseDuplicateNotice(zeroSuggestionDrafts, [
  {
    ...orders[0],
    status: 'submitted'
  }
] as PurchaseOrder[])

assert.match(sealedNotice, /（已封存）/, 'submitted purchase order status must use the sealed copy in replenishment duplicate notices')
assert.doesNotMatch(sealedNotice, /已提交/, 'replenishment duplicate notices must not use stale submitted wording')
