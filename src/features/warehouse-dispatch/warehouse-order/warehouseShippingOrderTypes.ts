import type { ForwarderEligibilityStatus } from '../../logistics-quote/types'

type PurchaseSiteCode = string
type PurchaseTransportMode = 'AIR' | 'SEA' | 'UNSPECIFIED' | string
type PurchaseOrderFulfillmentType = 'WAREHOUSE_RECEIPT' | 'FACTORY_DIRECT' | string

export type ShippingOrderLine = {
  id: string
  shippingOrderSegmentId?: string
  shippingOrderSegmentNo?: string
  sourceStoreCode?: string
  sourceStoreName?: string
  purchaseOrderId: string
  purchaseOrderNo?: string
  purchaseOrderTitle?: string
  purchaseOrderItemId: string
  purchaseOrderItemSiteId: string
  partnerSku: string
  skuParent?: string
  barcode?: string
  productTitle?: string
  productTitleCn?: string
  productTitleEn?: string
  productImageUrl?: string
  siteCode?: PurchaseSiteCode
  pskuCode?: string
  yiteMaterial?: string
  plannedTransportMode?: PurchaseTransportMode
  quoteStatus?: 'PENDING_QUOTE' | 'CONFIRMED' | string
  shippingSubmitStatus?: 'NOT_SUBMITTED' | 'SUBMITTED' | string
  fulfillmentType?: PurchaseOrderFulfillmentType
  unitPrice?: string | number | null
  currency?: string
  billingUnit?: string
  priceSource?: string
  eligibilityStatus?: ForwarderEligibilityStatus
  quantity: number
}

export type ShippingOrderSegment = {
  id: string
  segmentNo: string
  siteCode?: PurchaseSiteCode | string
  transportMode?: PurchaseTransportMode | string
  forwarderCode?: string
  forwarderName?: string
  routeCode?: string
  routeName?: string
  serviceCode?: string
  serviceName?: string
  quoteStatus?: 'PENDING_QUOTE' | 'CONFIRMED' | string
  shippingSubmitStatus?: 'NOT_SUBMITTED' | 'SUBMITTED' | string
  purchaseOrderNames?: string
  purchaseOrderCount?: number
  lineCount?: number
  skuCount?: number
  totalQuantity?: number
  pendingQuoteLineCount?: number
  confirmedQuoteLineCount?: number
  missingYiteMaterialCount?: number
  submittedAt?: string
}

export type ShippingOrder = {
  id: string
  shippingOrderNo: string
  title: string
  status: string
  purchaseOrderCount: number
  lineCount: number
  skuCount: number
  totalQuantity: number
  missingYiteMaterialCount?: number
  quoteStatus: 'PENDING_QUOTE' | 'EXPORTED' | 'CONFIRMED' | string
  shippingSubmitStatus: 'NOT_SUBMITTED' | 'SUBMITTED' | string
  forwarderName?: string
  routeName?: string
  submittedAt?: string
  remark?: string
  createdAt?: string
  updatedAt?: string
  warnings?: string[]
  segments?: ShippingOrderSegment[]
  lines?: ShippingOrderLine[]
}

export type CreateShippingOrderPayload = {
  title?: string
  remark?: string
  purchaseOrderIds: string[]
}

export type UpdateShippingOrderPayload = {
  title: string
  remark?: string
}

export type UpdateShippingOrderLineYiteMaterialPayload = {
  yiteMaterial?: string
}

export type UpdateShippingOrderLineQuotePayload = {
  forwarderCode: string
  routeCode: string
  unitPrice: number
  currency: string
  billingUnit: string
  yiteMaterial?: string
  remark?: string
}

export type UpdateShippingOrderLineQuotesPayload = UpdateShippingOrderLineQuotePayload & {
  lineIds: string[]
}

export type ShippingOrderSubmitResult = {
  shippingOrderId: string
  shippingOrderNo: string
  shippingSubmitStatus: 'SUBMITTED' | string
  submittedLineCount: number
}
