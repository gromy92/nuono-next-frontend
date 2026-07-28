import type { ReplenishmentPlanInboundBatch, ReplenishmentPlanItem, ReplenishmentPlanMissingEtaBatch, ReplenishmentQuantity } from './types'
import type { PurchaseTransportSource } from './pageTypes'

export function isEtaReviewRequired(batch: ReplenishmentPlanInboundBatch | ReplenishmentPlanMissingEtaBatch) {
  return 'etaReviewRequired' in batch && batch.etaReviewRequired
}

export function inboundBatchKey(batch: ReplenishmentPlanInboundBatch | ReplenishmentPlanMissingEtaBatch, index: number) {
  return `${batch.batchId || 'batch'}:${batch.batchReferenceNo || 'ref'}:${index}`
}

export function purchaseOrderStatusLabel(value?: string | null) {
  if (value === 'draft') return '草稿'
  if (value === 'pending_collection') return '待采集'
  if (value === 'collecting') return '采集中'
  if (value === 'partial_done') return '部分完成'
  if (value === 'done') return '完成'
  if (value === 'exception') return '异常'
  if (value === 'submitted') return '已封存'
  if (value === 'deleted') return '已删除'
  return value || '-'
}

export function formatPurchaseTransportSource(source: PurchaseTransportSource) {
  const orderText = [source.orderTitle, source.orderNo].filter(Boolean).join(' / ') || '采购单'
  const statusText = source.orderStatus ? `（${purchaseOrderStatusLabel(source.orderStatus)}）` : ''
  const quantityText = source.quantity === undefined ? '' : `，数量 ${formatQuantity(source.quantity)}`
  return `${orderText}${statusText}${quantityText}`
}

export function formatQuantity(value?: ReplenishmentQuantity | null) {
  if (value === null || value === undefined || value === '') {
    return '-'
  }
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    return String(value)
  }
  return Number.isInteger(parsed) ? String(parsed) : parsed.toFixed(2)
}

export function formatWholeQuantity(value?: ReplenishmentQuantity | null) {
  if (value === null || value === undefined || value === '') {
    return '-'
  }
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    return String(value)
  }
  return String(Math.round(parsed))
}

export function formatMonthlyStabilityFactor(item: ReplenishmentPlanItem) {
  const factor = monthlyStabilityFactor(item)
  return factor === null ? '-' : factor.toFixed(2)
}

export function formatAdjustedHistoryBuckets(item: ReplenishmentPlanItem) {
  return historyBuckets(
    numericQuantity(item.adjustedHistoryUnits7),
    numericQuantity(item.adjustedHistoryUnits30),
    numericQuantity(item.adjustedHistoryUnits60),
    numericQuantity(item.adjustedHistoryUnits90)
  ).map((quantity) => formatWholeQuantity(quantity)).join(' / ')
}

export function formatRawHistoryBuckets(item: ReplenishmentPlanItem) {
  return historyBuckets(
    numericQuantity(item.historyUnits7),
    numericQuantity(item.historyUnits30),
    numericQuantity(item.historyUnits60),
    numericQuantity(item.historyUnits90)
  ).map((quantity) => formatWholeQuantity(quantity)).join(' / ')
}

export function historyBuckets(history7: number, history30: number, history60: number, history90: number) {
  return [
    Math.max(0, history7),
    Math.max(0, history30),
    Math.max(0, history60 - history30),
    Math.max(0, history90 - history60)
  ]
}

export function monthlySalesBuckets(item: ReplenishmentPlanItem) {
  const month1 = numericQuantity(item.adjustedHistoryUnits30)
  const month2 = numericQuantity(item.adjustedHistoryUnits60) - numericQuantity(item.adjustedHistoryUnits30)
  const month3 = numericQuantity(item.adjustedHistoryUnits90) - numericQuantity(item.adjustedHistoryUnits60)
  return [month1, month2, month3].map((quantity) => Math.max(0, Math.round(quantity)))
}

export function monthlyStabilityFactor(item: ReplenishmentPlanItem) {
  const buckets = monthlySalesBuckets(item)
  const average = buckets.reduce((sum, quantity) => sum + quantity, 0) / buckets.length
  if (average <= 0) {
    return null
  }
  const variance = buckets.reduce((sum, quantity) => sum + ((quantity - average) ** 2), 0) / buckets.length
  const coefficientOfVariation = Math.sqrt(variance) / average
  return Math.max(0, Math.min(1, 1 - coefficientOfVariation))
}

export function formatMonthDay(value?: string | null) {
  if (!value) {
    return ''
  }
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (match) {
    return `${match[2]}-${match[3]}`
  }
  return value
}

export function formatDate(value?: string | null) {
  if (!value) {
    return ''
  }
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`
  }
  return value
}

export function formatListingAgeDays(value?: string | null, planDate?: string | null) {
  const listingDate = parseIsoDate(value)
  const currentDate = parseIsoDate(planDate) || parseIsoDate(todayIsoDate())
  if (!listingDate || !currentDate) {
    return ''
  }
  const days = Math.max(0, Math.floor((currentDate.getTime() - listingDate.getTime()) / 86400000))
  return ` ${days}天`
}

export function formatEtaDistanceDays(value?: string | null, planDate?: string | null) {
  const etaDate = parseIsoDate(value)
  const currentDate = parseIsoDate(planDate) || parseIsoDate(todayIsoDate())
  if (!etaDate || !currentDate) {
    return ''
  }
  const days = Math.round((etaDate.getTime() - currentDate.getTime()) / 86400000)
  if (days === 0) {
    return '今天'
  }
  return days > 0 ? `${days}天后` : `${Math.abs(days)}天前`
}

export function todayIsoDate() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseIsoDate(value?: string | null) {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!match) {
    return null
  }
  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])))
}

export function numericQuantity(value?: ReplenishmentQuantity | null) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}
