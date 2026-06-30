import {
  canImportFbnReportExport,
  buildCurrentStockWarehouseBreakdown,
  buildProductStockSourceChain,
  fbnReportImportActionLabel,
  fbnReportStatusLabel,
  fbnReportTypeLabel,
  inboundStageLabel,
  inboundStatisticsExceptionItems,
  scheduledDeliveryAccuracyNeedsReview,
  scheduledDeliveryAccuracyStatusText,
  inboundReceiptNeedsReview,
  inboundReceiptReportStatusText,
  productInboundHistoryNeedsReview,
  receiptStatusLabel,
  inferProductStockSourceByTotal,
  normalizeOfficialWarehouseProductImageUrl,
  stockCorrectionActionLabel,
  stockRowNeedsReview,
  stockSourceLabel,
  stockStatisticsInventoryNotice
} from './statisticsDomain'
import type {
  OfficialWarehouseFbnReportExportItem,
  OfficialWarehouseInboundStatisticsSummary,
  OfficialWarehouseProductInboundHistoryView,
  OfficialWarehouseStockStatisticsRow,
  OfficialWarehouseStockStatisticsView
} from './statisticsTypes'

const pendingOnlyStats: OfficialWarehouseStockStatisticsView = {
  summary: {
    effectiveStock: 0,
    currentStock: 50,
    returnStock: 0,
    failedOrExceptionStock: 0,
    pendingConfirmationStock: 50,
    skuCount: 1,
    exceptionSkuCount: 0
  },
  rows: []
}

if (!stockStatisticsInventoryNotice(pendingOnlyStats).includes('Inventory')) {
  throw new Error('expected pending-only stock statistics to mention Inventory report')
}

const classifiedInventoryStats: OfficialWarehouseStockStatisticsView = {
  summary: {
    effectiveStock: 7,
    currentStock: 9,
    returnStock: 2,
    failedOrExceptionStock: 0,
    pendingConfirmationStock: 0,
    skuCount: 1,
    exceptionSkuCount: 0
  },
  rows: [
    {
      productSiteOfferId: '9001',
      currentStock: 9,
      effectiveStock: 7,
      returnStock: 2,
      failedOrExceptionStock: 0,
      pendingConfirmationStock: 0,
      inventoryConfidence: 'CLASSIFIED_INVENTORY',
      sourceType: 'FBN_INVENTORY_API',
      anomalyFlags: []
    }
  ]
}

if (stockStatisticsInventoryNotice(classifiedInventoryStats) !== '') {
  throw new Error('expected classified FBN inventory stats to skip fallback notice')
}

const normalRow: OfficialWarehouseStockStatisticsRow = {
  productSiteOfferId: '9001',
  currentStock: 50,
  effectiveStock: 0,
  returnStock: 0,
  failedOrExceptionStock: 0,
  pendingConfirmationStock: 50,
  inventoryConfidence: 'PENDING_CONFIRMATION_ONLY',
  anomalyFlags: []
}

if (!stockRowNeedsReview(normalRow)) {
  throw new Error('expected pending stock row to need review')
}

const anomalyRow: OfficialWarehouseStockStatisticsRow = {
  ...normalRow,
  pendingConfirmationStock: 0,
  anomalyFlags: ['BUCKET_QUANTITY_EXCEEDS_CURRENT_STOCK']
}

if (!stockRowNeedsReview(anomalyRow)) {
  throw new Error('expected anomaly stock row to need review')
}

if (inboundReceiptReportStatusText(false) !== '行级入仓报表未接入') {
  throw new Error('expected disconnected receipt report status text')
}

if (receiptStatusLabel('QC_FAILED') !== 'QC失败') {
  throw new Error('expected QC failed receipt status label')
}

const productInboundHistory: OfficialWarehouseProductInboundHistoryView = {
  summary: {
    receiptLineCount: 1,
    expectedQuantity: 12,
    receivedQuantity: 11,
    qcFailedQuantity: 1,
    unidentifiedQuantity: 0,
    exceptionLineCount: 1
  },
  rows: []
}

if (!productInboundHistoryNeedsReview(productInboundHistory)) {
  throw new Error('expected product inbound history with QC failed quantity to need review')
}

const normalizedNoonImage = normalizeOfficialWarehouseProductImageUrl(
  'https://f.nooncdn.com/pzsku/Z7DC6E68B2E32B5B81284Z/45/_/1777512091/7ede475c-7c1d-4a76-979e-a229677df2d4'
)

if (
  normalizedNoonImage !==
  'https://f.nooncdn.com/p/pzsku/Z7DC6E68B2E32B5B81284Z/45/_/1777512091/7ede475c-7c1d-4a76-979e-a229677df2d4.jpg'
) {
  throw new Error('expected official warehouse product image URL to normalize Noon pzsku CDN paths')
}

const inferredSource = inferProductStockSourceByTotal(15, [
  {
    noonAsnNr: 'A05039558PN',
    receivedQty: 10,
    qcFailedQty: 0,
    qtyExpected: 10,
    unidentifiedQty: 0,
    noonWarehouse: 'RUH01S',
    receiptStatus: 'NORMAL',
    matchStatus: 'MATCHED',
    asnCompletedAt: '2026-04-04 00:00:00'
  },
  {
    noonAsnNr: 'A05287348PN',
    receivedQty: 10,
    qcFailedQty: 0,
    qtyExpected: 10,
    unidentifiedQty: 0,
    noonWarehouse: 'RUHMS01',
    receiptStatus: 'NORMAL',
    matchStatus: 'MATCHED',
    asnCompletedAt: '2026-05-13 00:00:00'
  }
])

if (inferredSource.model !== 'FIFO_TOTAL_STOCK') {
  throw new Error('expected total-stock FIFO source inference model')
}

if (inferredSource.rows.length !== 2) {
  throw new Error('expected current stock to be allocated across newest ASN rows')
}

if (inferredSource.rows[0].noonAsnNr !== 'A05287348PN' || inferredSource.rows[0].estimatedRemainingQty !== 10) {
  throw new Error('expected newest ASN to keep its full remaining allocation first')
}

if (inferredSource.rows[1].noonAsnNr !== 'A05039558PN' || inferredSource.rows[1].estimatedRemainingQty !== 5) {
  throw new Error('expected older ASN to receive the remaining inferred stock')
}

if (inferredSource.unmatchedQuantity !== 0 || inferredSource.matchedQuantity !== 15) {
  throw new Error('expected all current stock to be covered by inferred ASN sources')
}

const inferredShortHistory = inferProductStockSourceByTotal(12, [
  {
    noonAsnNr: 'A06000001PN',
    receivedQty: 8,
    qcFailedQty: 1,
    qtyExpected: 8,
    unidentifiedQty: 0,
    receiptStatus: 'QC_FAILED',
    matchStatus: 'MATCHED',
    asnCompletedAt: '2026-06-01 00:00:00'
  }
])

if (inferredShortHistory.rows[0]?.estimatedRemainingQty !== 7 || inferredShortHistory.unmatchedQuantity !== 5) {
  throw new Error('expected source inference to subtract QC failed quantity and surface unmatched current stock')
}

const inferredDuplicateImports = inferProductStockSourceByTotal(45, [
  {
    importId: '623010',
    reportRowId: '624010',
    noonAsnNr: 'A05287348PN',
    receivedQty: 10,
    qcFailedQty: 0,
    qtyExpected: 10,
    unidentifiedQty: 0,
    partnerSku: 'PAPERSAYSB328',
    receiptStatus: 'NORMAL',
    matchStatus: 'LINE_UNMATCHED',
    asnCompletedAt: '2026-05-13 00:00:00',
    importedAt: '2026-06-24 15:51:02'
  },
  {
    importId: '623011',
    reportRowId: '624011',
    noonAsnNr: 'A05287348PN',
    receivedQty: 10,
    qcFailedQty: 0,
    qtyExpected: 10,
    unidentifiedQty: 0,
    partnerSku: 'PAPERSAYSB328',
    receiptStatus: 'NORMAL',
    matchStatus: 'MATCHED',
    asnCompletedAt: '2026-05-13 00:00:00',
    importedAt: '2026-06-18 15:55:51'
  }
])

if (
  inferredDuplicateImports.rows[0]?.estimatedRemainingQty !== 10 ||
  inferredDuplicateImports.rows[0]?.matchStatus !== 'LINE_UNMATCHED' ||
  inferredDuplicateImports.unmatchedQuantity !== 35
) {
  throw new Error('expected source inference to deduplicate repeated imports of the same ASN receipt line')
}

const stockSourceChain = buildProductStockSourceChain(inferredDuplicateImports)
if (stockSourceChain.totalQuantity !== 45) {
  throw new Error('expected source chain to use current stock as total quantity')
}

if (
  stockSourceChain.stages.asn.length !== 2 ||
  stockSourceChain.stages.asn[0]?.label !== 'A05287348PN' ||
  stockSourceChain.stages.asn[0]?.quantity !== 10 ||
  stockSourceChain.stages.asn[1]?.label !== '未匹配来源' ||
  stockSourceChain.stages.asn[1]?.quantity !== 35
) {
  throw new Error('expected source chain ASN stage to show matched ASN and unmatched current stock segments')
}

if (
  stockSourceChain.stages.logistics.length !== 1 ||
  stockSourceChain.stages.logistics[0]?.label !== '未建立关系' ||
  stockSourceChain.stages.logistics[0]?.quantity !== 45
) {
  throw new Error('expected logistics source chain stage to show missing relation placeholder')
}

if (
  stockSourceChain.stages.purchaseOrder.length !== 1 ||
  stockSourceChain.stages.purchaseOrder[0]?.label !== '待物流关系' ||
  stockSourceChain.stages.purchaseOrder[0]?.quantity !== 45
) {
  throw new Error('expected purchase order source chain stage to wait for logistics relation')
}

const sourceCandidateChain = buildProductStockSourceChain(inferredSource, [
  {
    logisticsBatchId: '700001',
    logisticsBatchNo: 'BATCH-001',
    logisticsStatus: 'READY',
    purchaseOrderId: '200001',
    purchaseOrderNo: 'PO-001',
    sourceStoreCode: '采购店铺',
    siteCode: 'SA',
    partnerSku: 'PAPERSAYSB328',
    quantity: 10,
    latestAt: '2026-06-20 10:00:00',
    relationBasis: '同商品 / 同站点 / 物流批次来源'
  },
  {
    logisticsBatchId: '700002',
    logisticsBatchNo: 'BATCH-002',
    logisticsStatus: 'READY',
    purchaseOrderId: '200002',
    purchaseOrderNo: 'PO-002',
    siteCode: 'SA',
    partnerSku: 'PAPERSAYSB328',
    quantity: 8,
    latestAt: '2026-06-18 10:00:00',
    relationBasis: '同商品 / 同站点 / 物流批次来源'
  }
])

if (
  sourceCandidateChain.stages.logistics.length !== 2 ||
  sourceCandidateChain.stages.logistics[0]?.label !== 'BATCH-001' ||
  sourceCandidateChain.stages.logistics[0]?.quantity !== 10 ||
  sourceCandidateChain.stages.logistics[0]?.status !== 'CANDIDATE' ||
  sourceCandidateChain.stages.logistics[1]?.label !== 'BATCH-002' ||
  sourceCandidateChain.stages.logistics[1]?.quantity !== 5
) {
  throw new Error('expected logistics candidates to be allocated by current stock total')
}

if (
  sourceCandidateChain.stages.purchaseOrder.length !== 2 ||
  sourceCandidateChain.stages.purchaseOrder[0]?.label !== 'PO-001' ||
  sourceCandidateChain.stages.purchaseOrder[0]?.quantity !== 10 ||
  sourceCandidateChain.stages.purchaseOrder[1]?.label !== 'PO-002' ||
  sourceCandidateChain.stages.purchaseOrder[1]?.quantity !== 5
) {
  throw new Error('expected purchase order candidates to follow logistics candidate allocation')
}

const emptyStockSourceChain = buildProductStockSourceChain(inferProductStockSourceByTotal(0, []))
if (
  emptyStockSourceChain.totalQuantity !== 0 ||
  emptyStockSourceChain.stages.asn.length ||
  emptyStockSourceChain.stages.logistics.length ||
  emptyStockSourceChain.stages.purchaseOrder.length
) {
  throw new Error('expected empty current stock to produce no source chain segments')
}

const receivedSummary: OfficialWarehouseInboundStatisticsSummary = {
  asnCount: 2,
  totalQuantity: 10,
  appointmentScheduledCount: 1,
  appointmentPendingCount: 0,
  appointmentFailedCount: 0,
  receivingAsnCount: 1,
  grnCompletedAsnCount: 0,
  failedAsnCount: 0,
  lineReceiptReportConnected: true,
  receiptLineCount: 3,
  expectedQuantity: 10,
  receivedQuantity: 9,
  qcFailedQuantity: 1,
  unidentifiedQuantity: 0,
  normalLineCount: 1,
  qcFailedLineCount: 1,
  shortReceivedLineCount: 1,
  overReceivedLineCount: 0,
  unidentifiedLineCount: 0,
  matchedLineCount: 1,
  noLocalAsnLineCount: 2,
  lineUnmatchedLineCount: 0,
  productUnmatchedLineCount: 0,
  receiptExceptionLineCount: 2,
  scheduledDeliveryAccuracyConnected: false,
  scheduledDeliveryAccuracyAsnCount: 0,
  scheduledQuantity: 0,
  grnQuantity: 0,
  inboundQuantityVariance: 0,
  putawayCompletedAsnCount: 0,
  cancelledAsnCount: 0,
  expiredAsnCount: 0,
  matchedScheduledDeliveryAccuracyAsnCount: 0,
  noLocalScheduledDeliveryAccuracyAsnCount: 0,
  scheduledDeliveryAccuracyExceptionAsnCount: 0
}

if (!inboundReceiptNeedsReview(receivedSummary)) {
  throw new Error('expected received report summary with exceptions to need review')
}

const rematchedAccuracySummary: OfficialWarehouseInboundStatisticsSummary = {
  ...receivedSummary,
  lineReceiptReportConnected: false,
  receiptExceptionLineCount: 0,
  scheduledDeliveryAccuracyConnected: true,
  latestScheduledDeliveryAccuracyImportId: '623003',
  scheduledDeliveryAccuracyAsnCount: 78,
  scheduledQuantity: 4200,
  grnQuantity: 4186,
  inboundQuantityVariance: 14,
  putawayCompletedAsnCount: 61,
  expiredAsnCount: 17,
  matchedScheduledDeliveryAccuracyAsnCount: 78,
  noLocalScheduledDeliveryAccuracyAsnCount: 0,
  scheduledDeliveryAccuracyExceptionAsnCount: 17
}

if (scheduledDeliveryAccuracyStatusText(false) !== '预约到货准确率报表未接入') {
  throw new Error('expected disconnected scheduled delivery accuracy status text')
}

if (!scheduledDeliveryAccuracyNeedsReview(rematchedAccuracySummary)) {
  throw new Error('expected scheduled delivery accuracy variance/status exceptions to need review')
}

if (scheduledDeliveryAccuracyNeedsReview({ ...rematchedAccuracySummary, inboundQuantityVariance: 0, expiredAsnCount: 0, scheduledDeliveryAccuracyExceptionAsnCount: 0 })) {
  throw new Error('expected rematched clean scheduled delivery accuracy summary to skip review')
}

if (inboundStageLabel('RECEIVING') !== '收货中') {
  throw new Error('expected receiving inbound stage to use Chinese copy')
}

if (stockCorrectionActionLabel() !== '订正分类') {
  throw new Error('expected stock correction action label to avoid two-character button spacing')
}

if (stockSourceLabel('FBN_INVENTORY_API') !== 'FBN库存') {
  throw new Error('expected FBN inventory source label')
}

const currentStockBreakdown = buildCurrentStockWarehouseBreakdown(56, [
  {
    warehouseCode: 'DMMMS01',
    currentStock: 2,
    effectiveStock: 2,
    returnStock: 0,
    failedOrExceptionStock: 0,
    pendingConfirmationStock: 0
  },
  {
    warehouseCode: 'RUH01S',
    currentStock: 25,
    effectiveStock: 25,
    returnStock: 0,
    failedOrExceptionStock: 0,
    pendingConfirmationStock: 0
  },
  {
    warehouseCode: 'RUHMS03',
    currentStock: 3,
    effectiveStock: 3,
    returnStock: 0,
    failedOrExceptionStock: 0,
    pendingConfirmationStock: 0
  }
])

if (
  currentStockBreakdown.totalStock !== 56 ||
  currentStockBreakdown.fbnEffectiveStock !== 25 ||
  currentStockBreakdown.supermallEffectiveStock !== 5
) {
  throw new Error('expected current stock breakdown to summarize warehouse and Supermall quantities')
}

if (
  currentStockBreakdown.rows.length !== 3 ||
  currentStockBreakdown.rows[0]?.warehouseCode !== 'RUH01S' ||
  currentStockBreakdown.rows[0]?.warehouseTypeLabel !== '仓' ||
  currentStockBreakdown.rows[1]?.warehouseCode !== 'RUHMS03' ||
  currentStockBreakdown.rows[1]?.warehouseTypeLabel !== 'Supermall'
) {
  throw new Error('expected current stock breakdown rows to sort by effective stock and label warehouse type')
}

const completedReceivedExport: OfficialWarehouseFbnReportExportItem = {
  exportCode: 'exp-001',
  status: 'COMPLETED',
  reportType: 'fbn_inbound_fbnreceivedreport',
  fileName: 'fbn_inbound_fbnreceivedreport.csv'
}

if (fbnReportTypeLabel(completedReceivedExport.reportType) !== '行级入仓') {
  throw new Error('expected received report category label')
}

if (fbnReportStatusLabel('COMPLETED') !== '已完成') {
  throw new Error('expected completed export status label')
}

if (!canImportFbnReportExport(completedReceivedExport)) {
  throw new Error('expected completed received report export to be importable')
}

if (fbnReportImportActionLabel(completedReceivedExport) !== '导入行级入仓') {
  throw new Error('expected received report import action label')
}

if (
  canImportFbnReportExport({
    ...completedReceivedExport,
    status: 'RUNNING'
  })
) {
  throw new Error('expected running report export to block import')
}

if (
  canImportFbnReportExport({
    ...completedReceivedExport,
    reportType: 'fbn_inventory',
    status: 'COMPLETED'
  })
) {
  throw new Error('expected unsupported report export to block import')
}

if (
  !inboundStatisticsExceptionItems(rematchedAccuracySummary).some(
    (item) => item.key === 'scheduled-variance' && item.value === 14
  )
) {
  throw new Error('expected scheduled delivery variance to appear in exception items')
}
