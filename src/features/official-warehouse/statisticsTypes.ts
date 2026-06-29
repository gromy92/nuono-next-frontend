export type OfficialWarehouseStockStatisticsSummary = {
  effectiveStock: number
  currentStock: number
  returnStock: number
  failedOrExceptionStock: number
  pendingConfirmationStock: number
  skuCount: number
  exceptionSkuCount: number
}

export type OfficialWarehouseStockStatisticsRow = {
  productMasterId?: string
  productVariantId?: string
  productSiteOfferId?: string
  storeCode?: string
  storeName?: string
  siteCode?: string
  projectCode?: string
  partnerId?: string
  skuParent?: string
  partnerSku?: string
  pskuCode?: string
  noonSku?: string
  title?: string
  titleCn?: string
  titleEn?: string
  brand?: string
  imageUrl?: string
  warehouseCode?: string
  currentStock: number
  effectiveStock: number
  returnStock: number
  failedOrExceptionStock: number
  pendingConfirmationStock: number
  sourceType?: string
  inventoryConfidence?: string
  lastSyncedAt?: string
  anomalyFlags?: string[]
  warehouseStocks?: OfficialWarehouseStockWarehouse[]
}

export type OfficialWarehouseStockWarehouse = {
  warehouseCode?: string
  currentStock: number
  effectiveStock: number
  returnStock: number
  failedOrExceptionStock: number
  pendingConfirmationStock: number
}

export type OfficialWarehouseStockStatisticsView = {
  summary: OfficialWarehouseStockStatisticsSummary
  rows: OfficialWarehouseStockStatisticsRow[]
}

export type OfficialWarehouseInboundStatisticsSummary = {
  asnCount: number
  totalQuantity: number
  appointmentScheduledCount: number
  appointmentPendingCount: number
  appointmentFailedCount: number
  receivingAsnCount: number
  grnCompletedAsnCount: number
  failedAsnCount: number
  lineReceiptReportConnected: boolean
  latestReceiptImportId?: string
  latestReceiptImportedAt?: string
  receiptLineCount: number
  expectedQuantity: number
  receivedQuantity: number
  qcFailedQuantity: number
  unidentifiedQuantity: number
  normalLineCount: number
  qcFailedLineCount: number
  shortReceivedLineCount: number
  overReceivedLineCount: number
  unidentifiedLineCount: number
  matchedLineCount: number
  noLocalAsnLineCount: number
  lineUnmatchedLineCount: number
  productUnmatchedLineCount: number
  receiptExceptionLineCount: number
  scheduledDeliveryAccuracyConnected: boolean
  latestScheduledDeliveryAccuracyImportId?: string
  latestScheduledDeliveryAccuracyImportedAt?: string
  scheduledDeliveryAccuracyAsnCount: number
  scheduledQuantity: number
  grnQuantity: number
  inboundQuantityVariance: number
  putawayCompletedAsnCount: number
  cancelledAsnCount: number
  expiredAsnCount: number
  matchedScheduledDeliveryAccuracyAsnCount: number
  noLocalScheduledDeliveryAccuracyAsnCount: number
  scheduledDeliveryAccuracyExceptionAsnCount: number
}

export type OfficialWarehouseInboundStatisticsRow = {
  asnId?: string
  localAsnNo?: string
  noonAsnNr?: string
  storeCode?: string
  siteCode?: string
  localStatus?: string
  noonAsnStatus?: string
  inboundStage?: string
  appointmentStatus?: string
  totalQuantity: number
  selectedWarehouseCode?: string
  selectedWarehousePartnerCode?: string
}

export type OfficialWarehouseInboundStatisticsView = {
  summary: OfficialWarehouseInboundStatisticsSummary
  rows: OfficialWarehouseInboundStatisticsRow[]
}

export type OfficialWarehouseProductInboundHistorySummary = {
  receiptLineCount: number
  expectedQuantity: number
  receivedQuantity: number
  qcFailedQuantity: number
  unidentifiedQuantity: number
  exceptionLineCount: number
}

export type OfficialWarehouseProductInboundReceiptRow = {
  importId?: string
  reportRowId?: string
  noonAsnNr?: string
  partnerSku?: string
  pskuCode?: string
  noonSku?: string
  pbarcodeCanonical?: string
  partnerWarehouse?: string
  noonWarehouse?: string
  qtyExpected: number
  receivedQty: number
  qcFailedQty: number
  unidentifiedQty: number
  qcFailedReason?: string
  receiptStatus?: string
  matchStatus?: string
  asnCreatedAt?: string
  asnScheduleDate?: string
  asnCompletedAt?: string
  importedAt?: string
}

export type OfficialWarehouseProductStockSourceCandidate = {
  logisticsBatchId?: string
  logisticsBatchNo?: string
  logisticsStatus?: string
  purchaseOrderId?: string
  purchaseOrderNo?: string
  sourceStoreCode?: string
  siteCode?: string
  partnerSku?: string
  skuParent?: string
  quantity: number
  latestAt?: string
  relationBasis?: string
}

export type OfficialWarehouseProductInboundHistoryView = {
  summary: OfficialWarehouseProductInboundHistorySummary
  rows: OfficialWarehouseProductInboundReceiptRow[]
  sourceCandidates?: OfficialWarehouseProductStockSourceCandidate[]
}

export type OfficialWarehouseStatisticsFilters = {
  storeCode?: string
  siteCode?: string
  keyword?: string
  warehouseCode?: string
  stockBucket?: string
}

export type OfficialWarehouseInventorySyncPayload = {
  storeCode: string
  siteCode: string
  maxPages?: number
}

export type OfficialWarehouseInventorySyncResult = {
  syncBatchId?: string
  storeCode?: string
  siteCode?: string
  pageCount: number
  fetchedRows: number
  insertedRows: number
  sourceType?: string
  syncedAt?: string
}

export type OfficialWarehouseStockCorrectionPayload = {
  storeCode: string
  siteCode: string
  targetRefType: string
  targetRefId: string
  productVariantId?: string
  productSiteOfferId?: string
  fromStockBucket: string
  toStockBucket: string
  quantity: number
  warehouseCode?: string
  reasonCode?: string
  reasonText?: string
}

export type OfficialWarehouseFbnReportType =
  | 'fbn_inbound_fbnreceivedreport'
  | 'fbn_inbound_scheduleddeliveryaccuracy'
  | string

export type OfficialWarehouseFbnReportExportItem = {
  exportCode: string
  status?: string
  reportType?: OfficialWarehouseFbnReportType
  fileName?: string
  createdAt?: string
  downloadUrl?: string
}

export type OfficialWarehouseFbnReportExportListView = {
  storeCode?: string
  siteCode?: string
  page: number
  perPage: number
  hasNextPage: boolean
  sourceType?: string
  items: OfficialWarehouseFbnReportExportItem[]
}

export type OfficialWarehouseFbnReportExportCreatePayload = {
  storeCode: string
  siteCode: string
  exportCategoryCode: OfficialWarehouseFbnReportType
  fromDate: string
  toDate: string
}

export type OfficialWarehouseFbnReportExportCreateResult = {
  storeCode?: string
  siteCode?: string
  exportCode?: string
  status?: string
  reportType?: OfficialWarehouseFbnReportType
  fromDate?: string
  toDate?: string
  sourceType?: string
}

export type OfficialWarehouseFbnReportExportStatusPayload = {
  storeCode: string
  siteCode: string
  exportCode: string
  log?: boolean
}

export type OfficialWarehouseFbnReportExportStatusView = {
  storeCode?: string
  siteCode?: string
  exportCode?: string
  status?: string
  fileName?: string
  downloadUrl?: string
  message?: string
  totalRows?: number
  sourceType?: string
}

export type OfficialWarehouseFbnReportImportPayload = {
  storeCode: string
  siteCode: string
  exportCode: string
  logStatus?: boolean
}

export type OfficialWarehouseFbnReportImportResult = {
  importId?: string
  storeCode?: string
  siteCode?: string
  exportCode?: string
  reportType?: OfficialWarehouseFbnReportType
  status?: string
  totalRows?: number
  validRows?: number
  warningRows?: number
  errorRows?: number
  insertedReceiptLines?: number
  insertedAsnRows?: number
  scheduledQuantity?: number
  grnQuantity?: number
  inboundQuantityVariance?: number
  fileName?: string
  fileSha256?: string
  importedAt?: string
  sourceType?: string
}

export type OfficialWarehouseScheduledDeliveryAccuracyRematchPayload = {
  storeCode: string
  siteCode: string
  importId: string
}

export type OfficialWarehouseScheduledDeliveryAccuracyRematchResult = {
  importId?: string
  storeCode?: string
  siteCode?: string
  totalRows: number
  matchedRowsBefore: number
  noLocalAsnRowsBefore: number
  rematchedRows: number
  matchedRowsAfter: number
  noLocalAsnRowsAfter: number
}
