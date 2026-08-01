import type { OutboundOrder, OutboundOrderLine, PackingBox, PackingList, ShippingBatch } from './types'
import type { PackingBatchDetails } from './packingExportDomain'

const SUBMITTED_STATUSES = new Set(['CONFIRMED', 'SEALED', 'SHIPPED'])

export class WarehousePackingScopeError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'WarehousePackingScopeError'
  }
}

export function isSubmittedPackingList(packingList: PackingList) {
  return SUBMITTED_STATUSES.has(packingList.status.toUpperCase())
}

export function packingListSubmittedAt(packingLists: PackingList[]) {
  return packingLists
    .filter(isSubmittedPackingList)
    .map((packingList) => packingList.updatedAt || packingList.createdAt)
    .filter(Boolean)
    .sort()
    .at(-1)
}

export function sumPackingLists(packingLists: PackingList[]) {
  return packingLists.reduce((summary, packingList) => ({
    boxCount: summary.boxCount + packingList.boxCount,
    packedQuantity: summary.packedQuantity + packingList.packedQuantity,
    grossWeightKg: summary.grossWeightKg + Number(packingList.grossWeightKg || 0),
    volumeCbm: summary.volumeCbm + Number(packingList.volumeCbm || 0)
  }), { boxCount: 0, packedQuantity: 0, grossWeightKg: 0, volumeCbm: 0 })
}

export function mergeBatchOutboundOrder(batch: ShippingBatch, orders: OutboundOrder[]): OutboundOrder | undefined {
  if (!orders.length) return undefined
  requireOutboundOrdersScope(batch, orders)
  const lines = orders.flatMap((order) => order.lines)
  const originNames = Array.from(new Set(orders.map((order) => order.originName).filter(Boolean)))
  const originTypes = Array.from(new Set(orders.map((order) => order.originType).filter(Boolean)))
  return {
    id: batch.id,
    batchId: batch.id,
    optionId: batch.selectedOptionId,
    ownerUserId: batch.ownerUserId,
    outboundNo: batch.batchNo || batch.id,
    status: batch.status,
    originType: originTypes.length === 1 ? originTypes[0] : undefined,
    originName: originNames.length === 1 ? originNames[0] : '多来源',
    skuCount: batch.skuCount,
    totalQuantity: batch.totalQuantity,
    remark: batch.remark,
    createdAt: batch.createdAt,
    updatedAt: batch.updatedAt,
    lines
  }
}

export function requireShippingBatchOwner(batch: ShippingBatch) {
  return requireOwnerUserId(batch.ownerUserId, '发货单')
}

export function requireCurrentShippingBatchScope(
  batches: ShippingBatch[],
  requestedBatch: ShippingBatch
) {
  const requestedOwnerUserId = requireShippingBatchOwner(requestedBatch)
  const matches = batches.filter((batch) => String(batch.id) === String(requestedBatch.id))
  if (matches.length !== 1) {
    throw new WarehousePackingScopeError('当前发货单已变化，请刷新后重试。')
  }
  const currentOwnerUserId = requireShippingBatchOwner(matches[0])
  if (currentOwnerUserId !== requestedOwnerUserId) {
    throw new WarehousePackingScopeError('发货单所属账号已变化，请刷新后重试。')
  }
  return matches[0]
}

export function requireOutboundOrdersScope(batch: ShippingBatch, orders: OutboundOrder[]) {
  const batchOwnerUserId = requireShippingBatchOwner(batch)
  const orderIds = new Set<string>()
  const lineIds = new Set<string>()
  orders.forEach((order) => {
    const orderId = requireUniqueId(order.id, orderIds, '发货单明细')
    if (String(order.batchId) !== String(batch.id)) {
      throw new WarehousePackingScopeError('发货单明细不属于当前发货单，已阻止继续操作。')
    }
    if (requireOwnerUserId(order.ownerUserId, '发货单明细') !== batchOwnerUserId) {
      throw new WarehousePackingScopeError('发货单明细所属账号不匹配，已阻止继续操作。')
    }
    order.lines.forEach((line) => {
      requireUniqueId(line.id, lineIds, '发货商品行')
      if (String(line.outboundOrderId) !== orderId) {
        throw new WarehousePackingScopeError('发货商品行不属于当前发货单明细，已阻止继续操作。')
      }
    })
  })
  return orders
}

export function requirePackingBatchDetailsScope(
  batch: ShippingBatch,
  details: PackingBatchDetails
) {
  const orders = requireOutboundOrdersScope(batch, details.outboundOrders)
  const batchOwnerUserId = requireShippingBatchOwner(batch)
  const orderIds = new Set(orders.map((order) => String(order.id)))
  const packingListIds = new Set<string>()
  const boxIds = new Set<string>()
  const itemIds = new Set<string>()
  Object.keys(details.packingListsByOutboundOrder).forEach((orderId) => {
    if (!orderIds.has(String(orderId))) {
      throw new WarehousePackingScopeError('装箱单包含当前发货单之外的明细，已阻止继续操作。')
    }
  })
  orders.forEach((order) => {
    const lineIds = new Set(order.lines.map((line) => String(line.id)))
    ;(details.packingListsByOutboundOrder[order.id] || []).forEach((packingList) => {
      const packingListId = requireUniqueId(packingList.id, packingListIds, '装箱单')
      if (String(packingList.outboundOrderId) !== String(order.id)) {
        throw new WarehousePackingScopeError('装箱单不属于当前发货单明细，已阻止继续操作。')
      }
      if (requireOwnerUserId(packingList.ownerUserId, '装箱单') !== batchOwnerUserId) {
        throw new WarehousePackingScopeError('装箱单所属账号不匹配，已阻止继续操作。')
      }
      packingList.boxes.forEach((box) => {
        const boxId = requireUniqueId(box.id, boxIds, '装箱箱子')
        if (String(box.packingListId) !== packingListId || String(box.outboundOrderId) !== String(order.id)) {
          throw new WarehousePackingScopeError('装箱箱子的父级关联不匹配，已阻止继续操作。')
        }
        box.items.forEach((item) => {
          requireUniqueId(item.id, itemIds, '装箱商品')
          if (String(item.packingListId) !== packingListId
            || String(item.packingBoxId) !== boxId
            || String(item.outboundOrderId) !== String(order.id)
            || !lineIds.has(String(item.outboundOrderLineId))) {
            throw new WarehousePackingScopeError('装箱商品的父级关联不匹配，已阻止继续操作。')
          }
        })
      })
    })
  })
  return details
}

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
  return matches[0]
}

export function formatBoxSpec(box: PackingBox) {
  if (!box.lengthCm || !box.widthCm || !box.heightCm) return '箱规未填写'
  return `${decimalText(box.lengthCm)} x ${decimalText(box.widthCm)} x ${decimalText(box.heightCm)} cm`
}

export function formatWeight(value?: string | number) {
  const number = Number(value || 0)
  return number > 0 ? `${number.toFixed(1)} kg` : '重量未填写'
}

export function packingGroupLabel(line?: OutboundOrderLine) {
  if (!line) return '物流分组缺失'
  const forwarder = line.targetForwarderName || line.targetForwarderCode || '货代未维护'
  const category = line.cargoCategoryName || line.cargoCategoryCode || '类别未维护'
  return `${forwarder} / ${category}`
}

export function routeLabel(line?: OutboundOrderLine) {
  return line?.routeName || line?.routeCode || ''
}

function decimalText(value: string) {
  const number = Number(value)
  return Number.isFinite(number) ? String(number) : value
}

function requireOwnerUserId(value: number | undefined, label: string) {
  if (!Number.isInteger(value) || Number(value) <= 0) {
    throw new WarehousePackingScopeError(`${label}缺少有效所属账号，已阻止继续操作。`)
  }
  return Number(value)
}

function requireUniqueId(value: string, seen: Set<string>, label: string) {
  const rawId = String(value || '')
  const id = rawId.trim()
  if (!id || id !== rawId || seen.has(id)) {
    throw new WarehousePackingScopeError(`${label}标识缺失或重复，已阻止继续操作。`)
  }
  seen.add(id)
  return id
}
