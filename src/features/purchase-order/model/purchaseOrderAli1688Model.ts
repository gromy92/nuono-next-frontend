import type {
  PurchaseOrder,
  PurchaseOrderAli1688HistoryBatch,
  PurchaseOrderAli1688HistoryRecord,
  PurchaseOrderAli1688HistorySource,
  PurchaseOrderAli1688HistoryView,
  PurchaseOrderItem
} from '../types'
import { sameDisplayText } from './purchaseOrderDisplayModel'
import { normalizeSiteCode } from './purchaseOrderItemCommandModel'
import type { PurchaseOrderAli1688HistoryEntry } from './purchaseOrderViewTypes'

export function ali1688HistoryEntriesForItem(
  order: PurchaseOrder,
  item: PurchaseOrderItem,
  historiesByKey: Record<string, PurchaseOrderAli1688HistoryEntry>
): PurchaseOrderAli1688HistoryEntry[] {
  const siteCodes = (item.allocations || [])
    .filter((allocation) => allocation.enabled !== false)
    .map((allocation) => normalizeSiteCode(allocation.site))
    .filter(Boolean)
  return (siteCodes.length ? Array.from(new Set(siteCodes)) : ['']).map((siteCode) => {
    const key = ali1688HistoryKey(order, item, siteCode)
    return historiesByKey[key] || { key, siteCode }
  })
}

export function ali1688HistoryKey(order: PurchaseOrder, item: PurchaseOrderItem, siteCode?: string) {
  return [
    order.storeCode,
    normalizeSiteCode(siteCode) || '*',
    item.partnerSku || item.skuParent || item.id
  ].join(':')
}

export function buildAli1688HistoryEntriesFromView(
  order: PurchaseOrder,
  view: PurchaseOrderAli1688HistoryView
): Record<string, PurchaseOrderAli1688HistoryEntry> {
  const entries: Record<string, PurchaseOrderAli1688HistoryEntry> = {}
  ;(view.items || []).forEach((record) => {
    const matchedItems = (order.items || []).filter((item) => ali1688HistoryRecordMatchesItem(record, item))
    matchedItems.forEach((item) => {
      const siteCode = normalizeSiteCode(record.siteCode)
      const key = ali1688HistoryKey(order, item, siteCode)
      entries[key] = {
        key,
        siteCode,
        record
      }
    })
  })
  return entries
}

export function ali1688HistoryRecordMatchesItem(
  record: PurchaseOrderAli1688HistoryRecord,
  item: PurchaseOrderItem
) {
  return (
    sameDisplayText(record.partnerSku, item.partnerSku)
  )
}

export function latestAli1688Batch(record?: PurchaseOrderAli1688HistoryRecord) {
  return (record?.purchaseBatches || [])
    .slice()
    .sort((left, right) => compareNullableText(latestAli1688BatchSourceTime(right), latestAli1688BatchSourceTime(left)))[0]
}

export function latestAli1688BatchSourceTime(batch?: PurchaseOrderAli1688HistoryBatch) {
  return (batch?.sources || [])
    .map((source) => source.orderTime?.trim())
    .filter((value): value is string => Boolean(value))
    .sort()
    .reverse()[0]
}

export function recentAli1688UnitPrice(record?: PurchaseOrderAli1688HistoryRecord) {
  const latestBatch = latestAli1688Batch(record)
  return record?.recentUnitPrice
    ?? latestAli1688Source(record)?.unitPrice
    ?? latestBatch?.unitPrice
    ?? calculateAli1688BatchUnitPrice(latestBatch)
    ?? record?.averageUnitPrice
}

export function calculateAli1688BatchUnitPrice(batch?: PurchaseOrderAli1688HistoryBatch) {
  const cost = parsePurchaseNumber(batch?.countedCost)
  const quantity = parsePurchaseNumber(batch?.countedQuantity)
  if (cost === null || quantity === null || quantity <= 0) {
    return null
  }
  return cost / quantity
}

export function recentAli1688OrderNo(record?: PurchaseOrderAli1688HistoryRecord) {
  return latestAli1688Source(record)?.orderNo
}

export function latestAli1688Source(record?: PurchaseOrderAli1688HistoryRecord): PurchaseOrderAli1688HistorySource | undefined {
  const batchSource = latestAli1688BatchSource(latestAli1688Batch(record))
  const historySource = sortedAli1688History(record?.history || [])[0]
  if (historySource && compareNullableText(historySource.orderTime, batchSource?.orderTime) >= 0) {
    return historySource
  }
  return batchSource || historySource
}

export function latestAli1688BatchSource(batch?: PurchaseOrderAli1688HistoryBatch) {
  return (batch?.sources || [])
    .slice()
    .sort((left, right) => compareNullableText(right.orderTime, left.orderTime))[0]
}

export function sortedAli1688History(history: PurchaseOrderAli1688HistorySource[]) {
  return history
    .slice()
    .sort((left, right) => compareNullableText(right.orderTime, left.orderTime))
}

export function formatPurchaseAmount(value?: string | number | null) {
  const amount = parsePurchaseNumber(value)
  return amount === null ? '无价格' : `¥${amount.toFixed(2)}`
}

export function parsePurchaseNumber(value?: string | number | null) {
  if (value === undefined || value === null) {
    return null
  }
  const normalized = String(value).replace(/[¥,\s]/g, '')
  if (!normalized) {
    return null
  }
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

export function displayShortText(value?: string | number | null, fallback = '-') {
  const normalized = value === undefined || value === null ? '' : String(value).trim()
  return normalized || fallback
}

export function compareNullableText(left?: string, right?: string) {
  return (left || '').localeCompare(right || '')
}
