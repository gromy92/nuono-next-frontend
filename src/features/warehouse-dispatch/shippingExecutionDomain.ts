import type { OutboundOrder, OutboundOrderLine, PackingBox, PackingList, ShippingBatch } from './types'

const SUBMITTED_STATUSES = new Set(['CONFIRMED', 'SEALED', 'SHIPPED'])

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
  const lines = orders.flatMap((order) => order.lines)
  const originNames = Array.from(new Set(orders.map((order) => order.originName).filter(Boolean)))
  const originTypes = Array.from(new Set(orders.map((order) => order.originType).filter(Boolean)))
  return {
    id: batch.id,
    batchId: batch.id,
    optionId: batch.selectedOptionId,
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
