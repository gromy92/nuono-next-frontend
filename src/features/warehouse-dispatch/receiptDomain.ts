import type { AuthSession } from '../auth/session'
import type { PurchaseReceiptItem, PurchaseReceiptOrder, ReceiptStatus, WarehouseSiteCode } from './types'
import type {
  ReceiptDetailScopeFilterKey,
  ReceiptOrderSummary,
  ReceiptSiteFilterKey,
  ReceiptStoreOption
} from './workbenchModels'
import { SITE_LABELS } from './workbenchModels'
import { normalizeProductKey, sum } from './workbenchUtils'

export function buildReceiptStoreOptions(
  orders: PurchaseReceiptOrder[],
  userStores?: AuthSession['userStores'],
  currentStore?: AuthSession['currentStore']
): ReceiptStoreOption[] {
  const optionMap = new Map<string, ReceiptStoreOption>()
  ;[...(userStores || []), currentStore].forEach((store) => {
    if (!store?.storeCode || store.authorized === false) {
      return
    }
    const labelParts = [store.projectName || store.projectCode || store.storeCode, store.site].filter(Boolean)
    optionMap.set(store.storeCode, { value: store.storeCode, label: labelParts.join(' / ') })
  })
  orders.forEach((order) => {
    const value = receiptStoreFilterValue(order)
    if (!value) {
      return
    }
    const orderLabel = receiptOrderDisplayStoreName(order)
    const currentOption = optionMap.get(value)
    if (currentOption && !shouldPreferOrderStoreLabel(currentOption.label, orderLabel)) {
      return
    }
    optionMap.set(value, { value, label: orderLabel || value })
  })
  return Array.from(optionMap.values())
}

export function buildReceiptSiteOptions(orders: PurchaseReceiptOrder[]) {
  const siteCodes = new Set<WarehouseSiteCode>()
  orders.forEach((order) => order.items.forEach((item) => siteCodes.add(item.siteCode)))
  return Array.from(siteCodes).sort().map((siteCode) => ({ label: SITE_LABELS[siteCode], value: siteCode }))
}

export function filterReceiptOrders(
  orders: PurchaseReceiptOrder[],
  keyword: string,
  storeFilter: string,
  siteFilter: ReceiptSiteFilterKey
) {
  const normalizedKeyword = normalizeSearchText(keyword)
  return orders.flatMap((order) => {
    if (storeFilter !== 'all' && receiptStoreFilterValue(order) !== storeFilter) {
      return []
    }
    const siteScopedItems = siteFilter === 'all'
      ? order.items
      : order.items.filter((item) => item.siteCode === siteFilter)
    if (!siteScopedItems.length) {
      return []
    }
    if (!normalizedKeyword || receiptOrderMatchesKeyword(order, normalizedKeyword)) {
      return [{ ...order, items: siteScopedItems }]
    }
    const matchedItems = siteScopedItems.filter((item) => receiptItemMatchesKeyword(item, normalizedKeyword))
    return matchedItems.length ? [{ ...order, items: matchedItems }] : []
  })
}

export function filterReceiptDetailItems(
  items: PurchaseReceiptItem[],
  keyword: string,
  scopeFilter: ReceiptDetailScopeFilterKey
) {
  const normalizedKeyword = normalizeSearchText(keyword)
  return items.filter((item) => {
    const remainingQty = receiptRemainingQuantity(item)
    if (scopeFilter === 'pending' && remainingQty <= 0) {
      return false
    }
    if (scopeFilter === 'completed' && remainingQty > 0) {
      return false
    }
    return !normalizedKeyword || receiptItemMatchesKeyword(item, normalizedKeyword)
  })
}

export function buildReceiptDetailScopeOptions(items: PurchaseReceiptItem[]) {
  const pendingCount = items.filter((item) => receiptRemainingQuantity(item) > 0).length
  return [
    { label: `全部 ${items.length}`, value: 'all' as const },
    { label: `待收 ${pendingCount}`, value: 'pending' as const },
    { label: `已完成 ${items.length - pendingCount}`, value: 'completed' as const }
  ]
}

export function summarizeReceiptOrder(order: PurchaseReceiptOrder): ReceiptOrderSummary {
  const itemCount = order.items.length
  const pskuCount = new Set(order.items.map((item) => item.psku)).size
  const expectedQty = sum(order.items.map((item) => item.expectedQty))
  const receivedQty = sum(order.items.map((item) => item.receivedQty))
  const remainingQty = sum(order.items.map(receiptRemainingQuantity))
  const plannedQty = sum(order.items.map((item) => item.plannedQty))
  const readyQty = sum(order.items.map((item) => Math.max(0, item.receivedQty - item.plannedQty)))
  const missingSpecCount = order.items.filter((item) => item.specStatus === 'missing').length
  const hasShortage = order.items.some((item) => item.receivedQty > 0 && item.receivedQty < item.expectedQty)
  return {
    itemCount,
    pskuCount,
    expectedQty,
    receivedQty,
    remainingQty,
    readyQty,
    plannedQty,
    missingSpecCount,
    status: resolveReceiptStatus(expectedQty, receivedQty, readyQty, plannedQty, hasShortage)
  }
}

export function summarizeAllOrders(orders: PurchaseReceiptOrder[]) {
  const summaries = orders.map(summarizeReceiptOrder)
  const receiptTodoPskus = new Set<string>()
  orders.forEach((order) => order.items.forEach((item) => {
    const psku = normalizeProductKey(item.psku)
    if (item.receivedQty < item.expectedQty && psku) {
      receiptTodoPskus.add(psku)
    }
  }))
  const statusCounts = summaries.reduce<Record<ReceiptStatus, number>>(
    (counts, summary) => ({ ...counts, [summary.status]: counts[summary.status] + 1 }),
    { pending: 0, partial: 0, ready: 0, planned: 0, exception: 0 }
  )
  return {
    orderCount: orders.length,
    receiptTodoOrderCount: statusCounts.pending + statusCounts.partial + statusCounts.exception,
    receiptTodoPskuCount: receiptTodoPskus.size,
    pendingOrderCount: statusCounts.pending,
    partialOrderCount: statusCounts.partial,
    exceptionOrderCount: statusCounts.exception,
    readyOrderCount: statusCounts.ready,
    plannedOrderCount: statusCounts.planned,
    expectedQty: sum(summaries.map((summary) => summary.expectedQty)),
    receivedQty: sum(summaries.map((summary) => summary.receivedQty)),
    readyQty: sum(summaries.map((summary) => summary.readyQty)),
    missingSpecCount: sum(summaries.map((summary) => summary.missingSpecCount))
  }
}

export function receiptRemainingQuantity(item: PurchaseReceiptItem) {
  return Math.max(0, item.expectedQty - item.receivedQty)
}

export function formatReceiptQuantity(value: number) {
  return Number(value || 0).toLocaleString('zh-CN')
}

export function receiptOrderDisplayStoreName(order: PurchaseReceiptOrder) {
  return formatWarehouseStoreDisplayName(order.storeName, order.title || order.orderNo, order.storeCode)
}

export function receiptOrderBusinessScopeKey(order: PurchaseReceiptOrder) {
  const itemScope = order.items.map(receiptProductBusinessScopeKey).sort().join('+')
  return [
    normalizeProductKey(order.storeCode) || normalizeProductKey(order.storeName) || 'STORE',
    normalizeProductKey(order.orderNo) || normalizeProductKey(order.id),
    itemScope || 'NO_ITEMS'
  ].join('__')
}

export function receiptProductBusinessScopeKey(item: PurchaseReceiptItem) {
  const sourceStore = normalizeProductKey(item.storeCode) || normalizeProductKey(item.storeName) || 'STORE'
  const product = normalizeProductKey(item.psku) || normalizeProductKey(item.id)
  return [sourceStore, product, item.siteCode, item.transportMode,
    item.fulfillmentType || 'WAREHOUSE_RECEIPT', item.specStatus,
    normalizeProductKey(item.orderNo) || normalizeProductKey(item.orderId)].join('__')
}

export function isReceiptTodoStatus(status: ReceiptStatus) {
  return status === 'pending' || status === 'partial' || status === 'exception'
}

function receiptStoreFilterValue(order: PurchaseReceiptOrder) {
  return String(order.storeCode || order.storeName || '').trim()
}

function receiptOrderMatchesKeyword(order: PurchaseReceiptOrder, keyword: string) {
  return [order.orderNo, order.title, order.storeName, order.storeCode]
    .some((value) => includesSearchText(value, keyword))
}

function receiptItemMatchesKeyword(item: PurchaseReceiptItem, keyword: string) {
  return [item.psku, item.title, item.orderNo, item.purchaseOrderTitle, item.siteCode, item.transportMode]
    .some((value) => includesSearchText(value, keyword))
}

function formatWarehouseStoreDisplayName(storeName?: string, sourceName?: string, fallback?: string) {
  const rawName = String(storeName || '').trim()
  const inferredName = inferStoreNameFromSourceName(sourceName)
  return isProjectCodeLike(rawName) && inferredName
    ? inferredName
    : rawName || inferredName || String(fallback || '').trim() || '-'
}

function inferStoreNameFromSourceName(sourceName?: string) {
  return /^([A-Za-z][A-Za-z0-9_-]*?)-\d{4,}/.exec(String(sourceName || '').trim())?.[1]
}

function shouldPreferOrderStoreLabel(currentLabel: string, orderLabel: string) {
  const current = String(currentLabel || '').trim()
  return Boolean(String(orderLabel || '').trim()) && (isProjectCodeLike(current) || current.length > 24)
}

function isProjectCodeLike(value?: string) {
  return /^PRJ\d+$/i.test(String(value || '').trim())
}

function includesSearchText(value: unknown, keyword: string) {
  return normalizeSearchText(value).includes(keyword)
}

function normalizeSearchText(value: unknown) {
  return String(value || '').trim().toLowerCase()
}

function resolveReceiptStatus(expectedQty: number, receivedQty: number, readyQty: number,
                              plannedQty: number, hasShortage: boolean): ReceiptStatus {
  if (receivedQty <= 0) return 'pending'
  if (hasShortage) return 'exception'
  if (plannedQty > 0 && readyQty <= 0) return 'planned'
  if (receivedQty < expectedQty) return 'partial'
  return 'ready'
}
