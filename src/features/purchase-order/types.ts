import type {
  PurchaseCollectionStatus,
  PurchaseOrderFulfillmentType,
  PurchaseOrderStatus,
  PurchaseSiteCode,
  PurchaseTransportMode,
  SiteAllocation
} from './purchaseOrderBaseTypes'
import type { OrderLogisticsQuoteSummary } from '../logistics-quote/types'

export type {
  PurchaseCollectionStatus,
  PurchaseOrderFulfillmentType,
  PurchaseOrderStatus,
  PurchaseSiteCode,
  PurchaseTransportMode,
  SiteAllocation
} from './purchaseOrderBaseTypes'
export type * from './purchaseOrderLogisticsPlanTypes'

export type PurchaseOrderItem = {
  id: string
  sourceCollectionId?: string
  sourceCollectionNo?: string
  sourcePlatform: string
  sourceTitle: string
  sourceTitleCn?: string
  sourceImageUrl?: string
  variantId: string
  skuParent: string
  partnerSku: string
  productFulltype?: string
  productSpecComplete?: boolean
  cartonSpecComplete?: boolean
  logisticsAttributeComplete?: boolean
  logisticsProfileStatus?: string
  productTitle: string
  productImageUrl?: string
  sourcingSpec?: string
  sourcingSize?: string
  sourcingColor?: string
  fulfillmentType?: PurchaseOrderFulfillmentType
  fulfillmentTypeLabel?: string
  fulfillmentSourceName?: string
  totalQuantity: number
  allocations: SiteAllocation[]
  collectionStatus: PurchaseCollectionStatus
  progress: number
  currentTaskNo?: string
  candidateCount?: number
  top5Count?: number
  failureMessage?: string
  lastCollectedAt?: string
}

export type PurchaseOrderAli1688HistorySource = {
  allocationId?: number
  orderId?: number
  itemId?: number
  assignmentId?: number
  orderNo?: string
  orderTime?: string
  supplierName?: string
  assignedQuantity?: string | number | null
  allocatedCost?: string | number | null
  unitPrice?: string | number | null
  sourceLineLabel?: string
  allocationBasis?: string
  evidenceText?: string
}

export type PurchaseOrderAli1688HistoryBatch = {
  id?: number
  label?: string
  countedQuantity?: string | number | null
  countedCost?: string | number | null
  unitPrice?: string | number | null
  sources?: PurchaseOrderAli1688HistorySource[]
}

export type PurchaseOrderAli1688HistoryRecord = {
  storeCode?: string
  siteCode?: string
  skuParent?: string
  partnerSku?: string
  pskuCode?: string
  productTitle?: string
  purchaseCount?: number
  totalQuantity?: string | number | null
  totalCost?: string | number | null
  averageUnitPrice?: string | number | null
  recentUnitPrice?: string | number | null
  recentPurchaseTime?: string
  history?: PurchaseOrderAli1688HistorySource[]
  purchaseBatches?: PurchaseOrderAli1688HistoryBatch[]
}

export type PurchaseOrderAli1688HistoryView = {
  items: PurchaseOrderAli1688HistoryRecord[]
  pagination?: {
    page: number
    pageSize: number
    total: number
  }
  unlinkedAssignedLineCount?: number
}

export type PurchaseOrder = {
  id: string
  orderNo: string
  title: string
  storeName: string
  storeCode: string
  ownerName?: string
  status: PurchaseOrderStatus
  createdAt: string
  updatedAt: string
  remark?: string
  siteCodes?: PurchaseSiteCode[]
  items: PurchaseOrderItem[]
  logisticsQuoteSummary?: OrderLogisticsQuoteSummary
}

export type ProductOption = {
  variantId: string
  skuParent?: string
  partnerSku: string
  productTitle: string
  productImageUrl?: string
  availableSiteCodes: PurchaseSiteCode[]
}

export type PurchaseOrderItemCommand = {
  psku: string
  site: PurchaseSiteCode
  transportMode: PurchaseTransportMode
  quantity: number
  fulfillmentType: PurchaseOrderFulfillmentType
  fulfillmentSourceName?: string
}

export type PurchaseOrderItemSiteQuantityCommand = {
  siteCode: PurchaseSiteCode
  transportMode: PurchaseTransportMode
  quantity: number
}

export type CreatePurchaseOrderPayload = {
  storeCode: string
  title: string
  remark?: string
  siteCodes: PurchaseSiteCode[]
  items: PurchaseOrderItemCommand[]
}

export type AddPurchaseOrderItemsPayload = {
  items: PurchaseOrderItemCommand[]
}

export type UpdatePurchaseOrderItemPayload = {
  psku?: string
  fulfillmentType?: PurchaseOrderFulfillmentType
  fulfillmentSourceName?: string
  siteQuantities: PurchaseOrderItemSiteQuantityCommand[]
}

export type UpdatePurchaseOrderPayload = {
  title: string
  remark?: string
}

export type UpdatePurchaseOrderItemSourcingRequirementPayload = {
  sourcingSpec?: string
  sourcingSize?: string
  sourcingColor?: string
}

export type PurchaseOrderShippingSubmitResult = {
  purchaseOrderId: string
  purchaseOrderNo: string
  shippingSubmitStatus: 'SUBMITTED' | string
  submittedLineCount: number
}
