export type ApiShippingBatch = {
  id?: string
  dispatchPlanId?: string | number
  batchNo?: string
  status?: string
  selectedOptionId?: string
  sourceCount?: number
  skuCount?: number
  totalQuantity?: number
  optionCount?: number
  packingListCount?: number
  boxCount?: number
  packedQuantity?: number
  grossWeightKg?: number | string
  actualWeightKg?: number | string
  volumeCbm?: number | string
  remark?: string
  createdAt?: string
  updatedAt?: string
  sources?: ApiShippingBatchSource[]
  options?: ApiShippingSuggestionOption[]
}

export type ApiShippingBatchSource = {
  id?: string
  fulfillmentBalanceId?: number
  sourceStoreCode?: string
  sourceStoreName?: string
  purchaseOrderNo?: string
  partnerSku?: string
  skuParent?: string
  productTitle?: string
  productImageUrl?: string
  siteCode?: string
  plannedTransportMode?: string
  fulfillmentType?: string
  specStatus?: string
  reservedQuantity?: number
}

export type ApiShippingSuggestionOption = {
  id?: string
  optionName?: string
  optionType?: string
  status?: string
  selectedFlag?: boolean
  autoRecommended?: boolean
  targetForwarderCodes?: string[]
  targetForwarderNames?: string[]
  routeCodes?: string[]
  totalQuantity?: number
  airQuantity?: number
  seaQuantity?: number
  specMissingCount?: number
  warningCount?: number
  actualWeightKg?: number | string
  volumeCbm?: number | string
  chargeableWeightKg?: number | string
  estimatedTotalAmount?: number | string
  avgUnitAmount?: number | string
  currency?: string
  blockedReasons?: string[]
  costComponents?: ApiShippingCostComponent[]
  lines?: ApiShippingSuggestionLine[]
}

export type ApiShippingCostComponent = {
  componentType?: string
  componentName?: string
  sourceTable?: string
  sourceId?: number | string
  currency?: string
  unitPrice?: number | string
  billingUnit?: string
  billableQuantity?: number | string
  amount?: number | string
  formula?: string
  productLineCount?: number
}

export type ApiShippingSuggestionLine = {
  id?: string | number
  partnerSku?: string
  productTitle?: string
  productImageUrl?: string
  siteCode?: string
  actualTransportMode?: string
  targetForwarderCode?: string
  targetForwarderName?: string
  routeCode?: string
  routeName?: string
  cargoCategoryName?: string
  actualWeightKg?: number | string
  volumeCbm?: number | string
  chargeableWeightKg?: number | string
  rawBillableQuantity?: number | string
  minimumBillableUnit?: number | string
  billableQuantity?: number | string
  billingUnit?: string
  freightAmount?: number | string
  estimatedAmount?: number | string
  currency?: string
  minimumNotMet?: boolean
  quantity?: number
  costComponents?: ApiShippingCostComponent[]
}

export type ApiOutboundOrder = {
  id?: string
  batchId?: number | string
  optionId?: number | string
  outboundNo?: string
  status?: string
  originType?: string
  originName?: string
  skuCount?: number
  totalQuantity?: number
  remark?: string
  createdAt?: string
  updatedAt?: string
  lines?: ApiOutboundOrderLine[]
}

export type ApiOutboundOrderLine = {
  id?: string
  outboundOrderId?: number | string
  optionLineId?: number | string
  logicalStoreId?: number | string
  sourceStoreCode?: string
  sourceStoreName?: string
  partnerSku?: string
  skuParent?: string
  productTitle?: string
  productImageUrl?: string
  siteCode?: string
  actualTransportMode?: string
  fulfillmentType?: string
  specStatus?: string
  targetForwarderCode?: string
  targetForwarderName?: string
  routeCode?: string
  routeName?: string
  cargoCategoryCode?: string
  cargoCategoryName?: string
  packingGroupCode?: string
  packingGroupName?: string
  quantity?: number
  packedQuantity?: number
  sources?: ApiOutboundOrderLineSource[]
}

export type ApiOutboundOrderLineSource = {
  id?: string
  outboundOrderId?: number | string
  outboundOrderLineId?: number | string
  batchSourceId?: number | string
  fulfillmentBalanceId?: number | string
  sourceStoreCode?: string
  sourceStoreName?: string
  purchaseOrderId?: number | string
  purchaseOrderNo?: string
  purchaseOrderTitle?: string
  purchaseOrderItemId?: number | string
  purchaseOrderItemSiteId?: number | string
  plannedTransportMode?: string
  quantity?: number
}

export type ApiPackingList = {
  id?: string
  outboundOrderId?: number | string
  packingNo?: string
  status?: string
  boxCount?: number
  packedQuantity?: number
  grossWeightKg?: string
  volumeCbm?: string
  remark?: string
  createdAt?: string
  updatedAt?: string
  boxes?: ApiPackingBox[]
}

export type ApiIssuedShippingBatch = {
  shippingBatch?: ApiShippingBatch
  outboundOrders?: ApiOutboundOrder[]
  packingLists?: ApiPackingList[]
}

export type ApiPackingBox = {
  id?: string
  packingListId?: number | string
  outboundOrderId?: number | string
  boxNo?: string
  status?: string
  lengthCm?: string
  widthCm?: string
  heightCm?: string
  grossWeightKg?: string
  quantity?: number
  items?: ApiPackingBoxItem[]
}

export type ApiPackingBoxItem = {
  id?: string
  packingListId?: number | string
  packingBoxId?: number | string
  outboundOrderId?: number | string
  outboundOrderLineId?: number | string
  productVariantId?: number | string
  partnerSku?: string
  siteCode?: string
  actualTransportMode?: string
  quantity?: number
}
