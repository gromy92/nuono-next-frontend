import { strict as assert } from 'node:assert'
import {
  formatBoxSpec,
  isSubmittedPackingList,
  mergeBatchOutboundOrder,
  packingGroupLabel,
  requireCurrentShippingBatchScope,
  requirePackingBatchDetailsScope,
  requirePackingListActionScope,
  sumPackingLists
} from './shippingExecutionDomain'
import type { PackingBatchDetails } from './packingExportDomain'
import type {
  OutboundOrder, OutboundOrderLine, PackingBox, PackingBoxItem, PackingList, ShippingBatch
} from './types'

const packingList = (status: string, boxes: number, quantity: number): PackingList => ({
  id: status,
  outboundOrderId: '1',
  packingNo: status,
  status,
  boxCount: boxes,
  packedQuantity: quantity,
  createdAt: '',
  boxes: []
})

assert.equal(isSubmittedPackingList(packingList('DRAFT', 1, 2)), false)
assert.equal(isSubmittedPackingList(packingList('CONFIRMED', 1, 2)), true)
assert.deepEqual(sumPackingLists([
  { ...packingList('CONFIRMED', 2, 20), grossWeightKg: '4.1', volumeCbm: '0.1' },
  { ...packingList('CONFIRMED', 3, 30), grossWeightKg: '5.2', volumeCbm: '0.2' }
]), { boxCount: 5, packedQuantity: 50, grossWeightKg: 9.3, volumeCbm: 0.30000000000000004 })

const box = { lengthCm: '24.000', widthCm: '18.000', heightCm: '12.000' } as PackingBox
assert.equal(formatBoxSpec(box), '24 x 18 x 12 cm')
assert.equal(packingGroupLabel({
  targetForwarderName: '众鸫供应链',
  cargoCategoryName: 'E类'
} as OutboundOrderLine), '众鸫供应链 / E类')

const scopedBatch: ShippingBatch = {
  id: '700044', ownerUserId: 307, batchNo: '0718-海运', status: 'PACKED', sourceCount: 3,
  skuCount: 49, totalQuantity: 2581, siteCodes: ['SA'], transportModes: ['SEA'],
  optionCount: 1, packingListCount: 2,
  boxCount: 16, packedQuantity: 2581, createdAt: '', sources: [], options: []
}
const scopedOrders: OutboundOrder[] = [
  { id: '1', batchId: '700044', ownerUserId: 307, outboundNo: 'WO-1', status: 'PACKED', originName: 'canman',
    skuCount: 35, totalQuantity: 1761, createdAt: '', lines: [{
      id: 'line-1', outboundOrderId: '1', psku: 'PSKU-1', title: '商品 1', siteCode: 'SA',
      transportMode: 'SEA', specStatus: 'complete', quantity: 20, packedQuantity: 20, sources: []
    }] },
  { id: '2', batchId: '700044', ownerUserId: 307, outboundNo: 'WO-2', status: 'PACKED', originName: 'SGGR',
    skuCount: 14, totalQuantity: 820, createdAt: '', lines: [] }
]
const merged = mergeBatchOutboundOrder(scopedBatch, scopedOrders)
assert.equal(merged?.outboundNo, '0718-海运')
assert.equal(merged?.originName, '多来源')
assert.equal(merged?.skuCount, 49)
assert.equal(merged?.ownerUserId, 307, '聚合发货单不能丢 owner')

const scopedPackingList: PackingList = {
  ...packingList('CONFIRMED', 2, 20), id: 'packing-1', outboundOrderId: '1', ownerUserId: 307,
  boxes: [{
    id: 'box-1', packingListId: 'packing-1', outboundOrderId: '1', boxNo: 'BOX-1', status: 'SEALED',
    quantity: 20, items: [{
      id: 'item-1', packingListId: 'packing-1', packingBoxId: 'box-1', outboundOrderId: '1',
      outboundOrderLineId: 'line-1', partnerSku: 'PSKU-1', siteCode: 'SA',
      actualTransportMode: 'SEA', quantity: 20
    }]
  }]
}
const scopedDetails: PackingBatchDetails = {
  outboundOrders: scopedOrders,
  packingListsByOutboundOrder: { '1': [scopedPackingList], '2': [] }
}
assert.equal(requireCurrentShippingBatchScope([scopedBatch], scopedBatch), scopedBatch)
assert.throws(
  () => requireCurrentShippingBatchScope([{ ...scopedBatch, ownerUserId: 999 }], scopedBatch),
  /所属账号已变化/
)
assert.equal(requirePackingBatchDetailsScope(scopedBatch, scopedDetails), scopedDetails)
assert.equal(requirePackingListActionScope(scopedBatch, scopedDetails, 'packing-1'), scopedPackingList)
const nestedDetails = (
  boxPatch: Partial<PackingBox> = {},
  itemPatch: Partial<PackingBoxItem> = {}
): PackingBatchDetails => {
  const baseBox = scopedPackingList.boxes[0]
  const box = { ...baseBox, ...boxPatch, items: [{ ...baseBox.items[0], ...itemPatch }] }
  return {
    ...scopedDetails,
    packingListsByOutboundOrder: {
      ...scopedDetails.packingListsByOutboundOrder,
      '1': [{ ...scopedPackingList, boxes: [box] }]
    }
  }
}
assert.throws(() => requirePackingBatchDetailsScope(
  scopedBatch, nestedDetails({ packingListId: 'outside' })
), /箱子的父级关联不匹配/)
assert.throws(() => requirePackingBatchDetailsScope(
  scopedBatch, nestedDetails({ outboundOrderId: '2' })
), /箱子的父级关联不匹配/)
assert.throws(() => requirePackingBatchDetailsScope(
  scopedBatch, nestedDetails({}, { packingBoxId: 'outside' })
), /商品的父级关联不匹配/)
assert.throws(() => requirePackingBatchDetailsScope(
  scopedBatch, nestedDetails({}, { packingListId: 'outside' })
), /商品的父级关联不匹配/)
assert.throws(() => requirePackingBatchDetailsScope(
  scopedBatch, nestedDetails({}, { outboundOrderId: '2' })
), /商品的父级关联不匹配/)
assert.throws(() => requirePackingBatchDetailsScope(
  scopedBatch, nestedDetails({}, { outboundOrderLineId: 'outside' })
), /商品的父级关联不匹配/)
const duplicateBoxes = nestedDetails()
const duplicateBox = duplicateBoxes.packingListsByOutboundOrder['1'][0].boxes[0]
duplicateBoxes.packingListsByOutboundOrder['1'][0].boxes.push({ ...duplicateBox })
assert.throws(() => requirePackingBatchDetailsScope(scopedBatch, duplicateBoxes), /箱子标识缺失或重复/)
const duplicateItems = nestedDetails()
const duplicateItem = duplicateItems.packingListsByOutboundOrder['1'][0].boxes[0].items[0]
duplicateItems.packingListsByOutboundOrder['1'][0].boxes[0].items.push({ ...duplicateItem })
assert.throws(() => requirePackingBatchDetailsScope(scopedBatch, duplicateItems), /商品标识缺失或重复/)
assert.throws(() => requirePackingBatchDetailsScope(scopedBatch, {
  ...scopedDetails,
  outboundOrders: [{ ...scopedOrders[0], batchId: 'other' }]
}), /不属于当前发货单/)
assert.throws(() => requirePackingBatchDetailsScope(scopedBatch, {
  ...scopedDetails,
  outboundOrders: [{ ...scopedOrders[0], ownerUserId: 999 }]
}), /所属账号不匹配/)
assert.throws(() => requirePackingBatchDetailsScope(scopedBatch, {
  ...scopedDetails,
  packingListsByOutboundOrder: { '1': [{ ...scopedPackingList, outboundOrderId: '2' }], '2': [] }
}), /不属于当前发货单明细/)
assert.throws(() => requirePackingBatchDetailsScope(scopedBatch, {
  ...scopedDetails,
  packingListsByOutboundOrder: { '1': [{ ...scopedPackingList, ownerUserId: 999 }], '2': [] }
}), /所属账号不匹配/)
assert.throws(() => requirePackingBatchDetailsScope(scopedBatch, {
  ...scopedDetails,
  packingListsByOutboundOrder: { '1': [{ ...scopedPackingList, ownerUserId: undefined }], '2': [] }
}), /缺少有效所属账号/)
assert.throws(() => requirePackingBatchDetailsScope(scopedBatch, {
  ...scopedDetails,
  packingListsByOutboundOrder: { ...scopedDetails.packingListsByOutboundOrder, outside: [] }
}), /之外的明细/)
assert.throws(
  () => requirePackingBatchDetailsScope({ ...scopedBatch, ownerUserId: undefined }, scopedDetails),
  /缺少有效所属账号/
)
assert.throws(() => requirePackingListActionScope(scopedBatch, scopedDetails, 'outside'), /不属于当前发货单/)
