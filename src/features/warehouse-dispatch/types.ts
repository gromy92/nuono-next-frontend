export type WarehouseSiteCode = 'SA' | 'AE'

export type WarehouseTransportMode = 'AIR' | 'SEA' | 'UNSPECIFIED'

export type WarehouseFulfillmentType = 'WAREHOUSE_RECEIPT' | 'FACTORY_DIRECT'

export type ReceiptStatus = 'pending' | 'partial' | 'ready' | 'planned' | 'exception'

export type DispatchPlanStatus =
  | 'draft'
  | 'ready_for_logistics'
  | 'handoff_failed'
  | 'logistics_requested'
  | 'cancelled'

export type ShippingBatchStatus =
  | 'draft'
  | 'option_selected'
  | 'outbound_created'
  | 'packing'
  | 'packed'
  | 'cancelled'

export type ShippingOptionType =
  | 'AUTO_RECOMMEND'
  | 'FORWARDER_ET'
  | 'FORWARDER_ZD'
  | 'COMBINATION_ZD_YT'
  | 'COMBINATION_ET_ZD'
  | 'CUSTOM'

export type ShippingForwarderPlanType = 'AUTO' | 'SINGLE' | 'COMBINATION' | 'CUSTOM'

export type ShippingEvaluationStatus = 'ready' | 'needs_review' | 'blocked' | 'pending'

export type ShippingOptionStatus = 'candidate' | 'selected'

export type OutboundOrderStatus = 'draft' | 'packing' | 'packed' | 'cancelled'

export type PackingListStatus = 'draft' | 'confirmed' | 'cancelled'

export type ProductSpecStatus = 'complete' | 'missing'

export type PurchaseReceiptItem = {
  id: string
  orderId: string
  orderNo: string
  storeCode?: string
  storeName: string
  psku: string
  title: string
  titleCn?: string
  imageUrl?: string
  siteCode: WarehouseSiteCode
  transportMode: WarehouseTransportMode
  fulfillmentType?: WarehouseFulfillmentType
  fulfillmentSourceName?: string
  expectedQty: number
  receivedQty: number
  plannedQty: number
  specStatus: ProductSpecStatus
  isNewProduct?: boolean
  exceptionText?: string
}

export type PurchaseReceiptOrder = {
  id: string
  orderNo: string
  title: string
  storeCode?: string
  storeName: string
  createdAt: string
  items: PurchaseReceiptItem[]
}

export type ReadyShipmentItem = PurchaseReceiptItem & {
  productVariantId?: number
  skuParent?: string
  orderTitle?: string
  orderCreatedAt?: string
  manualConfirmRequired?: boolean
  availableQty: number
  fulfillmentBalanceId?: number
}

export type DispatchPlanSource = {
  sourceItemId: string
  fulfillmentBalanceId?: number
  orderNo: string
  storeCode?: string
  storeName: string
  plannedTransportMode?: WarehouseTransportMode
  fulfillmentType?: WarehouseFulfillmentType
  quantity: number
}

export type DispatchPlanLine = {
  id: string
  psku: string
  title: string
  imageUrl?: string
  siteCode: WarehouseSiteCode
  transportMode: WarehouseTransportMode
  fulfillmentType?: WarehouseFulfillmentType
  specStatus: ProductSpecStatus
  totalQuantity: number
  sources: DispatchPlanSource[]
}

export type DispatchPlan = {
  id: string
  planNo: string
  status: DispatchPlanStatus
  createdAt: string
  regeneratedAt?: string
  logisticsGeneratedAt?: string
  handoffRequestNo?: string
  handoffErrorMessage?: string
  lines: DispatchPlanLine[]
}

export type ShippingBatchSource = {
  id: string
  fulfillmentBalanceId?: number
  orderNo: string
  storeCode?: string
  storeName: string
  psku: string
  title: string
  siteCode: WarehouseSiteCode
  plannedTransportMode: WarehouseTransportMode
  fulfillmentType: WarehouseFulfillmentType
  sourcePartyName?: string
  specStatus: ProductSpecStatus
  productLengthCm?: number
  productWidthCm?: number
  productHeightCm?: number
  productWeightG?: number
  logisticsProfileStatus?: string
  sensitiveFlag?: boolean
  sensitiveReasons: string[]
  reservedQuantity: number
}

export type ShippingSuggestionLineSource = {
  id: string
  batchSourceId?: number
  fulfillmentBalanceId?: number
  plannedTransportMode: WarehouseTransportMode
  quantity: number
}

export type ShippingSuggestionLine = {
  id: string
  psku: string
  title: string
  imageUrl?: string
  siteCode: WarehouseSiteCode
  actualTransportMode: WarehouseTransportMode
  fulfillmentType: WarehouseFulfillmentType
  sourcePartyName?: string
  specStatus: ProductSpecStatus
  targetForwarderCode?: string
  targetForwarderName?: string
  routeCode?: string
  routeName?: string
  cargoCategoryCode?: string
  cargoCategoryName?: string
  quoteCargoCategoryCode?: string
  quoteCargoCategoryName?: string
  cargoCategoryReviewRequired?: boolean
  actualWeightKg?: number
  volumeCbm?: number
  chargeableWeightKg?: number
  estimatedAmount?: number
  currency?: string
  quantity: number
  sources: ShippingSuggestionLineSource[]
}

export type ShippingSuggestionOption = {
  id: string
  optionType: ShippingOptionType
  optionName: string
  status: ShippingOptionStatus
  selectedFlag: boolean
  score: number
  skuCount: number
  totalQuantity: number
  airQuantity: number
  seaQuantity: number
  specMissingCount: number
  warningCount: number
  forwarderPlanType: ShippingForwarderPlanType
  autoRecommended: boolean
  targetForwarderCodes: string[]
  targetForwarderNames: string[]
  routeCodes: string[]
  evaluationStatus: ShippingEvaluationStatus
  blockedReasons: string[]
  actualWeightKg?: number
  volumeCbm?: number
  chargeableWeightKg?: number
  estimatedTotalAmount?: number
  avgUnitAmount?: number
  currency?: string
  lines: ShippingSuggestionLine[]
}

export type ShippingBatch = {
  id: string
  batchNo: string
  status: ShippingBatchStatus
  selectedOptionId?: string
  sourceCount: number
  skuCount: number
  totalQuantity: number
  createdAt?: string
  sources: ShippingBatchSource[]
  options: ShippingSuggestionOption[]
}

export type PurchaseOrderLogisticsSegment = {
  segmentKey: string
  siteCode: WarehouseSiteCode
  plannedTransportMode: WarehouseTransportMode
  skuCount: number
  totalQuantity: number
  quantityBasis?: string
  quantityBasisLabel?: string
  actualWeightKg?: number
  volumeCbm?: number
  recommendedOptionId?: string
  recommendedOptionName?: string
  recommendedEstimatedAmount?: number
  currency?: string
  defects: string[]
  missingPlanSuggestions: string[]
  options: ShippingSuggestionOption[]
}

export type PurchaseOrderLogisticsComparison = {
  purchaseOrderId: string
  purchaseOrderNo?: string
  purchaseOrderTitle?: string
  sourceStoreCode?: string
  sourceStoreName?: string
  skuCount: number
  totalQuantity: number
  quantityBasis?: string
  quantityBasisLabel?: string
  fulfillmentReadinessNote?: string
  actualWeightKg?: number
  volumeCbm?: number
  recommendedOptionId?: string
  recommendedOptionName?: string
  recommendedEstimatedAmount?: number
  currency?: string
  defects: string[]
  missingPlanSuggestions: string[]
  segments: PurchaseOrderLogisticsSegment[]
}

export type OutboundOrderLine = {
  id: string
  psku: string
  title: string
  siteCode: WarehouseSiteCode
  actualTransportMode: WarehouseTransportMode
  fulfillmentType: WarehouseFulfillmentType
  sourcePartyName?: string
  quantity: number
  packedQuantity: number
}

export type OutboundOrder = {
  id: string
  outboundNo: string
  status: OutboundOrderStatus
  originType: WarehouseFulfillmentType
  originName?: string
  skuCount: number
  totalQuantity: number
  lines: OutboundOrderLine[]
}

export type PackingList = {
  id: string
  outboundOrderId: number
  packingNo: string
  status: PackingListStatus
  boxCount: number
  packedQuantity: number
}

export type RouteGroup = {
  key: string
  siteCode: WarehouseSiteCode
  transportMode: WarehouseTransportMode
  specStatus: ProductSpecStatus
  lineCount: number
  totalQuantity: number
  issueCount: number
}
