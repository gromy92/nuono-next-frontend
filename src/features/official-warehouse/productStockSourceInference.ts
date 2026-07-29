import type { OfficialWarehouseProductInboundReceiptRow } from './statisticsTypes'
import { nonNegativeInteger, parseTimestampText } from './statisticsDomainUtils'

export type ProductStockSourceInferenceRow = {
  noonAsnNr: string
  estimatedRemainingQty: number
  allocatableQty: number
  receivedQty: number
  qcFailedQty: number
  receiptStatus?: string
  matchStatus?: string
  asnCompletedAt?: string
  asnScheduleDate?: string
  importedAt?: string
}

export type ProductStockSourceInference = {
  model: 'FIFO_TOTAL_STOCK'
  currentStock: number
  matchedQuantity: number
  unmatchedQuantity: number
  totalAllocatableInboundQuantity: number
  rows: ProductStockSourceInferenceRow[]
}

export function inferProductStockSourceByTotal(
  currentStock: number,
  inboundRows?: OfficialWarehouseProductInboundReceiptRow[] | null
): ProductStockSourceInference {
  let remainingStock = nonNegativeInteger(currentStock)
  const sortedRows = deduplicateProductInboundReceiptRows(inboundRows || [])
    .map((row, index) => ({
      row,
      index,
      allocatableQty: Math.max(nonNegativeInteger(row.receivedQty) - nonNegativeInteger(row.qcFailedQty), 0)
    }))
    .filter((item) => item.allocatableQty > 0)
    .sort((left, right) => {
      const rightTime = productInboundHistoryTime(right.row)
      const leftTime = productInboundHistoryTime(left.row)
      if (rightTime !== leftTime) {
        return rightTime - leftTime
      }
      return right.index - left.index
    })

  const byAsn = new Map<string, ProductStockSourceInferenceRow>()
  let totalAllocatableInboundQuantity = 0
  let matchedQuantity = 0

  for (const item of sortedRows) {
    totalAllocatableInboundQuantity += item.allocatableQty
    if (remainingStock <= 0) {
      continue
    }
    const estimatedRemainingQty = Math.min(remainingStock, item.allocatableQty)
    remainingStock -= estimatedRemainingQty
    matchedQuantity += estimatedRemainingQty
    const noonAsnNr = item.row.noonAsnNr || '未关联 ASN'
    const existing = byAsn.get(noonAsnNr)
    if (existing) {
      existing.estimatedRemainingQty += estimatedRemainingQty
      existing.allocatableQty += item.allocatableQty
      existing.receivedQty += nonNegativeInteger(item.row.receivedQty)
      existing.qcFailedQty += nonNegativeInteger(item.row.qcFailedQty)
      continue
    }
    byAsn.set(noonAsnNr, {
      noonAsnNr,
      estimatedRemainingQty,
      allocatableQty: item.allocatableQty,
      receivedQty: nonNegativeInteger(item.row.receivedQty),
      qcFailedQty: nonNegativeInteger(item.row.qcFailedQty),
      receiptStatus: item.row.receiptStatus,
      matchStatus: item.row.matchStatus,
      asnCompletedAt: item.row.asnCompletedAt,
      asnScheduleDate: item.row.asnScheduleDate,
      importedAt: item.row.importedAt
    })
  }

  return {
    model: 'FIFO_TOTAL_STOCK',
    currentStock: nonNegativeInteger(currentStock),
    matchedQuantity,
    unmatchedQuantity: remainingStock,
    totalAllocatableInboundQuantity,
    rows: Array.from(byAsn.values())
  }
}

function productInboundHistoryTime(row: OfficialWarehouseProductInboundReceiptRow) {
  return parseTimestampText(row.asnCompletedAt || row.asnScheduleDate || row.importedAt)
}

function deduplicateProductInboundReceiptRows(rows: OfficialWarehouseProductInboundReceiptRow[]) {
  const byBusinessLine = new Map<string, OfficialWarehouseProductInboundReceiptRow>()
  for (const row of rows) {
    const key = [
      row.noonAsnNr || '',
      row.partnerSku || '',
      row.noonSku || '',
      row.pbarcodeCanonical || '',
      nonNegativeInteger(row.qtyExpected),
      nonNegativeInteger(row.receivedQty),
      nonNegativeInteger(row.qcFailedQty),
      nonNegativeInteger(row.unidentifiedQty),
      row.asnScheduleDate || '',
      row.asnCompletedAt || ''
    ].join('|')
    const existing = byBusinessLine.get(key)
    if (!existing || productImportTime(row) >= productImportTime(existing)) {
      byBusinessLine.set(key, row)
    }
  }
  return Array.from(byBusinessLine.values())
}

function productImportTime(row: OfficialWarehouseProductInboundReceiptRow) {
  return parseTimestampText(row.importedAt)
}
