import type {
  OfficialWarehouseFbnReportExportItem,
  OfficialWarehouseInboundStatisticsSummary,
  OfficialWarehouseProductInboundHistoryView
} from './statisticsTypes'

export const FBN_RECEIVED_REPORT_TYPE = 'fbn_inbound_fbnreceivedreport'
export const SCHEDULED_DELIVERY_ACCURACY_REPORT_TYPE = 'fbn_inbound_scheduleddeliveryaccuracy'

export function inboundReceiptReportStatusText(connected?: boolean) {
  return connected ? '行级入仓报表已接入' : '行级入仓报表未接入'
}

export function scheduledDeliveryAccuracyStatusText(connected?: boolean) {
  return connected ? '预约到货准确率报表已接入' : '预约到货准确率报表未接入'
}

export function inboundReceiptNeedsReview(summary?: OfficialWarehouseInboundStatisticsSummary | null) {
  if (!summary?.lineReceiptReportConnected) {
    return false
  }
  return Boolean(
    (summary.receiptExceptionLineCount || 0) > 0 ||
      (summary.qcFailedQuantity || 0) > 0 ||
      (summary.unidentifiedQuantity || 0) > 0 ||
      (summary.noLocalAsnLineCount || 0) > 0 ||
      (summary.lineUnmatchedLineCount || 0) > 0 ||
      (summary.productUnmatchedLineCount || 0) > 0
  )
}

export function productInboundHistoryNeedsReview(history?: OfficialWarehouseProductInboundHistoryView | null) {
  if (!history) {
    return false
  }
  return Boolean(
    (history.summary.exceptionLineCount || 0) > 0 ||
      (history.summary.qcFailedQuantity || 0) > 0 ||
      (history.summary.unidentifiedQuantity || 0) > 0
  )
}

export function scheduledDeliveryAccuracyNeedsReview(summary?: OfficialWarehouseInboundStatisticsSummary | null) {
  if (!summary?.scheduledDeliveryAccuracyConnected) {
    return false
  }
  return Boolean(
    (summary.scheduledDeliveryAccuracyExceptionAsnCount || 0) > 0 ||
      (summary.inboundQuantityVariance || 0) > 0 ||
      (summary.noLocalScheduledDeliveryAccuracyAsnCount || 0) > 0 ||
      (summary.cancelledAsnCount || 0) > 0 ||
      (summary.expiredAsnCount || 0) > 0
  )
}

export function fbnReportTypeLabel(reportType?: string) {
  switch (normalizeReportType(reportType)) {
    case FBN_RECEIVED_REPORT_TYPE:
      return '行级入仓'
    case SCHEDULED_DELIVERY_ACCURACY_REPORT_TYPE:
      return '预约校验'
    default:
      return reportType || '-'
  }
}

export function fbnReportStatusLabel(status?: string) {
  switch (normalizeReportStatus(status)) {
    case 'COMPLETED':
      return '已完成'
    case 'RUNNING':
      return '生成中'
    case 'FAILED':
      return '失败'
    default:
      return status || '-'
  }
}

export function fbnReportStatusTone(status?: string): 'green' | 'blue' | 'red' | 'default' {
  switch (normalizeReportStatus(status)) {
    case 'COMPLETED':
      return 'green'
    case 'RUNNING':
      return 'blue'
    case 'FAILED':
      return 'red'
    default:
      return 'default'
  }
}

export function canImportFbnReportExport(
  row?: Pick<OfficialWarehouseFbnReportExportItem, 'exportCode' | 'status' | 'reportType'> | null
) {
  if (!row?.exportCode || !isSupportedFbnReportType(row.reportType)) {
    return false
  }
  return normalizeReportStatus(row.status) === 'COMPLETED'
}

export function fbnReportImportActionLabel(
  row?: Pick<OfficialWarehouseFbnReportExportItem, 'reportType'> | null
) {
  switch (normalizeReportType(row?.reportType)) {
    case FBN_RECEIVED_REPORT_TYPE:
      return '导入行级入仓'
    case SCHEDULED_DELIVERY_ACCURACY_REPORT_TYPE:
      return '导入预约校验'
    default:
      return '不支持导入'
  }
}

export function fbnReportImportKind(
  reportType?: string
): 'RECEIVED_REPORT' | 'SCHEDULED_DELIVERY_ACCURACY' | undefined {
  switch (normalizeReportType(reportType)) {
    case FBN_RECEIVED_REPORT_TYPE:
      return 'RECEIVED_REPORT'
    case SCHEDULED_DELIVERY_ACCURACY_REPORT_TYPE:
      return 'SCHEDULED_DELIVERY_ACCURACY'
    default:
      return undefined
  }
}

export function inboundStatisticsExceptionItems(summary?: OfficialWarehouseInboundStatisticsSummary | null) {
  if (!summary) {
    return []
  }
  return [
    exceptionItem('receipt-no-local-asn', '行未关联 ASN', summary.noLocalAsnLineCount, 'amber', summary.lineReceiptReportConnected),
    exceptionItem(
      'receipt-line-unmatched',
      '行级未匹配',
      (summary.lineUnmatchedLineCount || 0) + (summary.productUnmatchedLineCount || 0),
      'amber',
      summary.lineReceiptReportConnected
    ),
    exceptionItem('receipt-qc-failed', 'QC 失败件数', summary.qcFailedQuantity, 'red', summary.lineReceiptReportConnected),
    exceptionItem(
      'receipt-short-over',
      '短收/超收行',
      (summary.shortReceivedLineCount || 0) + (summary.overReceivedLineCount || 0),
      'red',
      summary.lineReceiptReportConnected
    ),
    exceptionItem(
      'scheduled-no-local-asn',
      'ASN 未关联',
      summary.noLocalScheduledDeliveryAccuracyAsnCount,
      'amber',
      summary.scheduledDeliveryAccuracyConnected
    ),
    exceptionItem(
      'scheduled-variance',
      '计划/GRN 差异',
      Math.abs(summary.inboundQuantityVariance || 0),
      'red',
      summary.scheduledDeliveryAccuracyConnected
    ),
    exceptionItem(
      'scheduled-status-exception',
      '取消/过期 ASN',
      (summary.cancelledAsnCount || 0) + (summary.expiredAsnCount || 0),
      'red',
      summary.scheduledDeliveryAccuracyConnected
    )
  ].filter((item) => item.visible && item.value > 0)
}

function exceptionItem(
  key: string,
  label: string,
  value: number | undefined,
  tone: 'amber' | 'red',
  visible: boolean | undefined
) {
  return { key, label, value: value || 0, tone, visible: Boolean(visible) }
}

export function inboundStageLabel(stage?: string) {
  switch (stage) {
    case 'RECEIVING':
      return '收货中'
    case 'GRN_COMPLETED':
      return '已入仓'
    case 'FAILED':
      return '失败'
    default:
      return stage || '-'
  }
}

export function receiptStatusLabel(status?: string) {
  switch ((status || '').trim().toUpperCase()) {
    case 'NORMAL':
      return '正常'
    case 'QC_FAILED':
      return 'QC失败'
    case 'SHORT_RECEIVED':
      return '短收'
    case 'OVER_RECEIVED':
      return '超收'
    case 'UNIDENTIFIED':
      return '未识别'
    default:
      return status || '-'
  }
}

function isSupportedFbnReportType(reportType?: string) {
  const normalized = normalizeReportType(reportType)
  return normalized === FBN_RECEIVED_REPORT_TYPE || normalized === SCHEDULED_DELIVERY_ACCURACY_REPORT_TYPE
}

function normalizeReportType(reportType?: string) {
  return (reportType || '').trim().toLowerCase()
}

function normalizeReportStatus(status?: string) {
  const normalized = (status || '').trim().toUpperCase()
  if (['COMPLETED', 'COMPLETE', 'DONE', 'SUCCESS', 'SUCCEEDED', 'READY'].includes(normalized)) {
    return 'COMPLETED'
  }
  if (['RUNNING', 'PROCESSING', 'IN_PROGRESS', 'PENDING', 'QUEUED', 'CREATED'].includes(normalized)) {
    return 'RUNNING'
  }
  if (['FAILED', 'FAILURE', 'ERROR', 'CANCELLED', 'CANCELED'].includes(normalized)) {
    return 'FAILED'
  }
  return normalized
}
