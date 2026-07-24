import type {
  ProductSpecStatus,
  WarehouseFulfillmentType,
  WarehouseSiteCode,
  WarehouseTransportMode
} from './warehouseCoreTypes'

export type ShippingCostComponent = {
  componentType?: string
  componentName: string
  sourceTable?: string
  sourceId?: string
  currency?: string
  unitPrice?: number
  billingUnit?: string
  billableQuantity?: number
  amount?: number
  formula?: string
  productLineCount: number
}

export type ShippingSuggestionLine = {
  id: string
  partnerSku: string
  productTitle: string
  productImageUrl?: string
  siteCode: WarehouseSiteCode
  actualTransportMode: WarehouseTransportMode
  targetForwarderCode?: string
  targetForwarderName?: string
  routeCode?: string
  routeName?: string
  cargoCategoryName?: string
  actualWeightKg?: number
  volumeCbm?: number
  chargeableWeightKg?: number
  rawBillableQuantity?: number
  minimumBillableUnit?: number
  billableQuantity?: number
  billingUnit?: string
  freightAmount?: number
  estimatedAmount?: number
  currency?: string
  minimumNotMet: boolean
  quantity: number
  costComponents: ShippingCostComponent[]
}

export type ShippingSuggestionOption = {
  id: string
  optionName: string
  optionType?: string
  status?: string
  selectedFlag: boolean
  autoRecommended: boolean
  targetForwarderCodes: string[]
  targetForwarderNames: string[]
  routeCodes: string[]
  totalQuantity: number
  airQuantity: number
  seaQuantity: number
  specMissingCount: number
  warningCount: number
  actualWeightKg?: number
  volumeCbm?: number
  chargeableWeightKg?: number
  estimatedTotalAmount?: number
  avgUnitAmount?: number
  currency?: string
  blockedReasons: string[]
  costComponents: ShippingCostComponent[]
  lines: ShippingSuggestionLine[]
}

export type ShippingBatchSource = {
  id: string
  fulfillmentBalanceId?: number
  storeCode?: string
  storeName: string
  orderNo: string
  psku: string
  title: string
  imageUrl?: string
  siteCode: WarehouseSiteCode
  transportMode: WarehouseTransportMode
  fulfillmentType?: WarehouseFulfillmentType
  specStatus: ProductSpecStatus
  reservedQuantity: number
}

export type ShippingBatch = {
  id: string
  dispatchPlanId?: string
  batchNo: string
  status: string
  selectedOptionId?: string
  sourceCount: number
  skuCount: number
  totalQuantity: number
  siteCodes?: WarehouseSiteCode[]
  transportModes?: WarehouseTransportMode[]
  optionCount: number
  packingListCount: number
  boxCount: number
  packedQuantity: number
  grossWeightKg?: number
  actualWeightKg?: number
  volumeCbm?: number
  remark?: string
  createdAt: string
  updatedAt?: string
  sources: ShippingBatchSource[]
  options: ShippingSuggestionOption[]
}

export type OutboundOrderLineSource = {
  id: string
  outboundOrderId: string
  outboundOrderLineId: string
  batchSourceId?: string
  fulfillmentBalanceId?: string
  sourceStoreCode?: string
  sourceStoreName?: string
  purchaseOrderId?: string
  purchaseOrderNo?: string
  purchaseOrderTitle?: string
  purchaseOrderItemId?: string
  purchaseOrderItemSiteId?: string
  plannedTransportMode: WarehouseTransportMode
  quantity: number
}

export type OutboundOrderLine = {
  id: string
  outboundOrderId: string
  optionLineId?: string
  logicalStoreId?: string
  storeCode?: string
  storeName?: string
  psku: string
  title: string
  imageUrl?: string
  siteCode: WarehouseSiteCode
  transportMode: WarehouseTransportMode
  fulfillmentType?: WarehouseFulfillmentType
  specStatus: ProductSpecStatus
  targetForwarderCode?: string
  targetForwarderName?: string
  routeCode?: string
  routeName?: string
  cargoCategoryCode?: string
  cargoCategoryName?: string
  packingGroupCode?: string
  packingGroupName?: string
  quantity: number
  packedQuantity: number
  sources: OutboundOrderLineSource[]
}

export type OutboundOrder = {
  id: string
  batchId: string
  optionId?: string
  outboundNo: string
  status: string
  originType?: WarehouseFulfillmentType
  originName?: string
  skuCount: number
  totalQuantity: number
  remark?: string
  createdAt: string
  updatedAt?: string
  lines: OutboundOrderLine[]
}

export type PackingList = {
  id: string
  outboundOrderId: string
  packingNo: string
  status: string
  boxCount: number
  packedQuantity: number
  grossWeightKg?: string
  volumeCbm?: string
  remark?: string
  createdAt: string
  updatedAt?: string
  boxes: PackingBox[]
}

export type IssuedShippingBatch = {
  shippingBatch: ShippingBatch
  outboundOrders: OutboundOrder[]
  packingLists: PackingList[]
}

export type PackingBox = {
  id: string
  packingListId: string
  outboundOrderId: string
  boxNo: string
  status: string
  lengthCm?: string
  widthCm?: string
  heightCm?: string
  grossWeightKg?: string
  quantity: number
  items: PackingBoxItem[]
}

export type PackingBoxItem = {
  id: string
  packingListId: string
  packingBoxId: string
  outboundOrderId: string
  outboundOrderLineId: string
  productVariantId?: string
  partnerSku: string
  siteCode: WarehouseSiteCode
  actualTransportMode: WarehouseTransportMode
  quantity: number
}
