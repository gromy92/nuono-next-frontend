import type { OfficialWarehouseProductStockSourceCandidate } from './statisticsTypes'
import type { ProductStockSourceInference } from './productStockSourceInference'
import { receiptStatusLabel } from './inboundStatisticsDomain'
import { latestTimestampText, nonNegativeInteger, parseTimestampText } from './statisticsDomainUtils'

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
      logistics: logisticsSegments.length ? logisticsSegments : missingSourceSegments(totalQuantity, 'LOGISTICS'),
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
    const target = groups.get(key) || {
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
    .sort((left, right) => parseTimestampText(right[1].latestAt) - parseTimestampText(left[1].latestAt))
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
    segments.push(waitingRelationSegment(stage, remainingQuantity))
  }
  return segments
}

function waitingRelationSegment(
  stage: ProductStockSourceChainStage,
  quantity: number
): ProductStockSourceChainSegment {
  return {
    key: `${stage.toLowerCase()}-remaining-unlinked`,
    stage,
    label: '待确认关系',
    quantity,
    status: 'WAITING_RELATION',
    detail: {
      说明: stage === 'LOGISTICS'
        ? '当前库存仍有部分数量未能落到物流批次候选。'
        : '当前库存仍有部分数量未能落到采购单候选。',
      待确认数量: `${quantity.toLocaleString()} 件`
    }
  }
}

function missingSourceSegments(
  totalQuantity: number,
  stage: ProductStockSourceChainStage
): ProductStockSourceChainSegment[] {
  const quantity = nonNegativeInteger(totalQuantity)
  if (!quantity) {
    return []
  }
  const isLogistics = stage === 'LOGISTICS'
  return [{
    key: isLogistics ? 'logistics-relation-missing' : 'purchase-order-waiting-relation',
    stage,
    label: isLogistics ? '未建立关系' : '待物流关系',
    quantity,
    status: isLogistics ? 'RELATION_MISSING' : 'WAITING_RELATION',
    detail: {
      说明: isLogistics
        ? '尚未建立 ASN 与物流批次的明确数量关系，不能按库存总量推算真实物流批次来源。'
        : '采购单需先通过物流批次再关联 ASN，当前缺少物流批次到 ASN 的数量关系。',
      覆盖库存: `${quantity.toLocaleString()} 件`
    }
  }]
}
