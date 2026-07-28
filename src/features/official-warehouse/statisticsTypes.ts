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

export type * from './statisticsFbnReportTypes'
