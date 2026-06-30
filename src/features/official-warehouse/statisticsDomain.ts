import type {
  OfficialWarehouseFbnReportExportItem,
  OfficialWarehouseInboundStatisticsSummary,
  OfficialWarehouseProductInboundHistoryView,
  OfficialWarehouseProductInboundReceiptRow,
  OfficialWarehouseProductStockSourceCandidate,
  OfficialWarehouseStockStatisticsRow,
  OfficialWarehouseStockWarehouse,
  OfficialWarehouseStockStatisticsView
} from './statisticsTypes'

export const FBN_RECEIVED_REPORT_TYPE = 'fbn_inbound_fbnreceivedreport'
export const SCHEDULED_DELIVERY_ACCURACY_REPORT_TYPE = 'fbn_inbound_scheduleddeliveryaccuracy'

export function stockStatisticsInventoryNotice(stats?: OfficialWarehouseStockStatisticsView | null) {
  if (!stats) {
    return ''
  }
  const hasClassifiedInventory = stats.rows.some(
    (row) => row.inventoryConfidence === 'CLASSIFIED_INVENTORY' || row.sourceType === 'FBN_INVENTORY_API'
  )
  const hasPendingFallback =
    stats.rows.some((row) => row.inventoryConfidence === 'PENDING_CONFIRMATION_ONLY') ||
    (!hasClassifiedInventory && stats.summary.pendingConfirmationStock > 0)
  if (!hasPendingFallback) {
    return ''
  }
  return 'Noon Inventory 分类报表未接入，当前库存来自 FBN + Supermall 摘要，默认全部待确认。'
}

export function stockRowNeedsReview(row: OfficialWarehouseStockStatisticsRow) {
  return Boolean(row.pendingConfirmationStock > 0 || row.anomalyFlags?.length)
}

export type CurrentStockWarehouseType = 'FBN' | 'SUPERMALL' | 'UNKNOWN'

export type CurrentStockWarehouseBreakdownRow = {
  key: string
  warehouseCode: string
  warehouseType: CurrentStockWarehouseType
  warehouseTypeLabel: string
  currentStock: number
  effectiveStock: number
  returnStock: number
  failedOrExceptionStock: number
  pendingConfirmationStock: number
}

export type CurrentStockWarehouseBreakdown = {
  totalStock: number
  fbnEffectiveStock: number
  supermallEffectiveStock: number
  otherEffectiveStock: number
  rows: CurrentStockWarehouseBreakdownRow[]
}

export function buildCurrentStockWarehouseBreakdown(
  totalStock: number,
  warehouseStocks?: OfficialWarehouseStockWarehouse[] | null
): CurrentStockWarehouseBreakdown {
  const rows = (warehouseStocks || [])
    .map((stock, index) => {
      const warehouseCode = (stock.warehouseCode || '').trim() || '未标仓'
      const warehouseType = currentStockWarehouseType(warehouseCode)
      return {
        key: `${warehouseCode}-${index}`,
        warehouseCode,
        warehouseType,
        warehouseTypeLabel: currentStockWarehouseTypeLabel(warehouseType),
        currentStock: nonNegativeInteger(stock.currentStock),
        effectiveStock: nonNegativeInteger(stock.effectiveStock),
        returnStock: nonNegativeInteger(stock.returnStock),
        failedOrExceptionStock: nonNegativeInteger(stock.failedOrExceptionStock),
        pendingConfirmationStock: nonNegativeInteger(stock.pendingConfirmationStock)
      }
    })
    .filter((stock) => stock.currentStock > 0)
    .sort((left, right) => {
      if (right.effectiveStock !== left.effectiveStock) {
        return right.effectiveStock - left.effectiveStock
      }
      if (right.currentStock !== left.currentStock) {
        return right.currentStock - left.currentStock
      }
      return left.warehouseCode.localeCompare(right.warehouseCode)
    })

  return {
    totalStock: nonNegativeInteger(totalStock),
    fbnEffectiveStock: rows
      .filter((stock) => stock.warehouseType === 'FBN')
      .reduce((sum, stock) => sum + stock.effectiveStock, 0),
    supermallEffectiveStock: rows
      .filter((stock) => stock.warehouseType === 'SUPERMALL')
      .reduce((sum, stock) => sum + stock.effectiveStock, 0),
    otherEffectiveStock: rows
      .filter((stock) => stock.warehouseType === 'UNKNOWN')
      .reduce((sum, stock) => sum + stock.effectiveStock, 0),
    rows
  }
}

function currentStockWarehouseType(warehouseCode: string): CurrentStockWarehouseType {
  const normalized = warehouseCode.trim().toUpperCase()
  if (!normalized || normalized === '未标仓') {
    return 'UNKNOWN'
  }
  return normalized === 'RUH01S' ? 'FBN' : 'SUPERMALL'
}

function currentStockWarehouseTypeLabel(type: CurrentStockWarehouseType) {
  if (type === 'FBN') {
    return '仓'
  }
  if (type === 'SUPERMALL') {
    return 'Supermall'
  }
  return '未标仓'
}

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

export type ProductStockSourceInferenceRow = {
  noonAsnNr: string
  estimatedRemainingQty: number
  allocatableQty: number
  receivedQty: number
  qcFailedQty: number
  receiptStatus?: string
  matchStatus?: string
  asnCompletedAt?: string
  asnScheduleDate?: string
  importedAt?: string
}

export type ProductStockSourceInference = {
  model: 'FIFO_TOTAL_STOCK'
  currentStock: number
  matchedQuantity: number
  unmatchedQuantity: number
  totalAllocatableInboundQuantity: number
  rows: ProductStockSourceInferenceRow[]
}

export type ProductStockSourceChainStage = 'ASN' | 'LOGISTICS' | 'PURCHASE_ORDER'

export type ProductStockSourceChainSegmentStatus =
  | 'MATCHED'
  | 'CANDIDATE'
  | 'UNMATCHED'
  | 'RELATION_MISSING'
  | 'WAITING_RELATION'

export type ProductStockSourceChainSegment = {
  key: string
  stage: ProductStockSourceChainStage
  label: string
  quantity: number
  status: ProductStockSourceChainSegmentStatus
  detail: Record<string, string>
}

export type ProductStockSourceChain = {
  totalQuantity: number
  stages: {
    asn: ProductStockSourceChainSegment[]
    logistics: ProductStockSourceChainSegment[]
    purchaseOrder: ProductStockSourceChainSegment[]
  }
}

export function inferProductStockSourceByTotal(
  currentStock: number,
  inboundRows?: OfficialWarehouseProductInboundReceiptRow[] | null
): ProductStockSourceInference {
  let remainingStock = nonNegativeInteger(currentStock)
  const sortedRows = deduplicateProductInboundReceiptRows(inboundRows || [])
    .map((row, index) => ({
      row,
      index,
      allocatableQty: Math.max(nonNegativeInteger(row.receivedQty) - nonNegativeInteger(row.qcFailedQty), 0)
    }))
    .filter((item) => item.allocatableQty > 0)
    .sort((left, right) => {
      const rightTime = productInboundHistoryTime(right.row)
      const leftTime = productInboundHistoryTime(left.row)
      if (rightTime !== leftTime) {
        return rightTime - leftTime
      }
      return right.index - left.index
    })

  const byAsn = new Map<string, ProductStockSourceInferenceRow>()
  let totalAllocatableInboundQuantity = 0
  let matchedQuantity = 0

  for (const item of sortedRows) {
    totalAllocatableInboundQuantity += item.allocatableQty
    if (remainingStock <= 0) {
      continue
    }
    const estimatedRemainingQty = Math.min(remainingStock, item.allocatableQty)
    remainingStock -= estimatedRemainingQty
    matchedQuantity += estimatedRemainingQty
    const noonAsnNr = item.row.noonAsnNr || '未关联 ASN'
    const existing = byAsn.get(noonAsnNr)
    if (existing) {
      existing.estimatedRemainingQty += estimatedRemainingQty
      existing.allocatableQty += item.allocatableQty
      existing.receivedQty += nonNegativeInteger(item.row.receivedQty)
      existing.qcFailedQty += nonNegativeInteger(item.row.qcFailedQty)
      continue
    }
    byAsn.set(noonAsnNr, {
      noonAsnNr,
      estimatedRemainingQty,
      allocatableQty: item.allocatableQty,
      receivedQty: nonNegativeInteger(item.row.receivedQty),
      qcFailedQty: nonNegativeInteger(item.row.qcFailedQty),
      receiptStatus: item.row.receiptStatus,
      matchStatus: item.row.matchStatus,
      asnCompletedAt: item.row.asnCompletedAt,
      asnScheduleDate: item.row.asnScheduleDate,
      importedAt: item.row.importedAt
    })
  }

  return {
    model: 'FIFO_TOTAL_STOCK',
    currentStock: nonNegativeInteger(currentStock),
    matchedQuantity,
    unmatchedQuantity: remainingStock,
    totalAllocatableInboundQuantity,
    rows: Array.from(byAsn.values())
  }
}

export function buildProductStockSourceChain(
  inference: ProductStockSourceInference,
  sourceCandidates: OfficialWarehouseProductStockSourceCandidate[] = []
): ProductStockSourceChain {
  const totalQuantity = nonNegativeInteger(inference.currentStock)
  const asnSegments: ProductStockSourceChainSegment[] = inference.rows
    .filter((row) => nonNegativeInteger(row.estimatedRemainingQty) > 0)
    .map((row) => ({
      key: `asn-${row.noonAsnNr || 'UNLINKED'}`,
      stage: 'ASN' as const,
      label: row.noonAsnNr || '未关联 ASN',
      quantity: nonNegativeInteger(row.estimatedRemainingQty),
      status: 'MATCHED' as const,
      detail: {
        ASN: row.noonAsnNr || '未关联 ASN',
        推算剩余: `${nonNegativeInteger(row.estimatedRemainingQty).toLocaleString()} 件`,
        可分摊入仓: `${nonNegativeInteger(row.allocatableQty).toLocaleString()} 件`,
        实收: `${nonNegativeInteger(row.receivedQty).toLocaleString()} 件`,
        QC失败: `${nonNegativeInteger(row.qcFailedQty).toLocaleString()} 件`,
        完成时间: row.asnCompletedAt || row.asnScheduleDate || row.importedAt || '-',
        状态: receiptStatusLabel(row.receiptStatus)
      }
    }))

  if (nonNegativeInteger(inference.unmatchedQuantity) > 0) {
    asnSegments.push({
      key: 'asn-unmatched',
      stage: 'ASN',
      label: '未匹配来源',
      quantity: nonNegativeInteger(inference.unmatchedQuantity),
      status: 'UNMATCHED',
      detail: {
        说明: '当前库存超过已导入入仓行可分摊数量，暂无法推算到具体 ASN。',
        未匹配数量: `${nonNegativeInteger(inference.unmatchedQuantity).toLocaleString()} 件`
      }
    })
  }

  const logisticsSegments = buildCandidateSourceSegments(totalQuantity, sourceCandidates, 'LOGISTICS')
  const purchaseOrderSegments = buildCandidateSourceSegments(totalQuantity, sourceCandidates, 'PURCHASE_ORDER')

  return {
    totalQuantity,
    stages: {
      asn: asnSegments,
      logistics: logisticsSegments.length
        ? logisticsSegments
        : missingSourceSegments(totalQuantity, 'LOGISTICS'),
      purchaseOrder: purchaseOrderSegments.length
        ? purchaseOrderSegments
        : missingSourceSegments(totalQuantity, 'PURCHASE_ORDER')
    }
  }
}

function buildCandidateSourceSegments(
  totalQuantity: number,
  sourceCandidates: OfficialWarehouseProductStockSourceCandidate[],
  stage: ProductStockSourceChainStage
): ProductStockSourceChainSegment[] {
  let remainingQuantity = nonNegativeInteger(totalQuantity)
  if (!remainingQuantity) {
    return []
  }
  const groups = new Map<string, {
    label: string
    quantity: number
    latestAt?: string
    details: Set<string>
  }>()

  for (const candidate of sourceCandidates || []) {
    const quantity = nonNegativeInteger(candidate.quantity)
    if (!quantity) {
      continue
    }
    const key = stage === 'LOGISTICS'
      ? candidate.logisticsBatchId || candidate.logisticsBatchNo || 'UNKNOWN_LOGISTICS'
      : candidate.purchaseOrderId || candidate.purchaseOrderNo || 'UNKNOWN_PURCHASE_ORDER'
    const label = stage === 'LOGISTICS'
      ? candidate.logisticsBatchNo || candidate.logisticsBatchId || '未标物流批次'
      : candidate.purchaseOrderNo || candidate.purchaseOrderId || '未标采购单'
    const existing = groups.get(key)
    const target = existing || {
      label,
      quantity: 0,
      latestAt: candidate.latestAt,
      details: new Set<string>()
    }
    target.quantity += quantity
    target.latestAt = latestTimestampText(target.latestAt, candidate.latestAt)
    if (candidate.logisticsBatchNo) {
      target.details.add(`物流批次 ${candidate.logisticsBatchNo}`)
    }
    if (candidate.purchaseOrderNo) {
      target.details.add(`采购单 ${candidate.purchaseOrderNo}`)
    }
    if (candidate.sourceStoreCode) {
      target.details.add(`来源 ${candidate.sourceStoreCode}`)
    }
    if (candidate.relationBasis) {
      target.details.add(candidate.relationBasis)
    }
    groups.set(key, target)
  }

  const segments: ProductStockSourceChainSegment[] = []
  Array.from(groups.entries())
    .sort((left, right) => compareTimestampText(right[1].latestAt, left[1].latestAt))
    .forEach(([key, group]) => {
      if (remainingQuantity <= 0) {
        return
      }
      const quantity = Math.min(remainingQuantity, group.quantity)
      remainingQuantity -= quantity
      segments.push({
        key: `${stage.toLowerCase()}-${key}`,
        stage,
        label: group.label,
        quantity,
        status: 'CANDIDATE',
        detail: {
          关系状态: '候选关系',
          匹配依据: Array.from(group.details).join(' / ') || '同商品 / 同站点 / 物流批次来源',
          候选数量: `${group.quantity.toLocaleString()} 件`,
          推算覆盖: `${quantity.toLocaleString()} 件`,
          最近更新: group.latestAt || '-'
        }
      })
    })

  if (remainingQuantity > 0 && segments.length) {
    segments.push({
      key: `${stage.toLowerCase()}-remaining-unlinked`,
      stage,
      label: '待确认关系',
      quantity: remainingQuantity,
      status: 'WAITING_RELATION',
      detail: {
        说明: stage === 'LOGISTICS'
          ? '当前库存仍有部分数量未能落到物流批次候选。'
          : '当前库存仍有部分数量未能落到采购单候选。',
        待确认数量: `${remainingQuantity.toLocaleString()} 件`
      }
    })
  }
  return segments
}

function missingSourceSegments(
  totalQuantity: number,
  stage: ProductStockSourceChainStage
): ProductStockSourceChainSegment[] {
  const quantity = nonNegativeInteger(totalQuantity)
  if (!quantity) {
    return []
  }
  if (stage === 'LOGISTICS') {
    return [
      {
        key: 'logistics-relation-missing',
        stage,
        label: '未建立关系',
        quantity,
        status: 'RELATION_MISSING',
        detail: {
          说明: '尚未建立 ASN 与物流批次的明确数量关系，不能按库存总量推算真实物流批次来源。',
          覆盖库存: `${quantity.toLocaleString()} 件`
        }
      }
    ]
  }
  return [
    {
      key: 'purchase-order-waiting-relation',
      stage,
      label: '待物流关系',
      quantity,
      status: 'WAITING_RELATION',
      detail: {
        说明: '采购单需先通过物流批次再关联 ASN，当前缺少物流批次到 ASN 的数量关系。',
        覆盖库存: `${quantity.toLocaleString()} 件`
      }
    }
  ]
}

export function normalizeOfficialWarehouseProductImageUrl(value?: string | null) {
  const raw = String(value ?? '').trim()
  if (!raw) {
    return ''
  }

  let normalized = raw
  if (/^original\/pzsku\//i.test(normalized)) {
    normalized = normalized.replace(/^original\/pzsku\//i, 'https://f.nooncdn.com/p/pzsku/')
  } else if (/^pzsku\//i.test(normalized)) {
    normalized = `https://f.nooncdn.com/p/${normalized}`
  } else if (/^https:\/\/f\.nooncdn\.com\/p\/original\/pzsku\//i.test(normalized)) {
    normalized = normalized.replace(
      /^https:\/\/f\.nooncdn\.com\/p\/original\/pzsku\//i,
      'https://f.nooncdn.com/p/pzsku/'
    )
  } else if (/^https:\/\/f\.nooncdn\.com\/pzsku\//i.test(normalized)) {
    normalized = normalized.replace(/^https:\/\/f\.nooncdn\.com\/pzsku\//i, 'https://f.nooncdn.com/p/pzsku/')
  }

  if (/^https:\/\/f\.nooncdn\.com\/p\/pzsku\//i.test(normalized) && !hasImageExtension(normalized)) {
    return `${normalized}.jpg`
  }
  return normalized
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

export function canImportFbnReportExport(row?: Pick<OfficialWarehouseFbnReportExportItem, 'exportCode' | 'status' | 'reportType'> | null) {
  if (!row?.exportCode || !isSupportedFbnReportType(row.reportType)) {
    return false
  }
  return normalizeReportStatus(row.status) === 'COMPLETED'
}

export function fbnReportImportActionLabel(row?: Pick<OfficialWarehouseFbnReportExportItem, 'reportType'> | null) {
  switch (normalizeReportType(row?.reportType)) {
    case FBN_RECEIVED_REPORT_TYPE:
      return '导入行级入仓'
    case SCHEDULED_DELIVERY_ACCURACY_REPORT_TYPE:
      return '导入预约校验'
    default:
      return '不支持导入'
  }
}

export function fbnReportImportKind(reportType?: string): 'RECEIVED_REPORT' | 'SCHEDULED_DELIVERY_ACCURACY' | undefined {
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
    {
      key: 'receipt-no-local-asn',
      label: '行未关联 ASN',
      value: summary.noLocalAsnLineCount || 0,
      tone: 'amber' as const,
      visible: Boolean(summary.lineReceiptReportConnected)
    },
    {
      key: 'receipt-line-unmatched',
      label: '行级未匹配',
      value: (summary.lineUnmatchedLineCount || 0) + (summary.productUnmatchedLineCount || 0),
      tone: 'amber' as const,
      visible: Boolean(summary.lineReceiptReportConnected)
    },
    {
      key: 'receipt-qc-failed',
      label: 'QC 失败件数',
      value: summary.qcFailedQuantity || 0,
      tone: 'red' as const,
      visible: Boolean(summary.lineReceiptReportConnected)
    },
    {
      key: 'receipt-short-over',
      label: '短收/超收行',
      value: (summary.shortReceivedLineCount || 0) + (summary.overReceivedLineCount || 0),
      tone: 'red' as const,
      visible: Boolean(summary.lineReceiptReportConnected)
    },
    {
      key: 'scheduled-no-local-asn',
      label: 'ASN 未关联',
      value: summary.noLocalScheduledDeliveryAccuracyAsnCount || 0,
      tone: 'amber' as const,
      visible: Boolean(summary.scheduledDeliveryAccuracyConnected)
    },
    {
      key: 'scheduled-variance',
      label: '计划/GRN 差异',
      value: Math.abs(summary.inboundQuantityVariance || 0),
      tone: 'red' as const,
      visible: Boolean(summary.scheduledDeliveryAccuracyConnected)
    },
    {
      key: 'scheduled-status-exception',
      label: '取消/过期 ASN',
      value: (summary.cancelledAsnCount || 0) + (summary.expiredAsnCount || 0),
      tone: 'red' as const,
      visible: Boolean(summary.scheduledDeliveryAccuracyConnected)
    }
  ].filter((item) => item.visible && item.value > 0)
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

export function stockCorrectionActionLabel() {
  return '订正分类'
}

export function stockSourceLabel(sourceType?: string) {
  if (sourceType === 'MANUAL_CORRECTION') {
    return '人工订正'
  }
  if (sourceType === 'FBN_INVENTORY_API') {
    return 'FBN库存'
  }
  return '库存摘要'
}

export function stockBucketLabel(bucket?: string) {
  switch (bucket) {
    case 'SELLABLE':
      return '有效在仓'
    case 'RETURNED':
      return '退货'
    case 'RECEIVING_EXCEPTION':
      return '入仓异常'
    case 'DAMAGED':
      return '破损'
    case 'QUALITY_HOLD':
      return '质量冻结'
    default:
      return '待确认'
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

function nonNegativeInteger(value?: number | null) {
  const parsed = Number(value || 0)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 0
  }
  return Math.floor(parsed)
}

function hasImageExtension(value: string) {
  return /\.(?:avif|gif|jpe?g|png|webp)(?:[?#].*)?$/i.test(value)
}

function productInboundHistoryTime(row: OfficialWarehouseProductInboundReceiptRow) {
  const raw = row.asnCompletedAt || row.asnScheduleDate || row.importedAt || ''
  const normalized = raw.includes(' ') ? raw.replace(' ', 'T') : raw
  const time = Date.parse(normalized)
  return Number.isFinite(time) ? time : 0
}

function latestTimestampText(left?: string, right?: string) {
  const leftTime = parseTimestampText(left)
  const rightTime = parseTimestampText(right)
  if (!leftTime) {
    return right
  }
  if (!rightTime) {
    return left
  }
  return rightTime > leftTime ? right : left
}

function compareTimestampText(left?: string, right?: string) {
  return parseTimestampText(left) - parseTimestampText(right)
}

function parseTimestampText(value?: string) {
  const raw = value || ''
  const normalized = raw.includes(' ') ? raw.replace(' ', 'T') : raw
  const time = Date.parse(normalized)
  return Number.isFinite(time) ? time : 0
}

function deduplicateProductInboundReceiptRows(rows: OfficialWarehouseProductInboundReceiptRow[]) {
  const byBusinessLine = new Map<string, OfficialWarehouseProductInboundReceiptRow>()
  for (const row of rows) {
    const key = [
      row.noonAsnNr || '',
      row.partnerSku || '',
      row.noonSku || '',
      row.pbarcodeCanonical || '',
      nonNegativeInteger(row.qtyExpected),
      nonNegativeInteger(row.receivedQty),
      nonNegativeInteger(row.qcFailedQty),
      nonNegativeInteger(row.unidentifiedQty),
      row.asnScheduleDate || '',
      row.asnCompletedAt || ''
    ].join('|')
    const existing = byBusinessLine.get(key)
    if (!existing || productImportTime(row) >= productImportTime(existing)) {
      byBusinessLine.set(key, row)
    }
  }
  return Array.from(byBusinessLine.values())
}

function productImportTime(row: OfficialWarehouseProductInboundReceiptRow) {
  const raw = row.importedAt || ''
  const normalized = raw.includes(' ') ? raw.replace(' ', 'T') : raw
  const time = Date.parse(normalized)
  return Number.isFinite(time) ? time : 0
}
