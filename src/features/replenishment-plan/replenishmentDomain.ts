import type { PurchaseOrder, SiteAllocation } from '../purchase-order/types'
import { PURCHASE_IN_TRANSIT_GOODS_PATH } from '../route-catalog/routePaths'
import { withCurrentWorkspaceDevQuery } from '../route-catalog/workspaceDevQuery'
import { pskuSiteTransportKey, type PurchaseDraftRow } from './purchaseDrafts'
import type { ReplenishmentPlanItem } from './types'
import { BATCH_PURCHASE_OPENING_KEY, BLOCKING_WARNING_LABELS, SEA_ETA_UNCERTAIN_AIR_WINDOW_WARNING, type PurchaseDraftLine, type PurchaseTransportSource, type SuggestionFilter } from './pageTypes'
import { numericQuantity } from './replenishmentFormatting'

function hasAirSuggestion(item: ReplenishmentPlanItem) {
  return numericQuantity(item.airSuggestedUnits) > 0
}

function hasSeaSuggestion(item: ReplenishmentPlanItem) {
  return numericQuantity(item.seaSuggestedUnits) > 0
}

export function hasSeaEtaRiskWarning(item: ReplenishmentPlanItem) {
  return item.warnings?.includes(SEA_ETA_UNCERTAIN_AIR_WINDOW_WARNING)
}

export function blockingReasonText(item: ReplenishmentPlanItem) {
  const labels = (item.warnings || [])
    .map((warning) => BLOCKING_WARNING_LABELS[warning])
    .filter(Boolean)
  return labels.length ? labels.join('；') : '补货计算依据不足'
}

export function summarizeBlockingReasons(rows: ReplenishmentPlanItem[]) {
  const counts = new Map<string, number>()
  for (const row of rows) {
    for (const warning of row.warnings || []) {
      const label = BLOCKING_WARNING_LABELS[warning]
      if (label) {
        counts.set(label, (counts.get(label) || 0) + 1)
      }
    }
  }
  return Array.from(counts.entries())
    .map(([label, count]) => `${label} ${count} 个`)
    .join('；')
}

export function openMissingEtaOverviewMaintenance() {
  if (typeof window === 'undefined') {
    return
  }
  const targetPath = withCurrentWorkspaceDevQuery(`${PURCHASE_IN_TRANSIT_GOODS_PATH}?statusScope=active`)
  window.history.pushState({}, '', targetPath)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export function purchaseDraftLines(drafts: PurchaseDraftRow[]): PurchaseDraftLine[] {
  return drafts.flatMap((draft) => [draft.air, draft.sea]
    .filter((quantityDraft) => quantityDraft.quantity > 0)
    .map((quantityDraft) => ({
      partnerSku: draft.partnerSku,
      site: draft.site,
      transportMode: quantityDraft.transportMode,
      quantity: quantityDraft.quantity
    })))
}

export function replacePurchaseOrder(orders: PurchaseOrder[], nextOrder: PurchaseOrder) {
  const replaced = orders.map((order) => order.id === nextOrder.id ? nextOrder : order)
  return orders.some((order) => order.id === nextOrder.id) ? replaced : [nextOrder, ...orders]
}

export function editablePurchaseOrders(orders: PurchaseOrder[]) {
  return orders.filter((order) => (
    order.status !== 'submitted'
    && order.status !== 'deleted'
    && order.status !== 'done'
    && !isHistoricalPurchaseOrder(order)
  ))
}

export function purchasePlanningScopeOrders(orders: PurchaseOrder[]) {
  return orders.filter((order) => (
    order.status !== 'deleted'
    && order.status !== 'done'
    && !isHistoricalPurchaseOrder(order)
  ))
}

export function isHistoricalPurchaseOrder(order: PurchaseOrder) {
  return (order.orderNo || '').startsWith('PO-HIST-')
}

export function purchaseOpeningKey(targetRows: ReplenishmentPlanItem[]) {
  if (targetRows.length !== 1) {
    return BATCH_PURCHASE_OPENING_KEY
  }
  return targetRows[0]?.partnerSku || BATCH_PURCHASE_OPENING_KEY
}

export function purchaseOrderTransportQuantities(orders: PurchaseOrder[]) {
  const quantities = new Map<string, number>()
  for (const order of orders) {
    for (const item of order.items || []) {
      for (const allocation of item.allocations || []) {
        const key = pskuSiteTransportKey(item.partnerSku, allocation.site, allocation.transportMode)
        quantities.set(key, (quantities.get(key) || 0) + numericQuantity(allocation.quantity))
      }
    }
  }
  return quantities
}

export function purchaseOrderTransportSources(orders: PurchaseOrder[]) {
  const sources = new Map<string, PurchaseTransportSource>()
  for (const order of orders) {
    for (const item of order.items || []) {
      for (const allocation of item.allocations || []) {
        const key = pskuSiteTransportKey(item.partnerSku, allocation.site, allocation.transportMode)
        const current = sources.get(key)
        const next = current || purchaseTransportSourceFromAllocation(order, allocation)
        sources.set(key, {
          ...next,
          quantity: numericQuantity(current?.quantity) + numericQuantity(allocation.quantity)
        })
      }
    }
  }
  return sources
}

export function purchaseTransportSourceFromAllocation(order: PurchaseOrder, allocation: SiteAllocation): PurchaseTransportSource {
  return {
    orderTitle: order.title,
    orderNo: order.orderNo,
    orderStatus: order.status,
    quantity: allocation.quantity
  }
}

export function summarizeSuggestions(rows: ReplenishmentPlanItem[]) {
  const totalSkuCount = rows.length
  let replenishmentSkuCount = 0
  let airSkuCount = 0
  let seaSkuCount = 0
  for (const row of rows) {
    const hasAir = hasAirSuggestion(row)
    const hasSea = hasSeaSuggestion(row)
    if (hasAir || hasSea) {
      replenishmentSkuCount += 1
    }
    if (hasAir) {
      airSkuCount += 1
    }
    if (hasSea) {
      seaSkuCount += 1
    }
  }
  return { totalSkuCount, replenishmentSkuCount, airSkuCount, seaSkuCount }
}

export function matchesSuggestionFilter(item: ReplenishmentPlanItem, suggestionFilter: SuggestionFilter) {
  if (suggestionFilter === 'all') {
    return true
  }
  if (suggestionFilter === 'needed') {
    return hasAirSuggestion(item) || hasSeaSuggestion(item)
  }
  if (suggestionFilter === 'air') {
    return hasAirSuggestion(item)
  }
  if (suggestionFilter === 'sea') {
    return hasSeaSuggestion(item)
  }
  return true
}
