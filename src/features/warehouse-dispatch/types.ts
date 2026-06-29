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

export type ProductSpecStatus = 'complete' | 'missing'

export type LogisticsQuoteStatus = 'PENDING_QUOTE' | 'CONFIRMED' | string

export type LogisticsShippingSubmitStatus = 'NOT_SUBMITTED' | 'SUBMITTED' | string

export type PurchaseReceiptItem = {
  id: string
  orderId: string
  orderNo: string
  storeCode?: string
  storeName: string
  psku: string
  title: string
  imageUrl?: string
  siteCode: WarehouseSiteCode
  transportMode: WarehouseTransportMode
  fulfillmentType?: WarehouseFulfillmentType
  fulfillmentSourceName?: string
  expectedQty: number
  receivedQty: number
  plannedQty: number
  specStatus: ProductSpecStatus
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
  orderTitle?: string
  orderCreatedAt?: string
  availableQty: number
  fulfillmentBalanceId?: number
  logisticsQuoteStatus?: LogisticsQuoteStatus
  logisticsShippingSubmitStatus?: LogisticsShippingSubmitStatus
  logisticsQuoteBlocking?: boolean
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

export type RouteGroup = {
  key: string
  siteCode: WarehouseSiteCode
  transportMode: WarehouseTransportMode
  specStatus: ProductSpecStatus
  lineCount: number
  totalQuantity: number
  issueCount: number
}
