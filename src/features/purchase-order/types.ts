export type PurchaseSiteCode = string

export type PurchaseTransportMode = 'AIR' | 'SEA' | 'UNSPECIFIED' | string

export type PurchaseCollectionStatus =
  | 'not_started'
  | 'collecting'
  | 'succeeded'
  | 'failed'
  | 'reused'
  | 'cancelled'

export type PurchaseOrderStatus =
  | 'draft'
  | 'pending_collection'
  | 'collecting'
  | 'partial_done'
  | 'done'
  | 'exception'
  | 'deleted'

export type SiteAllocation = {
  site: PurchaseSiteCode
  siteName: string
  siteId: number
  pskuCode?: string
  transportMode?: PurchaseTransportMode
  transportModeLabel?: string
  quantity: number
  enabled: boolean
}

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
  productTitle: string
  productImageUrl?: string
  sourcingSpec?: string
  sourcingSize?: string
  sourcingColor?: string
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
}

export type LogisticsPlanSiteSummary = {
  site: PurchaseSiteCode
  siteName: string
  transportMode?: PurchaseTransportMode
  transportModeLabel?: string
  quantity: number
}

export type PurchaseOrderLogisticsPlanLine = {
  itemId: string
  partnerSku: string
  productTitle: string
  productImageUrl?: string
  totalQuantity: number
  allocations: SiteAllocation[]
  productDimensionsText?: string
  productWeightText?: string
  cartonDimensionsText?: string
  cartonWeightText?: string
  cartonQuantity?: number
  looseVolumeCbm?: number
  looseVolumeCbmText?: string
  seaQuantity?: number
  seaLooseVolumeCbm?: number
  seaLooseVolumeCbmText?: string
  airQuantity?: number
  airActualWeightKg?: number
  airActualWeightKgText?: string
  airLooseVolumeCbm?: number
  airLooseVolumeCbmText?: string
  specSourceType?: string
  missingFields: string[]
}

export type PurchaseOrderLogisticsCostComponent = {
  componentType: string
  componentName: string
  currency?: string
  unitPrice?: number
  billingUnit?: string
  billableQuantity?: number
  amount?: number
  amountText?: string
  amountStatus?: string
  includedInTotal: boolean
  formulaText?: string
  sourceServiceCode?: string
  sourceId?: number
  sourceFeeName?: string
  remark?: string
}

export type PurchaseOrderLogisticsRecommendation = {
  rank: number
  recommended: boolean
  routeCode?: string
  routeName?: string
  forwarderCode?: string
  forwarderName?: string
  serviceCode?: string
  serviceName?: string
  transportMode?: PurchaseTransportMode
  country?: string
  targetPlatform?: string
  deliveryCity?: string
  destinationNode?: string
  transitTimeText?: string
  priceSummary?: string
  cargoCategorySummary?: string
  estimateStatus?: string
  estimatedCostText?: string
  estimatedTotalAmount?: number
  estimatedTotalCostText?: string
  recurringAmountPerDay?: number
  recurringCostText?: string
  costComponents?: PurchaseOrderLogisticsCostComponent[]
  excludedCostNotes?: string[]
  reasons: string[]
  risks: string[]
}

export type PurchaseOrderLogisticsPlan = {
  id: string
  planNo: string
  purchaseOrderId: string
  purchaseOrderNo: string
  purchaseOrderTitle: string
  storeName: string
  storeCode: string
  status: string
  transportMode: string
  generatedAt: string
  itemCount: number
  skuCount: number
  totalQuantity: number
  missingItemCount: number
  estimatedSeaVolumeCbm?: number
  estimatedSeaVolumeCbmText?: string
  estimatedAirChargeableWeightKg?: number
  estimatedAirChargeableWeightKgText?: string
  recommendationStatus?: string
  siteSummaries: LogisticsPlanSiteSummary[]
  messages: string[]
  recommendations: PurchaseOrderLogisticsRecommendation[]
  lines: PurchaseOrderLogisticsPlanLine[]
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
