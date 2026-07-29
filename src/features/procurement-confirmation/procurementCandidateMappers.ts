import type { CandidateSummaryDto, PoolItemDto } from './dto'
import type { ProcurementCandidateRecord } from './types'
import {
  extractOfferId,
  placeholderImage,
  scorePart,
  splitPipeText
} from './procurementMapperUtils'
import { mapInquiryStatus, resolveReplySummary } from './procurementStatusMappers'

export function mapPoolItemToCandidate(item: PoolItemDto): ProcurementCandidateRecord {
  const candidate = item.candidate || item
  return {
    ...mapCandidateToRecord(
      {
        ...candidate,
        candidateId: item.candidateId,
        rankNo: item.sourceRankNo ?? candidate.rankNo,
        totalScore: candidate.totalScore,
        title: candidate.title,
        supplierName: candidate.supplierName,
        candidateUrl: candidate.candidateUrl,
        mainImageUrl: candidate.mainImageUrl,
        priceText: candidate.priceText,
        moqText: candidate.moqText,
        deliveryTimelineText: candidate.deliveryTimelineText
      },
      true
    ),
    id: `pool-item-${item.poolItemId}`,
    poolItemId: String(item.poolItemId),
    poolRankNo: item.poolRankNo ?? null,
    inquiryStatus: mapInquiryStatus(item.status, item.inquiryTaskStatus),
    replySummary: item.replySummary || resolveReplySummary(item.status, item.inquiryTaskStatus),
    latestReplyAt: item.lastReplyAt || undefined,
    quotePrice: item.quotePriceText || undefined,
    quoteMoq: item.quoteMoqText || undefined,
    quoteDelivery: item.quoteDeliveryText || undefined,
    nextFollowUpAt: item.noReplyDeadlineAt ? `24 小时截止：${item.noReplyDeadlineAt}` : undefined,
    plannedChannel: item.plannedChannel || undefined,
    activeChannel: item.activeChannel || undefined,
    channelFallbackReason: item.channelFallbackReason || undefined,
    externalInquiryId: item.externalInquiryId || undefined,
    externalInquiryUrl: item.externalInquiryUrl || undefined,
    externalResultStatus: item.externalResultStatus || undefined,
    replySource: item.replySource || undefined,
    replyParseStatus: item.replyParseStatus || undefined,
    replyParseError: item.replyParseError || undefined
  }
}

export function mapCandidateToRecord(
  candidate: CandidateSummaryDto,
  inPool: boolean
): ProcurementCandidateRecord {
  const rankNo = candidate.rankNo ?? 0
  const totalScore = candidate.totalScore ?? 0
  const candidateId = candidate.candidateId != null
    ? String(candidate.candidateId)
    : String(candidate.offerId || rankNo || Date.now())
  return {
    id: inPool ? `candidate-in-pool-${candidateId}` : `candidate-${candidateId}`,
    candidateId,
    offerId: candidate.offerId || extractOfferId(candidate.candidateUrl) || candidateId,
    rankNo,
    title: candidate.title || '1688 候选商品',
    supplierName: candidate.supplierName || '供应商待识别',
    candidateUrl: candidate.candidateUrl || '',
    mainImageUrl: candidate.mainImageUrl || placeholderImage(`候选 ${rankNo || ''}`, '#0f766e', '#164e63'),
    detailImageUrl: candidate.detailImageUrl || undefined,
    deliveryImageUrl: candidate.deliveryImageUrl || undefined,
    priceText: candidate.priceText || '待确认',
    moqText: candidate.moqText || '待确认',
    locationText: candidate.locationText || '1688',
    materialText: candidate.materialText || undefined,
    powerModeText: candidate.powerModeText || undefined,
    sizeText: candidate.sizeText || undefined,
    packageText: candidate.packageText || undefined,
    deliveryText: candidate.deliveryTimelineText || '待确认',
    resultCardText: candidate.resultCardText || '来自 1688 候选结果。',
    detailHighlightText: candidate.detailHighlightText || undefined,
    attributeSnapshotText: candidate.attributeSnapshotText || undefined,
    shippingSnapshotText: candidate.shippingSnapshotText || undefined,
    packageSnapshotText: candidate.packageSnapshotText || undefined,
    tags: splitPipeText(candidate.badgesText, inPool ? ['待选池'] : ['备选']),
    reasons: splitPipeText(candidate.reasonsText),
    warnings: splitPipeText(candidate.warningsText),
    totalScore,
    scores: {
      matchScore: candidate.fitScore ?? scorePart(totalScore, 0.4),
      specScore: candidate.specScore ?? scorePart(totalScore, 0.25),
      priceScore: candidate.priceScore ?? scorePart(totalScore, 0.28),
      moqScore: candidate.specScore ?? scorePart(totalScore, 0.14),
      supplierScore: candidate.supplierScore ?? scorePart(totalScore, 0.1),
      deliveryScore: candidate.logisticsScore ?? scorePart(totalScore, 0.08)
    },
    inPool,
    poolRankNo: inPool ? rankNo || null : null,
    inquiryStatus: inPool ? 'IN_POOL_WAITING_SEND' : 'BACKUP_POOL',
    replySummary: inPool ? '已进入待选池，等待自动询价状态同步。' : '尚未进入自动询价。',
    finalPick: null
  }
}
