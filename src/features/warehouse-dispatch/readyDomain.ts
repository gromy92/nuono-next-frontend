import type { ProductListRowPayload } from '../product-management/types'
import { normalizeNoonImageUrl } from '../product-management/utils'
import type { DispatchPlan, ReadyShipmentItem, WarehouseFulfillmentType, WarehouseTransportMode } from './types'
import type {
  DispatchTargetTransportMode,
  ProductBaselineSummary,
  ReadyFilterKey,
  ReadyShipmentRow,
  ReceiptOrderMeta,
  WarehouseDispatchTabKey
} from './workbenchModels'
import { hasCjkText, normalizeProductKey } from './workbenchUtils'

export function buildProductBaselineMap(items: ProductListRowPayload[]) {
  const result: Record<string, ProductBaselineSummary> = {}
  items.forEach((item) => {
    const summary: ProductBaselineSummary = {
      psku: item.partnerSku || item.skuParent,
      skuParent: item.skuParent,
      title: item.title,
      imageUrl: normalizeNoonImageUrl(item.imageUrl || item.galleryImages?.[0]),
      productFulltype: item.productFulltype,
      detailBaselineStatus: item.detailBaselineStatus
    }
    ;[item.partnerSku, item.skuParent].forEach((key) => {
      const normalizedKey = normalizeProductKey(key)
      if (normalizedKey && !result[normalizedKey]) {
        result[normalizedKey] = summary
      }
    })
  })
  return result
}

export function mergeReadyShipmentRowsByBusinessScope(items: ReadyShipmentRow[]) {
  const rowMap = new Map<string, ReadyShipmentRow>()
  items.forEach((item) => {
    const key = readyShipmentBusinessScopeKey(item)
    const sourceItems = item.items.length ? item.items : [item]
    const current = rowMap.get(key)
    if (!current) {
      rowMap.set(key, { ...item, id: `ready-scope__${key}`, items: [...sourceItems] })
      return
    }
    current.expectedQty += item.expectedQty
    current.receivedQty += item.receivedQty
    current.plannedQty += item.plannedQty
    current.availableQty += item.availableQty
    current.items.push(...sourceItems)
    current.specStatus = current.specStatus === 'missing' || item.specStatus === 'missing'
      ? 'missing'
      : 'complete'
    current.transportMode = inferReadyDominantTransport(current.items)
    current.logisticsQuoteBlocking = Boolean(current.logisticsQuoteBlocking || item.logisticsQuoteBlocking)
    current.logisticsQuoteStatus = mergeReadyQuoteStatus(current.logisticsQuoteStatus, item.logisticsQuoteStatus)
    current.logisticsShippingSubmitStatus = mergeReadyShippingSubmitStatus(
      current.logisticsShippingSubmitStatus,
      item.logisticsShippingSubmitStatus
    )
    if (!hasCjkText(current.title) && hasCjkText(item.title)) {
      current.title = item.title
    }
    if (!current.imageUrl && item.imageUrl) {
      current.imageUrl = item.imageUrl
    }
  })
  return Array.from(rowMap.values())
}

export function buildReadySourceRows(items: ReadyShipmentItem[], orderMetaById: Map<string, ReceiptOrderMeta>) {
  return items.map((item) => {
    const orderMeta = orderMetaById.get(item.orderId)
    const targetSiteCode = item.targetSiteCode || item.siteCode
    const targetTransportMode = item.targetTransportMode || item.transportMode
    return {
      key: [item.fulfillmentBalanceId ? `balance:${item.fulfillmentBalanceId}` : `item:${item.id}`,
        item.orderId, item.orderNo, item.storeCode, targetSiteCode, targetTransportMode].join('__'),
      item,
      orderNo: item.orderNo,
      orderTitle: item.orderTitle || orderMeta?.title || item.orderNo,
      orderCreatedAt: item.orderCreatedAt || orderMeta?.createdAt || '',
      siteCode: targetSiteCode,
      originalSiteCode: item.originalSiteCode || item.siteCode,
      targetSiteCode,
      plannedTransportMode: item.originalTransportMode || item.transportMode,
      targetTransportMode,
      availableQty: item.availableQty,
      logisticsQuoteStatus: item.logisticsQuoteStatus,
      logisticsShippingSubmitStatus: item.logisticsShippingSubmitStatus,
      logisticsQuoteBlocking: item.logisticsQuoteBlocking
    }
  })
}

export function uniqueReadySiteCodes(item: ReadyShipmentRow) {
  const siteCodes = item.items.map((source) => source.siteCode || item.siteCode)
  return siteCodes.filter((siteCode, index, values) => values.indexOf(siteCode) === index)
}

export function uniqueFulfillmentTypes(types: Array<WarehouseFulfillmentType | undefined>) {
  const normalized = types.map((type) => type || 'WAREHOUSE_RECEIPT')
  return normalized.filter((type, index, values) => values.indexOf(type) === index)
}

export function filterReadyItems(items: ReadyShipmentRow[], filter: ReadyFilterKey) {
  if (filter === 'all') {
    return items
  }
  if (filter === 'missing') {
    return items.filter((item) => item.specStatus === 'missing')
  }
  const [siteCode, transportMode] = filter.split('-')
  return items.filter((item) => item.items.some(
    (source) => source.siteCode === siteCode && source.transportMode === transportMode
  ))
}

export function buildProductBaselineStoreCodes({
  activeTab,
  currentStoreCode,
  selectedPlan,
  visibleReadyItems
}: {
  activeTab: WarehouseDispatchTabKey
  currentStoreCode?: string
  selectedPlan?: DispatchPlan
  visibleReadyItems: ReadyShipmentRow[]
}) {
  if (activeTab === 'receipt-list') {
    return []
  }
  if (activeTab === 'ship-ready') {
    if (!visibleReadyItems.length) {
      return []
    }
    const storeCodes = visibleReadyItems.flatMap((item) => [
      item.storeCode,
      ...item.items.map((source) => source.storeCode)
    ])
    return uniqueStoreCodes(storeCodes.length ? storeCodes : [currentStoreCode])
  }
  if (!selectedPlan?.lines.length) {
    return []
  }
  const storeCodes = selectedPlan.lines.flatMap((line) => line.sources.map((source) => source.storeCode))
  return uniqueStoreCodes(storeCodes.length ? storeCodes : [currentStoreCode])
}

export function toDispatchTargetTransportMode(mode: WarehouseTransportMode): DispatchTargetTransportMode {
  return mode === 'SEA' ? 'SEA' : 'AIR'
}

export function formatReceiptSourceDate(value?: string) {
  const text = String(value || '').trim()
  return text.length >= 10 ? text.slice(0, 10) : text || '-'
}

function readyShipmentBusinessScopeKey(item: ReadyShipmentRow) {
  const sourceItems = item.items.length ? item.items : [item]
  const stores = Array.from(new Set(
    sourceItems.map((source) => normalizeProductKey(source.storeCode)).filter(Boolean)
  )).sort().join('+')
  return [stores || 'STORE', normalizeProductKey(item.psku) || normalizeProductKey(item.id),
    item.siteCode, item.transportMode, item.fulfillmentType || 'WAREHOUSE_RECEIPT', item.specStatus].join('__')
}

function inferReadyDominantTransport(items: ReadyShipmentItem[]): WarehouseTransportMode {
  const quantity = (mode: WarehouseTransportMode) => items
    .filter((item) => item.transportMode === mode)
    .reduce((total, item) => total + item.availableQty, 0)
  return quantity('SEA') > quantity('AIR') ? 'SEA' : 'AIR'
}

function mergeReadyQuoteStatus(current?: string, next?: string) {
  return current === 'PENDING_QUOTE' || next === 'PENDING_QUOTE' ? 'PENDING_QUOTE' : 'CONFIRMED'
}

function mergeReadyShippingSubmitStatus(current?: string, next?: string) {
  return current === 'NOT_SUBMITTED' || next === 'NOT_SUBMITTED' ? 'NOT_SUBMITTED' : 'SUBMITTED'
}

function uniqueStoreCodes(storeCodes: Array<string | undefined>) {
  return storeCodes.map((storeCode) => String(storeCode || '').trim())
    .filter(Boolean)
    .filter((storeCode, index, values) => values.indexOf(storeCode) === index)
}
