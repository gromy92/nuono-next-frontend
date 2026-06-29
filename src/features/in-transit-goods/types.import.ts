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
  psku: string
  productName?: string | null
  storeCode?: string | null
  siteCode?: string | null
  shippedQuantity?: number | null
  receivedQuantity?: number | null
  cartonCount?: number | null
  unitsPerCarton?: number | null
  cartonWeightKg?: number | null
  cartonVolumeCbm?: number | null
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
  domesticReceivedAt?: string | null
  outboundAt?: string | null
  customsReleasedAt?: string | null
  etWarehouseReceivedAt?: string | null
  trackingNo?: string | null
  containerNo?: string | null
  batchStatus?: string | null
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
  importedNodeCount?: number
}
