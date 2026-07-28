import type {
  PurchaseOrder,
  PurchaseOrderItem
} from '../types'
import {
  allocationDisplayLabel,
  normalizeSiteCode,
  normalizeTransportMode
} from './purchaseOrderItemCommandModel'
import { deriveStatus } from './purchaseOrderDisplayModel'
import { itemIssues } from './purchaseOrderIssueModel'
import type {
  AllocationSummary,
  OrderSummary,
  PurchaseItemFilterOption,
  PurchaseOrderIssueSummary
} from './purchaseOrderViewTypes'

export function summarizeOrder(order: PurchaseOrder): OrderSummary {
  const items = order.items || []
  const totalQuantity = items.reduce((sum, item) => sum + (item.totalQuantity || 0), 0)
  const pskuCount = new Set(
    items
      .map((item) => item.partnerSku?.trim())
      .filter(Boolean)
  ).size
  const skuCount = items.reduce((sum, item) => {
    const allocationKeys = new Set(
      (item.allocations || []).map((allocation) => allocation.pskuCode
        ? `${allocation.pskuCode}:${allocation.site}:${allocation.transportMode || 'UNSPECIFIED'}`
        : `${item.id}:${allocation.site}:${allocation.transportMode || 'UNSPECIFIED'}`)
    )
    return sum + Math.max(allocationKeys.size, item.allocations?.length ? 0 : 1)
  }, 0)
  const progress = items.length ? Math.round(items.reduce((sum, item) => sum + (item.progress || 0), 0) / items.length) : 0
  return {
    itemCount: items.length,
    pskuCount,
    skuCount,
    totalQuantity,
    progress,
    status: order.status === 'deleted' || order.status === 'submitted' ? order.status : deriveStatus(items)
  }
}

export function formatOrderQuantitySummary(summary: OrderSummary) {
  return `${summary.pskuCount}个商品 ${summary.totalQuantity}件商品`
}

export function formatAllocationQuantitySummary(allocation: AllocationSummary) {
  return `${allocation.pskuCount}个商品 ${allocation.quantity}件商品`
}

export function isSubmittedOrder(order?: PurchaseOrder | null) {
  return order?.status === 'submitted'
}

export function isOrderAvailableForShippingMerge(order: PurchaseOrder, assignedOrderIds: Set<string>) {
  return isSubmittedOrder(order) && !assignedOrderIds.has(order.id)
}

export function emptySummary(): OrderSummary {
  return {
    itemCount: 0,
    pskuCount: 0,
    skuCount: 0,
    totalQuantity: 0,
    progress: 0,
    status: 'draft'
  }
}

export function buildItemFilterOptions(
  order: PurchaseOrder,
  issueSummary: PurchaseOrderIssueSummary
): PurchaseItemFilterOption[] {
  const items = order.items || []
  return [
    { key: 'all', label: '全部', count: items.length },
    { key: 'issues', label: '异常', count: issueSummary.issueItemCount }
  ]
}

export function buildActiveItemFilter(
  filterKey: string,
  order: PurchaseOrder,
  issueSummary: PurchaseOrderIssueSummary,
  options: PurchaseItemFilterOption[]
): PurchaseItemFilterOption {
  const matchedOption = options.find((option) => option.key === filterKey)
  if (matchedOption) {
    return matchedOption
  }
  const [site, transportMode] = filterKey.split(':')
  const normalizedSite = normalizeSiteCode(site)
  const normalizedTransport = normalizeTransportMode(transportMode)
  if (normalizedSite && normalizedTransport) {
    return {
      key: filterKey,
      label: allocationDisplayLabel({ site: normalizedSite, transportMode: normalizedTransport }),
      count: filterOrderItems(order.items || [], filterKey).length,
      site: normalizedSite,
      transportMode: normalizedTransport
    }
  }
  return options[0] || { key: 'all', label: '全部', count: order.items?.length || 0 }
}

export function filterOrderItems(items: PurchaseOrderItem[], filterKey: string) {
  if (filterKey === 'issues') {
    return items.filter((item) => itemIssues(item).length > 0)
  }
  if (!filterKey || filterKey === 'all') {
    return items
  }
  const [site, transportMode] = filterKey.split(':')
  return items.filter((item) => itemMatchesAllocationFilter(item, site, transportMode))
}

export function itemMatchesAllocationFilter(
  item: PurchaseOrderItem,
  site: string,
  transportMode?: string
) {
  const normalizedSite = normalizeSiteCode(site)
  const normalizedTransport = normalizeTransportMode(transportMode)
  return (item.allocations || []).some((allocation) => (
    allocation.enabled !== false &&
    normalizeSiteCode(allocation.site) === normalizedSite &&
    normalizeTransportMode(allocation.transportMode) === normalizedTransport
  ))
}

export function allocationFilterKey(site?: string, transportMode?: string) {
  return `${normalizeSiteCode(site)}:${normalizeTransportMode(transportMode)}`
}
