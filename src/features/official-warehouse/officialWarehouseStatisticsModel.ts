import type {
  OfficialWarehouseInboundStatisticsView,
  OfficialWarehouseProductInboundHistoryView,
  OfficialWarehouseStockStatisticsRow,
  OfficialWarehouseStockStatisticsView
} from './statisticsTypes'

export type OfficialWarehouseStatisticsTabKey = 'product' | 'inbound'
export type OfficialWarehouseStatisticsPanelMode = 'all' | 'product' | 'inbound'

export type OfficialWarehouseStatisticsPanelProps = {
  storeCode?: string
  siteCode?: string
  mode?: OfficialWarehouseStatisticsPanelMode
}

export const EMPTY_STOCK_STATS: OfficialWarehouseStockStatisticsView = {
  summary: {
    effectiveStock: 0,
    currentStock: 0,
    returnStock: 0,
    failedOrExceptionStock: 0,
    pendingConfirmationStock: 0,
    skuCount: 0,
    exceptionSkuCount: 0
  },
  rows: []
}

export const EMPTY_INBOUND_STATS: OfficialWarehouseInboundStatisticsView = {
  summary: {
    asnCount: 0,
    totalQuantity: 0,
    appointmentScheduledCount: 0,
    appointmentPendingCount: 0,
    appointmentFailedCount: 0,
    receivingAsnCount: 0,
    grnCompletedAsnCount: 0,
    failedAsnCount: 0,
    lineReceiptReportConnected: false,
    receiptLineCount: 0,
    expectedQuantity: 0,
    receivedQuantity: 0,
    qcFailedQuantity: 0,
    unidentifiedQuantity: 0,
    normalLineCount: 0,
    qcFailedLineCount: 0,
    shortReceivedLineCount: 0,
    overReceivedLineCount: 0,
    unidentifiedLineCount: 0,
    matchedLineCount: 0,
    noLocalAsnLineCount: 0,
    lineUnmatchedLineCount: 0,
    productUnmatchedLineCount: 0,
    receiptExceptionLineCount: 0,
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
  },
  rows: []
}

export const EMPTY_PRODUCT_INBOUND_HISTORY: OfficialWarehouseProductInboundHistoryView = {
  summary: {
    receiptLineCount: 0,
    expectedQuantity: 0,
    receivedQuantity: 0,
    qcFailedQuantity: 0,
    unidentifiedQuantity: 0,
    exceptionLineCount: 0
  },
  rows: [],
  sourceCandidates: []
}

export function officialWarehouseStockRowKey(
  row: OfficialWarehouseStockStatisticsRow,
  scope: { storeCode?: string; siteCode?: string }
) {
  const store = row.storeCode?.trim() || scope.storeCode?.trim() || ''
  const site = row.siteCode?.trim() || scope.siteCode?.trim() || ''
  const partnerSku = row.partnerSku?.trim() || ''
  if (store && site && partnerSku) {
    return `${store}::${site}::psku:${partnerSku}`
  }
  return `legacy-stock-row:${row.productVariantId || row.productSiteOfferId || row.skuParent || row.noonSku || 'unknown'}`
}

export function appointmentStatusLabel(status?: string) {
  switch ((status || '').trim().toUpperCase()) {
    case 'SCHEDULED':
      return '已约仓'
    case 'PENDING':
      return '待约仓'
    case 'RUNNING':
      return '约仓中'
    case 'FAILED':
      return '约仓失败'
    default:
      return status || '-'
  }
}

export function asnStatusLabel(status?: string) {
  switch ((status || '').trim().toLowerCase()) {
    case 'putaway_completed':
      return '已上架'
    case 'grn_completed':
      return '已入仓'
    case 'receiving':
      return '收货中'
    case 'scheduled':
      return '已约仓'
    case 'cancelled':
      return '已取消'
    case 'expired':
      return '已过期'
    default:
      return status || '-'
  }
}
