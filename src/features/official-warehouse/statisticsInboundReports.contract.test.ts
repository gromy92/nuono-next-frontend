import {
  buildCurrentStockWarehouseBreakdown,
  canImportFbnReportExport,
  fbnReportImportActionLabel,
  fbnReportStatusLabel,
  fbnReportTypeLabel,
  inboundReceiptNeedsReview,
  inboundStageLabel,
  inboundStatisticsExceptionItems,
  scheduledDeliveryAccuracyNeedsReview,
  scheduledDeliveryAccuracyStatusText,
  stockCorrectionActionLabel,
  stockSourceLabel
} from './statisticsDomain'
import type {
  OfficialWarehouseFbnReportExportItem,
  OfficialWarehouseInboundStatisticsSummary
} from './statisticsTypes'

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
if (scheduledDeliveryAccuracyNeedsReview({
  ...rematchedAccuracySummary,
  inboundQuantityVariance: 0,
  expiredAsnCount: 0,
  scheduledDeliveryAccuracyExceptionAsnCount: 0
})) {
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
if (canImportFbnReportExport({ ...completedReceivedExport, status: 'RUNNING' })) {
  throw new Error('expected running report export to block import')
}
if (canImportFbnReportExport({
  ...completedReceivedExport,
  reportType: 'fbn_inventory',
  status: 'COMPLETED'
})) {
  throw new Error('expected unsupported report export to block import')
}
if (!inboundStatisticsExceptionItems(rematchedAccuracySummary).some(
  (item) => item.key === 'scheduled-variance' && item.value === 14
)) {
  throw new Error('expected scheduled delivery variance to appear in exception items')
}
