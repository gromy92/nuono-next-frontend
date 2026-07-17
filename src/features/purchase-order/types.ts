export type PurchaseSiteCode = string

export type PurchaseTransportMode = 'AIR' | 'SEA' | 'UNSPECIFIED' | string

export type PurchaseOrderFulfillmentType = 'WAREHOUSE_RECEIPT' | 'FACTORY_DIRECT' | string

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
  | 'submitted'
  | 'deleted'

export type PurchaseOrderLogisticsQuoteSummary = {
  totalLineCount: number
  pendingLineCount: number
  confirmedLineCount: number
  submittedLineCount: number
  newProductLineCount: number
  shippingSubmitStatus: 'NOT_SUBMITTED' | 'SUBMITTED' | string
}

export type PurchaseOrderLogisticsQuoteChannelOption = {
  routeCode: string
  routeName?: string
  serviceCode?: string
  serviceName?: string
  siteCode?: PurchaseSiteCode
  transportMode?: PurchaseTransportMode
  transportModeLabel?: string
  country?: string
  targetPlatform?: string
  deliveryCity?: string
  destinationNode?: string
  transitTimeText?: string
  priceSummary?: string
  totalLineCount?: number
  pendingLineCount: number
  confirmedLineCount?: number
  newProductLineCount: number
  lineQuotes?: PurchaseOrderLogisticsQuoteChannelLine[]
}

export type PurchaseOrderLogisticsQuoteChannelLine = {
  shippingOrderLineId?: string
  purchaseOrderItemSiteId?: string
  partnerSku?: string
  barcode?: string
  quoteStatus?: 'PENDING_QUOTE' | 'CONFIRMED' | string
  unitPrice?: string | number | null
  currency?: string
  billingUnit?: string
  yiteMaterial?: string
}

export type PurchaseOrderLogisticsQuoteForwarderOption = {
  forwarderCode: string
  forwarderName?: string
  templateType?: string
  templateName?: string
  channels: PurchaseOrderLogisticsQuoteChannelOption[]
}

export type PurchaseOrderLogisticsQuoteOptions = {
  purchaseOrderId: string
  purchaseOrderNo?: string
  pendingLineCount: number
  unsupportedChannelCount: number
  forwarders: PurchaseOrderLogisticsQuoteForwarderOption[]
}

export type PurchaseOrderLogisticsQuoteExportSelection = {
  forwarderCode: string
  routeCode: string
}

export type PurchaseOrderLogisticsQuoteImportResult = {
  totalRows: number
  updatedRows: number
  skippedRows: number
  errors?: Array<{
    rowNumber?: number
    message?: string
  }>
}

export type PurchaseOrderShippingSubmitResult = {
  purchaseOrderId: string
  purchaseOrderNo: string
  shippingSubmitStatus: 'SUBMITTED' | string
  submittedLineCount: number
}

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

export type LogisticsBillComponent = {
  id: string
  shippingOrderSegmentId?: string
  shippingOrderLineId?: string
  quoteLineId?: string
  barcode?: string
  pskuCode?: string
  siteCode?: string
  feeType?: string
  quantity?: number
  chargeQuantity?: number
  chargeUnit?: string
  unitPrice?: number
  currency?: string
  expectedAmount?: number
  expectedAmountCny?: number
}

export type LogisticsBill = {
  id: string
  expectedBillNo: string
  shippingOrderId: string
  shippingOrderNo: string
  shippingOrderTitle?: string
  shippingOrderSegmentId?: string
  shippingOrderSegmentNo?: string
  forwarderCode?: string
  forwarderName?: string
  routeCode?: string
  routeName?: string
  serviceCode?: string
  serviceName?: string
  transportMode?: PurchaseTransportMode
  currency?: string
  expectedTotalAmount?: number
  expectedTotalCny?: number
  actualTotalCny?: number
  diffAmountCny?: number
  componentCount?: number
  billStatus?: string
  reconciliationStatus?: string
  createdAt?: string
  updatedAt?: string
  components?: LogisticsBillComponent[]
}

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
  logisticsQuoteSummary?: PurchaseOrderLogisticsQuoteSummary
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
