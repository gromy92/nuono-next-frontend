import type { PackingBatchDetails } from './packingExportDomain'
import {
  requirePackingBatchDetailsScope,
  WarehousePackingScopeError
} from './shippingExecutionDomain'
import type { ShippingBatch } from './types'

const SHIPPING_BATCH_STATUSES = new Set([
  'DRAFT', 'OPTION_SELECTED', 'OUTBOUND_CREATED', 'PACKING', 'PACKED', 'SHIPPED'
])
const OUTBOUND_ORDER_STATUSES = new Set(['DRAFT', 'PACKING', 'PACKED', 'SHIPPED'])
const PACKING_LIST_STATUSES = new Set(['DRAFT', 'CONFIRMED', 'SEALED', 'SHIPPED'])
const PACKING_BOX_STATUSES = new Set(['DRAFT', 'CONFIRMED', 'SEALED', 'SHIPPED'])
const PACKED_ONLY = new Set(['PACKED'])
const PACKING_OR_PACKED = new Set(['PACKING', 'PACKED'])
const SUBMITTED_ONLY = new Set(['CONFIRMED', 'SEALED'])
const COMPLETED = new Set(['PACKED', 'SHIPPED'])
const COMPLETED_PACKING = new Set(['CONFIRMED', 'SEALED', 'SHIPPED'])

export function requirePackingListActionScope(
  batch: ShippingBatch,
  details: PackingBatchDetails,
  packingListId: string
) {
  const scoped = requirePackingBatchDetailsScope(batch, details)
  const matches = Object.values(scoped.packingListsByOutboundOrder)
    .flat()
    .filter((packingList) => String(packingList.id) === String(packingListId))
  if (matches.length !== 1) {
    throw new WarehousePackingScopeError('目标装箱单不属于当前发货单，请刷新后重试。')
  }
  requireKnownPackingStatusGraph(batch, scoped)
  requireStatus(batch.status, PACKING_OR_PACKED, '发货单状态已变化，请刷新后重试。')
  const packingList = matches[0]
  const outboundOrder = scoped.outboundOrders.find(
    (order) => String(order.id) === String(packingList.outboundOrderId)
  )
  if (!outboundOrder) {
    throw new WarehousePackingScopeError('目标装箱单的出库单不存在，请刷新后重试。')
  }
  requireStatus(outboundOrder.status, PACKED_ONLY, '出库单状态已变化，请刷新后重试。')
  requireStatus(packingList.status, SUBMITTED_ONLY, '只有 APP 已提交并完成装箱的装箱单可以发货。')
  packingList.boxes.forEach((box) => requireStatus(
    box.status, SUBMITTED_ONLY, '装箱箱子状态与已提交装箱单不一致，已阻止继续操作。'
  ))
  return packingList
}

export function requirePackingBatchExportScope(batch: ShippingBatch, details: PackingBatchDetails) {
  const scoped = requirePackingBatchDetailsScope(batch, details)
  requireKnownPackingStatusGraph(batch, scoped)
  requireStatus(batch.status, COMPLETED, '发货单尚未完成装箱，不能导出装箱单。')
  scoped.outboundOrders.forEach((order) => requireStatus(
    order.status, COMPLETED, '出库单尚未完成装箱，不能导出装箱单。'
  ))
  Object.values(scoped.packingListsByOutboundOrder).flat().forEach((packingList) => {
    requireStatus(packingList.status, COMPLETED_PACKING, '装箱单尚未完成装箱，不能导出装箱单。')
    packingList.boxes.forEach((box) => requireStatus(
      box.status, COMPLETED_PACKING, '装箱箱子尚未完成装箱，不能导出装箱单。'
    ))
  })
  return scoped
}

function requireKnownPackingStatusGraph(batch: ShippingBatch, details: PackingBatchDetails) {
  requireStatus(batch.status, SHIPPING_BATCH_STATUSES, '发货单状态未知，已阻止继续操作。')
  details.outboundOrders.forEach((order) => {
    requireStatus(order.status, OUTBOUND_ORDER_STATUSES, '出库单状态未知，已阻止继续操作。')
  })
  Object.values(details.packingListsByOutboundOrder).flat().forEach((packingList) => {
    requireStatus(packingList.status, PACKING_LIST_STATUSES, '装箱单状态未知，已阻止继续操作。')
    packingList.boxes.forEach((box) => {
      requireStatus(box.status, PACKING_BOX_STATUSES, '装箱箱子状态未知，已阻止继续操作。')
    })
  })
}

function requireStatus(value: string | undefined, allowed: Set<string>, message: string) {
  const status = String(value || '').trim().toUpperCase()
  if (!status || !allowed.has(status)) throw new WarehousePackingScopeError(message)
  return status
}
