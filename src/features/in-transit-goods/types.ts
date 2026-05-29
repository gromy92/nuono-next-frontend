export type InTransitEnumOption = {
  code: string
  label: string
}

export type InTransitContract = {
  transportModes: InTransitEnumOption[]
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
  trackingNo?: string | null
  containerNo?: string | null
  batchReferenceNo?: string | null
  remark?: string | null
  missingFields?: string[]
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

export type InTransitBatchList = {
  mode: string
  ready: boolean
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
  etaFrom?: string
  etaTo?: string
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
  remark?: string
}

export type InTransitGoodsLine = {
  lineId: number
  batchId: number
  packageId?: number | null
  boxNo?: string | null
  sku: string
  msku?: string | null
  psku?: string | null
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
  remark?: string | null
}

export type InTransitGoodsLineList = {
  mode: string
  ready: boolean
  items: InTransitGoodsLine[]
}

export type SaveInTransitGoodsLineRequest = {
  lineId?: number
  boxNo?: string
  sku: string
  msku?: string
  psku?: string
  productName?: string
  storeCode?: string
  siteCode?: string
  shippedQuantity?: number
  receivedQuantity?: number
  cartonCount?: number
  unitsPerCarton?: number
  cartonWeightKg?: number
  cartonVolumeCbm?: number
  remark?: string
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
  nodeStatus: string
  nodeHappenedAt?: string
  description?: string
  operatorName?: string
}

export type InTransitImportIssue = {
  level: 'error' | 'warning' | string
  code: string
  message: string
  rowNumber?: number | null
  field?: string | null
}

export type InTransitImportPreviewLine = {
  rowNumber: number
  boxNo?: string | null
  sku?: string | null
  msku?: string | null
  psku?: string | null
  productName?: string | null
  storeCode?: string | null
  siteCode?: string | null
  shippedQuantity?: number | null
  receivedQuantity?: number | null
  cartonCount?: number | null
  unitsPerCarton?: number | null
  cartonWeightKg?: number | null
  cartonVolumeCbm?: number | null
  remark?: string | null
  issues?: InTransitImportIssue[]
}

export type InTransitImportPreviewBatch = {
  batchKey: string
  batchReferenceNo?: string | null
  rawForwarderName?: string | null
  standardForwarderId?: number | null
  standardForwarderName?: string | null
  forwarderQualityStatus?: string | null
  transportMode?: string | null
  targetStoreCode?: string | null
  targetSiteCode?: string | null
  targetWarehouseName?: string | null
  departureDate?: string | null
  etaDate?: string | null
  trackingNo?: string | null
  containerNo?: string | null
  batchStatus?: string | null
  remark?: string | null
  lines: InTransitImportPreviewLine[]
  issues?: InTransitImportIssue[]
}

export type InTransitImportPreview = {
  importBatchId: number
  mode: string
  ready: boolean
  status: string
  fileName?: string | null
  totalRowCount: number
  validRowCount: number
  errorCount: number
  warningCount: number
  willCreateBatchCount: number
  willUpsertLineCount: number
  batches: InTransitImportPreviewBatch[]
  issues: InTransitImportIssue[]
}

export type InTransitImportConfirm = {
  importBatchId: number
  status: string
  importedBatchCount: number
  importedLineCount: number
}
