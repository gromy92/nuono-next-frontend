import { strict as assert } from 'node:assert'
import {
  formatBoxSpec,
  isSubmittedPackingList,
  mergeBatchOutboundOrder,
  packingGroupLabel,
  sumPackingLists
} from './shippingExecutionDomain'
import type { OutboundOrderLine, PackingBox, PackingList } from './types'

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

const merged = mergeBatchOutboundOrder({
  id: '700044', batchNo: '0718-海运', status: 'PACKED', sourceCount: 3,
  skuCount: 49, totalQuantity: 2581, siteCodes: ['SA'], transportModes: ['SEA'],
  optionCount: 1, packingListCount: 2,
  boxCount: 16, packedQuantity: 2581, createdAt: '', sources: [], options: []
}, [
  { id: '1', batchId: '700044', outboundNo: 'WO-1', status: 'PACKED', originName: 'canman',
    skuCount: 35, totalQuantity: 1761, createdAt: '', lines: [] },
  { id: '2', batchId: '700044', outboundNo: 'WO-2', status: 'PACKED', originName: 'SGGR',
    skuCount: 14, totalQuantity: 820, createdAt: '', lines: [] }
])
assert.equal(merged?.outboundNo, '0718-海运')
assert.equal(merged?.originName, '多来源')
assert.equal(merged?.skuCount, 49)
