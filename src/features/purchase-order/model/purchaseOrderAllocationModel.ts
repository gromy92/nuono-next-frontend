import type { PurchaseOrder } from '../types'
import {
  normalizeSiteCode,
  normalizeTransportMode
} from './purchaseOrderItemCommandModel'
import { DEFAULT_SITE_CODES } from './purchaseOrderUiMeta'
import type { AllocationSummary } from './purchaseOrderViewTypes'

export function summarizeOrderAllocations(order: PurchaseOrder): AllocationSummary[] {
  const summaryByKey = new Map<string, AllocationSummary & { partnerSkuSet: Set<string> }>()
  ;(order.items || []).forEach((item) => {
    ;(item.allocations || []).forEach((allocation) => {
      const quantity = allocation.quantity || 0
      if (!quantity || allocation.enabled === false) {
        return
      }
      const site = normalizeSiteCode(allocation.site)
      if (!site) {
        return
      }
      const transportMode = normalizeTransportMode(allocation.transportMode)
      const key = `${site}:${transportMode}`
      const partnerSkuKey = item.partnerSku?.trim().toUpperCase() || item.id
      const current = summaryByKey.get(key)
      if (current) {
        current.quantity += quantity
        current.partnerSkuSet.add(partnerSkuKey)
        current.pskuCount = current.partnerSkuSet.size
        return
      }
      summaryByKey.set(key, {
        site,
        siteName: allocation.siteName,
        transportMode,
        transportModeLabel: allocation.transportModeLabel,
        pskuCount: 1,
        partnerSkuSet: new Set([partnerSkuKey]),
        quantity
      })
    })
  })
  return Array.from(summaryByKey.values())
    .map(({ partnerSkuSet, ...summary }) => summary)
    .sort(compareAllocationSummary)
}

export function compareAllocationSummary(left: AllocationSummary, right: AllocationSummary) {
  const siteDiff = siteSortRank(left.site) - siteSortRank(right.site)
  if (siteDiff !== 0) {
    return siteDiff
  }
  const transportDiff = transportSortRank(left.transportMode) - transportSortRank(right.transportMode)
  if (transportDiff !== 0) {
    return transportDiff
  }
  return `${left.site}:${left.transportMode || ''}`.localeCompare(`${right.site}:${right.transportMode || ''}`)
}

export function siteSortRank(site?: string) {
  const normalized = normalizeSiteCode(site)
  const index = DEFAULT_SITE_CODES.indexOf(normalized)
  return index >= 0 ? index : DEFAULT_SITE_CODES.length
}

export function transportSortRank(transportMode?: string) {
  const normalized = normalizeTransportMode(transportMode)
  if (normalized === 'AIR') {
    return 0
  }
  if (normalized === 'SEA') {
    return 1
  }
  return 2
}
