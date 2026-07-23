import type {
  DispatchPlan,
  DispatchPlanLine,
  DispatchPlanSource,
  PurchaseReceiptItem,
  PurchaseReceiptOrder
} from './types'
import type { ReadyShipmentRow } from './workbenchModels'
import type {
  ApiDispatchPlan,
  ApiDispatchPlanLine,
  ApiDispatchPlanSource,
  ApiPurchaseReceiptItem,
  ApiPurchaseReceiptOrder,
  ApiReadyItem
} from './dispatchApiTypes'
import {
  inferDominantTransport,
  mergeLogisticsQuoteStatus,
  mergeLogisticsShippingSubmitStatus,
  normalizeDispatchStatus,
  normalizeFulfillmentType,
  normalizeLogisticsQuoteStatus,
  normalizeLogisticsShippingSubmitStatus,
  normalizeSiteCode,
  normalizeSpecStatus,
  normalizeTransportMode
} from './apiNormalizers'
import { mapShippingBatch } from './shippingApiMappers'

export function mapReceiptOrder(order: ApiPurchaseReceiptOrder): PurchaseReceiptOrder {
  return {
    id: String(order.id || ''),
    orderNo: order.orderNo || '',
    title: order.title || '',
    storeCode: order.storeCode,
    storeName: order.storeName || '',
    createdAt: order.createdAt || '',
    items: (order.items || []).map(mapReceiptItem)
  }
}

export function mapReadyItem(item: ApiReadyItem): ReadyShipmentRow {
  const siteCode = normalizeSiteCode(item.targetSiteCode || item.siteCode)
  const targetTransportMode = normalizeTransportMode(item.targetTransportMode)
  const fulfillmentType = normalizeFulfillmentType(item.fulfillmentType)
  const specStatus = normalizeSpecStatus(item.specStatus)
  const psku = item.partnerSku || ''
  const title = item.productTitle || psku || item.skuParent || ''
  const sourceStoreKey = Array.from(
    new Set((item.sources || []).map((source) => source.sourceStoreCode).filter(Boolean))
  ).sort().join('+')
  const productKey = item.partnerSku
    ? `psku:${item.partnerSku}`
    : `legacy:${item.productVariantId || item.skuParent || ''}`
  const rowId = ['ready', sourceStoreKey || 'store', productKey, siteCode, fulfillmentType, specStatus].join('__')
  const sourceItems = (item.sources || []).map((source) => {
    const availableQty = Number(source.availableQuantity || 0)
    const originalSiteCode = normalizeSiteCode(source.siteCode || item.siteCode)
    const originalTransportMode = normalizeTransportMode(source.plannedTransportMode)
    const sourceTargetSiteCode = normalizeSiteCode(
      source.targetSiteCode || item.targetSiteCode || source.siteCode || item.siteCode
    )
    const sourceTargetTransportMode = normalizeTransportMode(
      source.targetTransportMode || item.targetTransportMode || source.plannedTransportMode
    )
    return {
      id: String(source.fulfillmentBalanceId || source.purchaseOrderItemSiteId || source.purchaseOrderItemId || rowId),
      orderId: String(source.purchaseOrderId || ''),
      orderNo: source.purchaseOrderNo || '',
      orderTitle: source.purchaseOrderTitle || source.purchaseOrderNo || '',
      storeCode: source.sourceStoreCode,
      storeName: source.sourceStoreName || '',
      psku,
      title,
      imageUrl: item.productImageUrl,
      siteCode: sourceTargetSiteCode,
      transportMode: sourceTargetTransportMode,
      fulfillmentType,
      expectedQty: 0,
      receivedQty: availableQty,
      plannedQty: 0,
      specStatus,
      availableQty,
      fulfillmentBalanceId: source.fulfillmentBalanceId,
      originalSiteCode,
      originalTransportMode,
      targetSiteCode: sourceTargetSiteCode,
      targetTransportMode: sourceTargetTransportMode,
      logisticsQuoteStatus: normalizeLogisticsQuoteStatus(source.logisticsQuoteStatus || item.logisticsQuoteStatus),
      logisticsShippingSubmitStatus: normalizeLogisticsShippingSubmitStatus(
        source.logisticsShippingSubmitStatus || item.logisticsShippingSubmitStatus
      ),
      logisticsQuoteBlocking: Boolean(source.logisticsQuoteBlocking ?? item.logisticsQuoteBlocking)
    }
  })
  const quoteValues = sourceItems.length
    ? sourceItems.map((source) => source.logisticsQuoteStatus)
    : [item.logisticsQuoteStatus]
  const shippingValues = sourceItems.length
    ? sourceItems.map((source) => source.logisticsShippingSubmitStatus)
    : [item.logisticsShippingSubmitStatus]
  return {
    id: rowId,
    orderId: '',
    orderNo: '',
    storeName: '',
    psku,
    title,
    imageUrl: item.productImageUrl,
    siteCode,
    transportMode: sourceItems.length ? inferDominantTransport(sourceItems) : targetTransportMode,
    fulfillmentType,
    expectedQty: 0,
    receivedQty: Number(item.availableQuantity || 0),
    plannedQty: 0,
    specStatus,
    availableQty: Number(item.availableQuantity || 0),
    logisticsQuoteStatus: mergeLogisticsQuoteStatus(quoteValues),
    logisticsShippingSubmitStatus: mergeLogisticsShippingSubmitStatus(shippingValues),
    logisticsQuoteBlocking: Boolean(
      item.logisticsQuoteBlocking || sourceItems.some((source) => source.logisticsQuoteBlocking)
    ),
    items: sourceItems
  }
}

export function mapDispatchPlan(plan: ApiDispatchPlan): DispatchPlan {
  return {
    id: String(plan.id || ''),
    planNo: plan.planNo || '',
    status: normalizeDispatchStatus(plan.status),
    createdAt: plan.createdAt || plan.updatedAt || '',
    handoffRequestNo: plan.handoffRequestNo,
    handoffErrorMessage: plan.handoffErrorMessage,
    lines: (plan.lines || []).map(mapDispatchPlanLine),
    currentShippingBatch: plan.currentShippingBatch ? mapShippingBatch(plan.currentShippingBatch) : undefined
  }
}

function mapReceiptItem(item: ApiPurchaseReceiptItem): PurchaseReceiptItem {
  return {
    ...item,
    id: String(item.id || ''),
    orderId: String(item.orderId || ''),
    orderNo: item.orderNo || '',
    storeCode: item.storeCode,
    storeName: item.storeName || '',
    psku: item.psku || '',
    title: item.title || item.psku || '',
    siteCode: normalizeSiteCode(item.siteCode),
    transportMode: normalizeTransportMode(item.transportMode),
    fulfillmentType: normalizeFulfillmentType(item.fulfillmentType),
    expectedQty: Number(item.expectedQty || 0),
    receivedQty: Number(item.receivedQty || 0),
    plannedQty: Number(item.plannedQty || 0),
    specStatus: normalizeSpecStatus(item.specStatus)
  }
}

function mapDispatchPlanLine(line: ApiDispatchPlanLine): DispatchPlanLine {
  return {
    id: String(line.id || ''),
    psku: line.partnerSku || '',
    title: line.productTitle || line.partnerSku || line.skuParent || '',
    imageUrl: line.productImageUrl,
    siteCode: normalizeSiteCode(line.siteCode),
    transportMode: normalizeTransportMode(line.actualTransportMode),
    fulfillmentType: normalizeFulfillmentType(line.fulfillmentType),
    specStatus: normalizeSpecStatus(line.specStatus),
    totalQuantity: Number(line.quantity || 0),
    sources: (line.sources || []).map(mapDispatchPlanSource)
  }
}

function mapDispatchPlanSource(source: ApiDispatchPlanSource): DispatchPlanSource {
  return {
    sourceItemId: String(source.fulfillmentBalanceId || source.id || ''),
    fulfillmentBalanceId: source.fulfillmentBalanceId,
    orderNo: source.purchaseOrderNo || '',
    storeCode: source.sourceStoreCode,
    storeName: source.sourceStoreName || '',
    plannedTransportMode: normalizeTransportMode(source.plannedTransportMode),
    fulfillmentType: normalizeFulfillmentType(source.fulfillmentType),
    quantity: Number(source.quantity || 0)
  }
}
