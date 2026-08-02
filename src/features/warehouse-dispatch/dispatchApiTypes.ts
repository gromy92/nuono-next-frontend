import type { PurchaseReceiptItem, PurchaseReceiptOrder, WarehouseSiteCode, WarehouseTransportMode } from './types'
import type { ApiShippingBatch } from './shippingApiTypes'

export type DispatchTargetTransportMode = Exclude<WarehouseTransportMode, 'UNSPECIFIED'>

export type UpdateDispatchTargetPayload = {
  targetSiteCode: WarehouseSiteCode
  targetTransportMode: DispatchTargetTransportMode
}

export type ApiPurchaseReceiptOrder = Omit<PurchaseReceiptOrder, 'items'> & {
  storeCode?: string
  items?: ApiPurchaseReceiptItem[]
}

export type ApiPurchaseReceiptItem = Omit<
  PurchaseReceiptItem,
  'siteCode' | 'transportMode' | 'specStatus' | 'fulfillmentType'
> & {
  storeCode?: string
  siteCode?: string
  transportMode?: string
  specStatus?: string
  fulfillmentType?: string
}

export type ApiReadyItem = {
  productVariantId?: string
  partnerSku?: string
  skuParent?: string
  productTitle?: string
  productImageUrl?: string
  siteCode?: string
  fulfillmentType?: string
  specStatus?: string
  availableQuantity?: number
  logisticsQuoteStatus?: string
  logisticsShippingSubmitStatus?: string
  logisticsQuoteBlocking?: boolean
  targetSiteCode?: string
  targetTransportMode?: string
  sources?: ApiReadySource[]
}

export type ApiReadySource = {
  fulfillmentBalanceId?: number
  sourceStoreCode?: string
  sourceStoreName?: string
  purchaseOrderId?: number
  purchaseOrderNo?: string
  purchaseOrderTitle?: string
  purchaseOrderItemId?: number
  purchaseOrderItemSiteId?: number
  siteCode?: string
  plannedTransportMode?: string
  targetSiteCode?: string
  targetTransportMode?: string
  availableQuantity?: number
  logisticsQuoteStatus?: string
  logisticsShippingSubmitStatus?: string
  logisticsQuoteBlocking?: boolean
}

export type ApiDispatchPlan = {
  id?: string
  planNo?: string
  status?: string
  createdAt?: string
  updatedAt?: string
  handoffRequestNo?: string
  handoffErrorMessage?: string
  lines?: ApiDispatchPlanLine[]
  currentShippingBatch?: ApiShippingBatch
}

export type ApiDispatchPlanLine = {
  id?: string
  partnerSku?: string
  skuParent?: string
  productTitle?: string
  productImageUrl?: string
  siteCode?: string
  actualTransportMode?: string
  fulfillmentType?: string
  specStatus?: string
  quantity?: number
  sources?: ApiDispatchPlanSource[]
}

export type ApiDispatchPlanSource = {
  id?: string
  fulfillmentBalanceId?: number
  sourceStoreCode?: string
  sourceStoreName?: string
  purchaseOrderNo?: string
  plannedTransportMode?: string
  fulfillmentType?: string
  quantity?: number
}
