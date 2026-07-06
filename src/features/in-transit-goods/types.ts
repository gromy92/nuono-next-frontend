export type InTransitEnumOption = {
  code: string
  label: string
}

export type InTransitContract = {
  transportModes: InTransitEnumOption[]
  destinations: InTransitEnumOption[]
  batchStatuses: InTransitEnumOption[]
  nodeStatuses: InTransitEnumOption[]
  qualityStatuses: InTransitEnumOption[]
  purchaseOrderFields: string[]
  feeFields: string[]
}

export type InTransitForwarder = {
  id: number
  forwarderCode?: string
  forwarderName?: string
  status?: string
}

export type InTransitForwarderAlias = {
  id: number
  standardForwarderId?: number | null
  rawForwarderName?: string | null
  normalizedRawForwarderName?: string | null
  standardForwarderCode?: string | null
  standardForwarderName?: string | null
  status?: string | null
}

export type SaveInTransitForwarderAliasRequest = {
  rawForwarderName: string
  standardForwarderId: number
}

export type InTransitBatch = {
  batchId: number
  standardForwarderId?: number | null
  standardForwarderCode?: string | null
  standardForwarderName?: string | null
  rawForwarderName?: string | null
  normalizedRawForwarderName?: string | null
  forwarderQualityStatus?: string | null
  transportMode?: string | null
  batchStatus?: string | null
  targetStoreCode?: string | null
  targetSiteCode?: string | null
  targetWarehouseName?: string | null
  departureDate?: string | null
  etaDate?: string | null
  createdAt?: string | null
  domesticReceivedAt?: string | null
  trackingNo?: string | null
  containerNo?: string | null
  batchReferenceNo?: string | null
  externalShipmentNo?: string | null
  sourceCreatedAt?: string | null
  estimatedDepartureAt?: string | null
  estimatedArrivalAt?: string | null
  estimatedArrivalSource?: string | null
  estimatedArrivalSourceDetail?: string | null
  estimatedArrivalUpdatedAt?: string | null
  estimatedArrivalUpdatedBy?: number | null
  deliveryAppointmentText?: string | null
  missingFields?: string[]
  boxCount?: number | null
  skuCount?: number | null
  shippedQuantityTotal?: number | null
  receivedQuantityTotal?: number | null
  remainingQuantityTotal?: number | null
  cartonCountTotal?: number | null
  totalWeightKg?: number | null
  totalVolumeCbm?: number | null
  latestNodeStatus?: string | null
  latestNodeHappenedAt?: string | null
  latestNodeDescription?: string | null
}

export type InTransitBoxDetailTabRequest = {
  batchId: number
  batchReferenceNo?: string | null
  batch: InTransitBatch
  initialTab?: 'box' | 'product'
}

export type InTransitBatchList = {
  mode: string
  ready: boolean
  totalCount?: number
  page?: number
  pageSize?: number
  items: InTransitBatch[]
}

export type InTransitBatchFilters = {
  standardForwarderId?: number
  rawForwarderName?: string
  transportMode?: string
  skuKeyword?: string
  targetStoreCode?: string
  targetSiteCode?: string
  targetWarehouseName?: string
  batchStatus?: string
  statusScope?: 'active' | 'completed' | 'all'
  todo?: 'missingEstimatedArrival'
  etaFrom?: string
  etaTo?: string
  page?: number
  pageSize?: number
  sortField?: 'createdAt' | 'etaDate' | 'latestNodeHappenedAt' | 'gmtUpdated'
  sortDirection?: 'asc' | 'desc'
}

export type SaveInTransitBatchRequest = {
  batchId?: number
  standardForwarderId?: number
  rawForwarderName?: string
  transportMode?: string
  targetStoreCode?: string
  targetSiteCode?: string
  targetWarehouseName?: string
  departureDate?: string
  etaDate?: string
  trackingNo?: string
  containerNo?: string
  batchReferenceNo?: string
  batchStatus?: string
}

export type SaveInTransitEstimatedArrivalRequest = {
  estimatedArrivalAt: string
  note?: string
}

export type SaveInTransitActualArrivalRequest = {
  actualArrivalAt: string
  note?: string
}

export type InTransitGoodsLine = {
  lineId: number
  batchId: number
  packageId?: number | null
  boxNo?: string | null
  sku?: string | null
  msku?: string | null
  psku: string
  productName?: string | null
  storeCode?: string | null
  siteCode?: string | null
  shippedQuantity: number
  receivedQuantity: number
  remainingQuantity: number
  cartonCount?: number | null
  unitsPerCarton?: number | null
  cartonWeightKg?: number | null
  cartonVolumeCbm?: number | null
  externalBoxNo?: string | null
  packageTrackingNo?: string | null
  packageWeightKg?: number | null
  packageLengthCm?: number | null
  packageWidthCm?: number | null
  packageHeightCm?: number | null
  packageVolumeCbm?: number | null
  measuredWeightKg?: number | null
  measuredLengthCm?: number | null
  measuredWidthCm?: number | null
  measuredHeightCm?: number | null
  measuredVolumeCbm?: number | null
  packageStatus?: string | null
  logisticsStatus?: string | null
  matchedProductId?: number | null
  productSkuParent?: string | null
  productTitle?: string | null
  productImageUrl?: string | null
}

export type InTransitGoodsLineList = {
  mode: string
  ready: boolean
  items: InTransitGoodsLine[]
}

export type SaveInTransitGoodsLineRequest = {
  lineId?: number
  boxNo: string
  sku?: string
  msku?: string
  psku: string
  productName?: string
  storeCode?: string
  siteCode?: string
  shippedQuantity?: number
  receivedQuantity?: number
  cartonCount?: number
  unitsPerCarton?: number
  cartonWeightKg?: number
  cartonVolumeCbm?: number
  externalBoxNo?: string
  packageTrackingNo?: string
  packageWeightKg?: number
  packageLengthCm?: number
  packageWidthCm?: number
  packageHeightCm?: number
  packageVolumeCbm?: number
  measuredWeightKg?: number
  measuredLengthCm?: number
  measuredWidthCm?: number
  measuredHeightCm?: number
  measuredVolumeCbm?: number
  packageStatus?: string
  logisticsStatus?: string
}

export type InTransitLogisticsNode = {
  nodeId: number
  batchId: number
  nodeStatus: string
  nodeHappenedAt: string
  description?: string | null
  operatorName?: string | null
}

export type InTransitLogisticsNodeList = {
  mode: string
  ready: boolean
  items: InTransitLogisticsNode[]
}

export type SaveInTransitLogisticsNodeRequest = {
  nodeId?: number
  nodeStatus: string
  nodeHappenedAt?: string
  description?: string
  operatorName?: string
}

export type * from './types.freight'
export type * from './types.import'
