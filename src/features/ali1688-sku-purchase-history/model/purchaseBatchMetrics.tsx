import { Tag } from 'antd'
import type {
  Ali1688SkuPurchaseHistoryRecord
} from '../../ali1688-historical-orders/types'
import type {
  PurchaseBatch,
  PurchaseBatchMetrics,
  PurchaseBatchSource
} from './pageTypes'
import { SOURCE_MATCH_REJECTION_MESSAGES } from './pageTypes'

export function relabelPurchaseBatches(batches: PurchaseBatch[]) {
  return batches.map((batch, index) => ({
    ...batch,
    label: `批次 ${index + 1}`
  }))
}

export function clonePurchaseBatches(batches: PurchaseBatch[]) {
  return batches.map((batch) => ({
    ...batch,
    sources: batch.sources.map((source) => ({ ...source }))
  }))
}

export function sumSourceNumbers(sources: PurchaseBatchSource[], field: 'assignedQuantity' | 'allocatedCost') {
  let hasValue = false
  const total = sources.reduce((sum, source) => {
    const parsed = parseNumberValue(source[field])
    if (parsed === null) {
      return sum
    }
    hasValue = true
    return sum + parsed
  }, 0)
  return hasValue ? total : null
}

export function normalizeNullableNumber(value: string | number | null) {
  if (value === null) {
    return null
  }
  return parseNumberValue(value)
}

export function normalizeNullableInteger(value: string | number | null) {
  const parsed = normalizeNullableNumber(value)
  return parsed === null ? null : Math.round(parsed)
}

export function parseNumberValue(value?: string | number | null) {
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

export function purchaseBatchOrderNos(batch: PurchaseBatch) {
  return uniqueNonEmpty(batch.sources.map((source) => source.orderNo))
}

export function purchaseBatchSupplierNames(batch: PurchaseBatch) {
  return uniqueNonEmpty(batch.sources.map((source) => source.supplierName))
}

export function uniqueNonEmpty(values: Array<string | number | null | undefined>) {
  return Array.from(
    new Set(
      values
        .map((value) => (value === undefined || value === null ? '' : String(value).trim()))
        .filter(Boolean)
    )
  )
}

export function purchaseBatchLatestOrderTime(batch: PurchaseBatch) {
  return batch.sources
    .map((source) => displayOptionalText(source.orderTime))
    .filter((value): value is string => Boolean(value))
    .sort()
    .reverse()[0]
}

export function purchaseBatchUnitPrice(batch: PurchaseBatch) {
  if (batch.countedCost === null || batch.countedQuantity === null || batch.countedQuantity <= 0) {
    return null
  }
  return batch.countedCost / batch.countedQuantity
}

export function purchaseBatchPriceQuality(batch: PurchaseBatch) {
  if (purchaseBatchUnitPrice(batch) === null || batch.sources.some((source) => source.priceQuality === 'missing_price_basis')) {
    return 'missing_price_basis'
  }
  return 'ready'
}

export function calculatePurchaseBatchMetrics(batches: PurchaseBatch[]): PurchaseBatchMetrics {
  const totalQuantity = sumBatchNumbers(batches, 'countedQuantity')
  const totalCost = sumBatchNumbers(batches, 'countedCost')
  const unitPrices = batches
    .map((batch) => purchaseBatchUnitPrice(batch))
    .filter((value): value is number => value !== null)
  const latestBatch = getLatestPurchaseBatch(batches.filter((batch) => purchaseBatchUnitPrice(batch) !== null))
  return {
    purchaseCount: batches.length,
    totalQuantity,
    totalCost,
    averageUnitPrice: totalQuantity && totalCost !== null ? totalCost / totalQuantity : null,
    recentUnitPrice: latestBatch ? purchaseBatchUnitPrice(latestBatch) : null,
    recentPurchaseTime: latestBatch ? purchaseBatchLatestOrderTime(latestBatch) : undefined,
    lowestUnitPrice: unitPrices.length ? Math.min(...unitPrices) : null,
    highestUnitPrice: unitPrices.length ? Math.max(...unitPrices) : null
  }
}

export function sumBatchNumbers(batches: PurchaseBatch[], field: 'countedQuantity' | 'countedCost') {
  let hasValue = false
  const total = batches.reduce((sum, batch) => {
    const value = batch[field]
    if (value === null) {
      return sum
    }
    hasValue = true
    return sum + value
  }, 0)
  return hasValue ? total : null
}

export function getLatestPurchaseBatch(batches: PurchaseBatch[]) {
  return batches
    .slice()
    .sort((left, right) => compareText(purchaseBatchLatestOrderTime(right), purchaseBatchLatestOrderTime(left)))[0]
}

export function getReadyPurchaseBatchPoints(batches: PurchaseBatch[]) {
  return batches
    .filter((batch) => purchaseBatchPriceQuality(batch) !== 'missing_price_basis' && purchaseBatchUnitPrice(batch) !== null)
    .slice()
    .sort((left, right) => compareText(purchaseBatchLatestOrderTime(left), purchaseBatchLatestOrderTime(right)))
}

export function displayText(value?: string | number | null, fallback?: string | number | null) {
  const normalized = value === undefined || value === null ? '' : String(value).trim()
  if (normalized) {
    return normalized
  }
  const fallbackText = fallback === undefined || fallback === null ? '' : String(fallback).trim()
  return fallbackText || '未返回信息'
}

export function displayOptionalText(value?: string | number | null) {
  const normalized = value === undefined || value === null ? '' : String(value).trim()
  return normalized || undefined
}

export function sourceMatchRejectionMessage(reason?: string | null) {
  if (!reason) {
    return '未找到可保存的来源。'
  }
  return SOURCE_MATCH_REJECTION_MESSAGES[reason] || `无法保存来源: ${reason}`
}

export function formatNumberText(value?: string | number | null) {
  const normalized = value === undefined || value === null ? '' : String(value).trim()
  return normalized || '未返回信息'
}

export function formatCurrency(value?: string | number | null) {
  const amount = parseAmount(value)
  return amount === null ? '未返回信息' : `¥${amount.toFixed(2)}`
}

export function priceQualityTag(value?: string | null) {
  if (value === 'missing_price_basis') {
    return <Tag color="orange">缺失价格基础</Tag>
  }
  return <Tag color="green">正常</Tag>
}

export function parseAmount(value?: string | number | null) {
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

export function readyPricePointValue(item: Ali1688SkuPurchaseHistoryRecord) {
  if (item.priceQuality !== 'ready' && item.priceQuality !== 'ok') {
    return null
  }
  return parseAmount(item.unitPrice)
}

export function compareText(left?: string | null, right?: string | null) {
  return displayText(left, '').localeCompare(displayText(right, ''), 'zh-Hans-CN')
}

export function compareAmount(left?: string | number | null, right?: string | number | null) {
  return (parseAmount(left) ?? Number.NEGATIVE_INFINITY) - (parseAmount(right) ?? Number.NEGATIVE_INFINITY)
}
