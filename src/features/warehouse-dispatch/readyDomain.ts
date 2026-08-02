import type { ProductListDatasetPayload } from '../product-domain/productListTypes'
import { normalizeNoonImageUrl } from '../product-baseline'
import type { ReadyShipmentItem, WarehouseFulfillmentType, WarehouseTransportMode } from './types'
import { normalizeOwnerUserId } from './apiNormalizers'
import type {
  DispatchTargetTransportMode,
  ProductBaselineDataset,
  ProductBaselineScope,
  ProductBaselineSummary,
  ReadyFilterKey,
  ReadyShipmentRow,
  ReceiptOrderMeta,
  WarehouseDispatchTabKey
} from './workbenchModels'
import { hasCjkText, normalizeProductKey } from './workbenchUtils'

export function buildProductBaselineMap(datasets: ProductBaselineDataset[]) {
  const result: Record<string, ProductBaselineSummary> = {}
  datasets.forEach((dataset) => {
    dataset.items.forEach((item) => {
      const summary: ProductBaselineSummary = {
        ownerUserId: dataset.ownerUserId,
        storeCode: dataset.storeCode,
        psku: item.partnerSku || item.skuParent,
        skuParent: item.skuParent,
        title: item.title,
        imageUrl: normalizeNoonImageUrl(item.imageUrl || item.galleryImages?.[0]),
        productFulltype: item.productFulltype,
        detailBaselineStatus: item.detailBaselineStatus
      }
      ;[item.partnerSku, item.skuParent].forEach((productKey) => {
        const key = productBaselineMapKey(dataset, productKey)
        if (key && !result[key]) result[key] = summary
      })
    })
  })
  return result
}

export function productBaselineMapKey(scope: ProductBaselineScope, productKey?: string) {
  const ownerUserId = normalizeOwnerUserId(scope.ownerUserId)
  const storeCode = normalizeProductKey(scope.storeCode)
  const normalizedProductKey = normalizeProductKey(productKey)
  return ownerUserId && storeCode && normalizedProductKey
    ? `${ownerUserId}::${storeCode}::${normalizedProductKey}`
    : ''
}

export function resolveReadyProductBaseline(
  item: ReadyShipmentRow,
  baselineByScope: Record<string, ProductBaselineSummary>
) {
  const scope = resolveReadyProductSpecsScope(item)
  return scope ? baselineByScope[productBaselineMapKey(scope, item.psku)] : undefined
}

export function toProductBaselineDataset(
  requestScope: ProductBaselineScope,
  payload: ProductListDatasetPayload
): ProductBaselineDataset {
  const responseOwnerUserId = normalizeOwnerUserId(payload.ownerUserId)
  const responseStoreCode = String(payload.storeCode || '').trim()
  if (
    responseOwnerUserId !== requestScope.ownerUserId ||
    normalizeProductKey(responseStoreCode) !== normalizeProductKey(requestScope.storeCode)
  ) {
    throw new Error('商品基线归属校验失败')
  }
  return {
    ownerUserId: responseOwnerUserId,
    storeCode: responseStoreCode,
    items: payload.items || []
  }
}

export function mergeReadyShipmentRowsByBusinessScope(items: ReadyShipmentRow[]) {
  const rowMap = new Map<string, ReadyShipmentRow>()
  items.forEach((item, index) => {
    const key = normalizeOwnerUserId(item.ownerUserId)
      ? readyShipmentBusinessScopeKey(item)
      : `OWNER_UNKNOWN_INPUT:${index}:${normalizeProductKey(item.id)}`
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
      key: [item.ownerUserId ? `owner:${item.ownerUserId}` : 'owner:unknown',
        item.fulfillmentBalanceId ? `balance:${item.fulfillmentBalanceId}` : `item:${item.id}`,
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

export function buildProductBaselineScopes({
  activeTab,
  visibleReadyItems
}: {
  activeTab: WarehouseDispatchTabKey
  visibleReadyItems: ReadyShipmentRow[]
}): ProductBaselineScope[] {
  return activeTab === 'ship-ready'
    ? uniqueBaselineScopes(visibleReadyItems.flatMap((item) => {
      const scope = resolveReadyProductSpecsScope(item)
      return scope ? [scope] : []
    }))
    : []
}

export function readyProductBaselineScopes(item: ReadyShipmentRow) {
  const ownerUserId = normalizeOwnerUserId(item.ownerUserId)
  if (!ownerUserId) return []
  const sourceItems = item.items.length ? item.items : [item]
  const scopes = sourceItems.map((source) => ({
    ownerUserId: normalizeOwnerUserId(source.ownerUserId),
    storeCode: String(source.storeCode || '').trim()
  }))
  if (scopes.some((scope) => scope.ownerUserId !== ownerUserId || !scope.storeCode)) return []
  return uniqueBaselineScopes(scopes)
}

export function resolveReadyProductSpecsScope(item: ReadyShipmentRow) {
  const scopes = readyProductBaselineScopes(item)
  return scopes.length === 1 ? scopes[0] : undefined
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
  const ownerUserId = normalizeOwnerUserId(item.ownerUserId)
  const ownerScope = ownerUserId ? `OWNER:${ownerUserId}` : `OWNER_UNKNOWN:${normalizeProductKey(item.id)}`
  return [ownerScope, stores || 'STORE', normalizeProductKey(item.psku) || normalizeProductKey(item.id),
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

function uniqueBaselineScopes(scopes: Array<{ ownerUserId?: number; storeCode?: string }>): ProductBaselineScope[] {
  const result = new Map<string, ProductBaselineScope>()
  scopes.forEach((scope) => {
    const ownerUserId = normalizeOwnerUserId(scope.ownerUserId)
    const storeCode = String(scope.storeCode || '').trim()
    if (!ownerUserId || !storeCode) return
    result.set(`${ownerUserId}::${normalizeProductKey(storeCode)}`, { ownerUserId, storeCode })
  })
  return [...result.values()].sort((left, right) =>
    left.ownerUserId - right.ownerUserId || left.storeCode.localeCompare(right.storeCode)
  )
}
