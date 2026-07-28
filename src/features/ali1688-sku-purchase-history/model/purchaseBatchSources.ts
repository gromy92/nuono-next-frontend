import type {
  Ali1688SkuPurchaseBatchSourceMatchCandidate,
  Ali1688SkuPurchaseHistoryBatch,
  Ali1688SkuPurchaseHistoryBatchSource,
  Ali1688SkuPurchaseHistoryItem,
  Ali1688SkuPurchaseHistoryQuery,
  Ali1688SkuPurchaseHistoryRecord
} from '../../ali1688-historical-orders/types'
import type {
  FilterState,
  PurchaseBatch,
  PurchaseBatchSource
} from './pageTypes'
import {
  displayOptionalText,
  normalizeNullableInteger,
  normalizeNullableNumber,
  relabelPurchaseBatches,
  sumSourceNumbers
} from './purchaseBatchMetrics'

export function buildQuery(filters: FilterState, page: number, pageSize: number): Ali1688SkuPurchaseHistoryQuery {
  return {
    storeCode: filters.storeCode,
    siteCode: filters.siteCode,
    keyword: filters.keyword.trim() || undefined,
    linkStatus: filters.linkStatus === 'all' ? undefined : filters.linkStatus,
    purchaseTimeFrom: filters.purchaseRange?.[0]?.format('YYYY-MM-DD'),
    purchaseTimeTo: filters.purchaseRange?.[1]?.format('YYYY-MM-DD'),
    page,
    pageSize
  }
}

export function skuPurchaseHistoryRowKey(record: Ali1688SkuPurchaseHistoryItem) {
  const productKey = record.partnerSku || record.skuParent || ''
  if (record.linkStatus === 'unlinked') {
    return `${record.storeCode || ''}-${record.siteCode || ''}-unlinked-${productKey || record.assignmentId || record.itemId || record.orderNo || ''}`
  }
  return `${record.storeCode || ''}-${record.siteCode || ''}-${productKey}`
}

export function buildPurchaseBatchSources(record: Ali1688SkuPurchaseHistoryItem) {
  return (record.history || []).map((item, index): PurchaseBatchSource => ({
    key: purchaseHistorySourceKey(item, index),
    orderId: item.orderId,
    itemId: item.itemId,
    assignmentId: item.assignmentId,
    orderNo: item.orderNo,
    orderTime: item.orderTime,
    supplierName: item.supplierName,
    assignedQuantity: item.assignedQuantity,
    allocatedCost: item.allocatedCost,
    unitPrice: item.unitPrice,
    amountBasis: item.amountBasis,
    priceQuality: item.priceQuality
  }))
}

export function purchaseHistorySourceKey(item: Ali1688SkuPurchaseHistoryRecord, index: number) {
  return [
    item.assignmentId ? `assignment-${item.assignmentId}` : '',
    item.orderId ? `order-${item.orderId}` : '',
    item.itemId ? `item-${item.itemId}` : '',
    item.orderNo ? `no-${item.orderNo}` : '',
    `row-${index}`
  ]
    .filter(Boolean)
    .join('-')
}

export function buildDefaultPurchaseBatches(record: Ali1688SkuPurchaseHistoryItem) {
  return relabelPurchaseBatches(
    buildPurchaseBatchSources(record).map((source) => createPurchaseBatchFromSources(`default-${source.key}`, [source]))
  )
}

export function buildPurchaseBatchesFromRecord(record: Ali1688SkuPurchaseHistoryItem) {
  const persistedBatches = record.purchaseBatches || []
  if (!persistedBatches.length) {
    return buildDefaultPurchaseBatches(record)
  }
  return persistedBatches.map((batch, index) => purchaseBatchFromPersistedBatch(batch, index))
}

export function purchaseBatchFromPersistedBatch(
  batch: Ali1688SkuPurchaseHistoryBatch,
  index: number
): PurchaseBatch {
  const label = displayOptionalText(batch.label) || `批次 ${index + 1}`
  return {
    id: batch.id ? `persisted-${batch.id}` : `persisted-${index + 1}`,
    batchId: batch.id,
    label,
    sources: (batch.sources || []).map((source, sourceIndex) => persistedPurchaseBatchSource(source, sourceIndex)),
    countedQuantity: normalizeNullableInteger(batch.countedQuantity ?? null),
    countedCost: normalizeNullableNumber(batch.countedCost ?? null),
    note: batch.note
  }
}

export function persistedPurchaseBatchSource(
  source: Ali1688SkuPurchaseHistoryBatchSource,
  index: number
): PurchaseBatchSource {
  return {
    key: persistedPurchaseBatchSourceKey(source, index),
    orderId: source.orderId,
    itemId: source.itemId,
    assignmentId: source.assignmentId,
    orderNo: source.orderNo,
    orderTime: source.orderTime,
    supplierName: source.supplierName
  }
}

export function persistedPurchaseBatchSourceKey(source: Ali1688SkuPurchaseHistoryBatchSource, index: number) {
  return [
    source.assignmentId ? `assignment-${source.assignmentId}` : '',
    source.orderId ? `order-${source.orderId}` : '',
    source.itemId ? `item-${source.itemId}` : '',
    source.orderNo ? `no-${source.orderNo}` : '',
    `persisted-${index}`
  ]
    .filter(Boolean)
    .join('-')
}

export function sourceMatchCandidateToBatchSource(
  candidate: Ali1688SkuPurchaseBatchSourceMatchCandidate
): Ali1688SkuPurchaseHistoryBatchSource {
  return {
    orderId: candidate.orderId,
    itemId: candidate.itemId,
    assignmentId: candidate.assignmentId,
    orderNo: candidate.orderNo,
    orderTime: candidate.orderTime,
    supplierName: candidate.supplierName
  }
}

export function purchaseBatchSourceFromMatchCandidate(
  candidate: Ali1688SkuPurchaseBatchSourceMatchCandidate,
  index: number
): PurchaseBatchSource {
  return {
    key: sourceMatchCandidateKey(candidate, index),
    orderId: candidate.orderId,
    itemId: candidate.itemId,
    assignmentId: candidate.assignmentId,
    orderNo: candidate.orderNo,
    orderTime: candidate.orderTime,
    supplierName: candidate.supplierName,
    assignedQuantity: candidate.assignedQuantity
  }
}

export function sourceMatchCandidateKey(candidate: Ali1688SkuPurchaseBatchSourceMatchCandidate, index: number) {
  return [
    candidate.assignmentId ? `assignment-${candidate.assignmentId}` : '',
    candidate.orderId ? `order-${candidate.orderId}` : '',
    candidate.itemId ? `item-${candidate.itemId}` : '',
    candidate.orderNo ? `no-${candidate.orderNo}` : '',
    `source-match-${index}`
  ]
    .filter(Boolean)
    .join('-')
}

export function createPurchaseBatchFromSources(id: string, sources: PurchaseBatchSource[]): PurchaseBatch {
  return {
    id,
    label: '批次',
    sources,
    countedQuantity: sumSourceNumbers(sources, 'assignedQuantity'),
    countedCost: sumSourceNumbers(sources, 'allocatedCost')
  }
}
