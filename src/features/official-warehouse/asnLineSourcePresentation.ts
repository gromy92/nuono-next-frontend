import type { OfficialWarehouseAsnLine } from './api'

export type AsnLineSourceTag = {
  kind: 'shipping' | 'manual' | 'unknown'
  text: string
}

export function asnLineBatchNumbers(line: OfficialWarehouseAsnLine) {
  return Array.from(new Set((line.shippingBatchLinks || []).map((link) =>
    link.batchReferenceNo || link.trackingNo || link.externalShipmentNo || link.shippingBatchNo
  ).filter(Boolean))).join('、')
}

export function asnLineBatchReferenceText(line: OfficialWarehouseAsnLine) {
  const numbers = asnLineBatchNumbers(line)
  if (numbers) return numbers
  return line.sourceType === 'MANUAL' ? '不关联物流单' : '未记录物流单'
}

export function asnLineSourceTags(line: OfficialWarehouseAsnLine): AsnLineSourceTag[] {
  const tags: AsnLineSourceTag[] = []
  const shippingQuantity = Number(line.shippingBatchQuantity || 0)
  const manualQuantity = Number(line.manualQuantity || 0)
  const unknownQuantity = Number(line.unknownQuantity || 0)
  if (shippingQuantity > 0) {
    tags.push({ kind: 'shipping', text: `物流单 ${shippingQuantity.toLocaleString()} 件` })
  }
  if (manualQuantity > 0) {
    tags.push({ kind: 'manual', text: `手工添加 ${manualQuantity.toLocaleString()} 件` })
  }
  if (line.sourceType === 'UNKNOWN') {
    tags.push({
      kind: 'unknown',
      text: unknownQuantity > 0
        ? `来源待确认 ${unknownQuantity.toLocaleString()} 件`
        : '来源数据待核对'
    })
  }
  return tags
}
