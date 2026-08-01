import { strict as assert } from 'node:assert'
import {
  buildProductBaselineMap,
  mergeReadyShipmentRowsByBusinessScope,
  productBaselineMapKey,
  resolveReadyProductSpecsScope,
  toProductBaselineDataset
} from './readyDomain'
import type { ReadyShipmentRow } from './workbenchModels'

const row = (ownerUserId: number | undefined, storeCode: string, id: string): ReadyShipmentRow => ({
  id,
  orderId: `order-${id}`,
  orderNo: `PO-${id}`,
  ownerUserId,
  storeCode,
  storeName: `Store ${storeCode}`,
  psku: 'PSKU-1',
  title: `Product ${id}`,
  siteCode: 'SA',
  transportMode: 'AIR',
  fulfillmentType: 'WAREHOUSE_RECEIPT',
  specStatus: 'complete',
  expectedQty: 1,
  receivedQty: 1,
  plannedQty: 0,
  availableQty: 1,
  items: []
})

assert.notEqual(
  productBaselineMapKey({ ownerUserId: 307, storeCode: 'STORE-A' }, 'PSKU-1'),
  productBaselineMapKey({ ownerUserId: 408, storeCode: 'STORE-A' }, 'PSKU-1')
)
assert.equal(mergeReadyShipmentRowsByBusinessScope([
  row(307, 'STORE-A', 'a'), row(408, 'STORE-A', 'b')
]).length, 2)
assert.equal(mergeReadyShipmentRowsByBusinessScope([
  row(undefined, 'STORE-A', 'a'), row(undefined, 'STORE-A', 'b')
]).length, 2)
assert.deepEqual(resolveReadyProductSpecsScope(row(307, 'STORE-A', 'a')), {
  ownerUserId: 307,
  storeCode: 'STORE-A'
})
assert.throws(() => toProductBaselineDataset(
  { ownerUserId: 307, storeCode: 'STORE-A' },
  {
    ready: true,
    source: 'projection-primary',
    warnings: [],
    ownerUserId: 408,
    storeCode: 'STORE-A',
    items: []
  }
), /商品基线归属校验失败/)
const baselineItem = {
  skuParent: 'Z-1',
  partnerSku: 'PSKU-1',
  siteLabels: [],
  liveStatuses: [],
  issueTags: []
}
const baselineMap = buildProductBaselineMap([
  { ownerUserId: 307, storeCode: 'STORE-A', items: [baselineItem] },
  { ownerUserId: 408, storeCode: 'STORE-A', items: [baselineItem] }
])
assert.equal(Object.keys(baselineMap).length, 4)
assert.equal(
  baselineMap[productBaselineMapKey({ ownerUserId: 307, storeCode: 'STORE-A' }, 'PSKU-1')]
    ?.ownerUserId,
  307
)
assert.equal(
  baselineMap[productBaselineMapKey({ ownerUserId: 408, storeCode: 'STORE-A' }, 'PSKU-1')]
    ?.ownerUserId,
  408
)
