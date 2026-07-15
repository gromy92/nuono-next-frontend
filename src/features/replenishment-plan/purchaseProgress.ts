import type { PurchaseOrder, PurchaseTransportMode } from '../purchase-order/types'
import type { ReplenishmentPlanItem, ReplenishmentQuantity } from './types'

export type PurchasePlanProgressSummary = {
  totalReplenishmentSkuCount: number
  addedSkuCount: number
  partialSkuCount: number
  remainingSkuCount: number
  airSkuCount: number
  airQuantity: number
  seaSkuCount: number
  seaQuantity: number
  orderLabels: string[]
}

type NeededTransport = {
  air: number
  sea: number
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
    const air = numericQuantity(row.airSuggestedUnits)
    const sea = numericQuantity(row.seaSuggestedUnits)
    if (air <= 0 && sea <= 0) {
      continue
    }
    const current = neededBySku.get(key) || { air: 0, sea: 0 }
    neededBySku.set(key, {
      air: Math.max(current.air, air),
      sea: Math.max(current.sea, sea)
    })
  }

  const normalizedSiteCode = normalizeText(siteCode)
  const airSkuKeys = new Set<string>()
  const seaSkuKeys = new Set<string>()
  const plannedBySkuTransport = new Map<string, number>()
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
        if (mode === 'AIR' && needed.air > 0) {
          airSkuKeys.add(itemKey)
          const quantity = numericQuantity(allocation.quantity)
          airQuantity += quantity
          plannedBySkuTransport.set(`${itemKey}|AIR`, (plannedBySkuTransport.get(`${itemKey}|AIR`) || 0) + quantity)
          orderMatched = true
        }
        if (mode === 'SEA' && needed.sea > 0) {
          seaSkuKeys.add(itemKey)
          const quantity = numericQuantity(allocation.quantity)
          seaQuantity += quantity
          plannedBySkuTransport.set(`${itemKey}|SEA`, (plannedBySkuTransport.get(`${itemKey}|SEA`) || 0) + quantity)
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

  let addedSkuCount = 0
  let partialSkuCount = 0
  for (const [itemKey, needed] of neededBySku) {
    const airPlanned = plannedBySkuTransport.get(`${itemKey}|AIR`) || 0
    const seaPlanned = plannedBySkuTransport.get(`${itemKey}|SEA`) || 0
    const airCovered = needed.air <= 0 || airPlanned >= needed.air
    const seaCovered = needed.sea <= 0 || seaPlanned >= needed.sea
    if (airCovered && seaCovered) {
      addedSkuCount += 1
    } else if (airPlanned > 0 || seaPlanned > 0) {
      partialSkuCount += 1
    }
  }

  return {
    totalReplenishmentSkuCount: neededBySku.size,
    addedSkuCount,
    partialSkuCount,
    remainingSkuCount: Math.max(0, neededBySku.size - addedSkuCount),
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
