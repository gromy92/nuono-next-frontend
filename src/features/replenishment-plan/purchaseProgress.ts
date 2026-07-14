import type { PurchaseOrder, PurchaseTransportMode } from '../purchase-order/types'
import type { ReplenishmentPlanItem, ReplenishmentQuantity } from './types'

export type PurchasePlanProgressSummary = {
  totalReplenishmentSkuCount: number
  addedSkuCount: number
  remainingSkuCount: number
  airSkuCount: number
  airQuantity: number
  seaSkuCount: number
  seaQuantity: number
  orderLabels: string[]
}

type NeededTransport = {
  air: boolean
  sea: boolean
}

export function summarizePurchasePlanProgress(
  rows: ReplenishmentPlanItem[],
  orders: PurchaseOrder[],
  siteCode?: string | null
): PurchasePlanProgressSummary {
  const neededBySku = new Map<string, NeededTransport>()
  for (const row of rows) {
    const key = skuKey(row.partnerSku)
    if (!key) {
      continue
    }
    const air = numericQuantity(row.airSuggestedUnits) > 0
    const sea = numericQuantity(row.seaSuggestedUnits) > 0
    if (!air && !sea) {
      continue
    }
    neededBySku.set(key, { air, sea })
  }

  const normalizedSiteCode = normalizeText(siteCode)
  const addedSkuKeys = new Set<string>()
  const airSkuKeys = new Set<string>()
  const seaSkuKeys = new Set<string>()
  const orderLabels: string[] = []
  const seenOrderLabels = new Set<string>()
  let airQuantity = 0
  let seaQuantity = 0

  for (const order of orders) {
    let orderMatched = false
    for (const item of order.items || []) {
      const itemKey = skuKey(item.partnerSku)
      const needed = itemKey ? neededBySku.get(itemKey) : undefined
      if (!itemKey || !needed) {
        continue
      }
      for (const allocation of item.allocations || []) {
        if (normalizedSiteCode && normalizeText(allocation.site) !== normalizedSiteCode) {
          continue
        }
        const mode = normalizeTransportMode(allocation.transportMode)
        if (mode === 'AIR' && needed.air) {
          addedSkuKeys.add(itemKey)
          airSkuKeys.add(itemKey)
          airQuantity += numericQuantity(allocation.quantity)
          orderMatched = true
        }
        if (mode === 'SEA' && needed.sea) {
          addedSkuKeys.add(itemKey)
          seaSkuKeys.add(itemKey)
          seaQuantity += numericQuantity(allocation.quantity)
          orderMatched = true
        }
      }
    }
    if (orderMatched) {
      const label = purchaseOrderLabel(order)
      if (label && !seenOrderLabels.has(label)) {
        seenOrderLabels.add(label)
        orderLabels.push(label)
      }
    }
  }

  return {
    totalReplenishmentSkuCount: neededBySku.size,
    addedSkuCount: addedSkuKeys.size,
    remainingSkuCount: Math.max(0, neededBySku.size - addedSkuKeys.size),
    airSkuCount: airSkuKeys.size,
    airQuantity,
    seaSkuCount: seaSkuKeys.size,
    seaQuantity,
    orderLabels
  }
}

function purchaseOrderLabel(order: PurchaseOrder) {
  return [order.title, order.orderNo].filter(Boolean).join(' / ') || order.id
}

function normalizeTransportMode(value?: PurchaseTransportMode | null) {
  return normalizeText(value)
}

function skuKey(value?: string | null) {
  return normalizeText(value)
}

function normalizeText(value?: string | null) {
  return (value || '').trim().toUpperCase()
}

function numericQuantity(value?: ReplenishmentQuantity | null) {
  const parsed = Number(value || 0)
  return Number.isFinite(parsed) ? parsed : 0
}
