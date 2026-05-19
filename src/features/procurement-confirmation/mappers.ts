import type {
  FinalPickFlag,
  ProcurementCollectionStatus,
  ProcurementCandidateRecord,
  ProcurementInquiryStatus,
  ProcurementPoolStatus,
  ProcurementRequirementRecord
} from './types';
import type {
  CandidateCollectionTaskDto,
  CandidateSummaryDto,
  DemandListItemDto,
  PoolItemDto,
  RequirementConfirmationDetailResponse,
  RequirementConfirmationListResponse
} from './dto';

export function mapListResponseToRequirements(response: RequirementConfirmationListResponse): ProcurementRequirementRecord[] {
  return (response.items ?? []).map(mapListItemToRequirement);
}

export function mapDetailResponseToRequirement(response: RequirementConfirmationDetailResponse): ProcurementRequirementRecord {
  const demand = response.demand;
  if (!demand) {
    throw new Error('后端未返回采购需求详情。');
  }
  const pool = response.pool;
  const poolItems = (pool?.items ?? []).map((item) => mapPoolItemToCandidate(item));
  const backupCandidates = (response.backupCandidates ?? []).map((candidate) => mapCandidateToRecord(candidate, false));
  const finalCandidates = response.finalCandidates ?? [];
  const finalByPoolItemId = new Map<string, FinalPickFlag>();
  finalCandidates.forEach((item) => {
    finalByPoolItemId.set(String(item.poolItemId), item.finalPickType);
  });
  const candidates = [...poolItems, ...backupCandidates].map((candidate) => ({
    ...candidate,
    finalPick:
      candidate.poolItemId && finalByPoolItemId.has(candidate.poolItemId)
        ? finalByPoolItemId.get(candidate.poolItemId) ?? null
        : candidate.finalPick
  }));

  const status = mapPoolStatus(pool?.status, demand.status);
  const title = nonEmpty(demand.sourceTitle) || nonEmpty(demand.orderTitle) || `采购需求 ${demand.demandItemId}`;
  const sourceImage = nonEmpty(demand.sourceImageUrl) || placeholderImage('需求图', '#2563eb', '#0f766e');
  const candidateCount = candidates.length;
  const candidateCollectionStatus = resolveCandidateCollectionStatus(status, candidateCount);
  return {
    id: String(demand.demandItemId),
    poolId: pool?.poolId ? String(pool.poolId) : undefined,
    hasPool: Boolean(pool?.poolId),
    demandNo: pool?.poolNo || `PC-${demand.demandItemId}`,
    orderNo: demand.orderNo || '-',
    poolVersion: 1,
    demandTitle: title,
    searchKeyword: title,
    sourcePlatform: demand.sourcePlatform || 'Noon',
    sourceUrl: demand.sourceUrl || '',
    sourceTitle: nonEmpty(demand.sourceTitle),
    sourceImageUrl: sourceImage,
    sourceDetailImageUrl: nonEmpty(demand.sourceDetailImageUrl),
    sourcePackageImageUrl: nonEmpty(demand.sourcePackageImageUrl),
    sourceCollectionStatus: resolveSourceCollectionStatus(
      demand.status,
      demand.sourceTitle,
      demand.sourceImageUrl,
      demand.sourceDetailImageUrl
    ),
    sourceCollectedAt: demand.updatedAt || undefined,
    sourceCollectionMessage: resolveSourceCollectionMessage(
      demand.status,
      demand.sourceTitle,
      demand.sourceImageUrl,
      demand.sourceDetailImageUrl
    ),
    referenceImageUrl: sourceImage,
    packageImageUrl: nonEmpty(demand.sourcePackageImageUrl) || sourceImage,
    candidateCollectionStatus,
    candidateCount,
    recommendedCandidateCount: Math.min(candidateCount, pool?.maxPoolSize ?? 5),
    candidateCollectionMethod: candidateCount ? '1688 图搜 / 候选采集' : undefined,
    candidateCollectedAt: candidateCount ? demand.updatedAt || undefined : undefined,
    candidateCollectionMessage: resolveCandidateCollectionMessage(status, candidateCount),
    targetPriceMin: numberValue(demand.targetPriceMin),
    targetPriceMax: numberValue(demand.targetPriceMax),
    targetQuantity: demand.targetQuantity ?? 0,
    expectedDelivery: demand.deliveryExpectation || '待确认',
    targetSite: demand.targetSite || '-',
    specialRequirement: demand.specialRequirement || '暂无特殊要求',
    targetMaterial: demand.targetMaterial || undefined,
    targetPowerMode: demand.targetPowerMode || undefined,
    targetSizeText: demand.targetSizeText || undefined,
    targetPackageType: demand.targetPackageType || undefined,
    ownerName: demand.assignedBuyerName || '共享采购队列',
    status,
    top10Count: candidates.length,
    poolCount: poolItems.length,
    maxPoolSize: pool?.maxPoolSize,
    finalCandidateCount: finalCandidates.length,
    poolStartedAt: pool?.inquiryStartedAt || pool?.autoCreatedAt || undefined,
    poolStartedBy: demand.assignedBuyerName || undefined,
    createdAt: demand.createdAt || '-',
    updatedAt: demand.updatedAt || '-',
    pendingConfirmations: [],
    resultNotice: resolveResultNotice(status, Boolean(pool?.poolId)),
    aiSummary: response.summary?.summaryText || pool?.summaryText || undefined,
    finalDecisionNote: finalCandidates.find((item) => item.decisionNote)?.decisionNote || undefined,
    candidates
  };
}

function mapListItemToRequirement(item: DemandListItemDto): ProcurementRequirementRecord {
  const previewCandidate = item.previewCandidate ? [mapCandidateToRecord(item.previewCandidate, Boolean(item.poolId))] : [];
  const title = item.demandTitle || item.sourceTitle || item.orderTitle || `采购需求 ${item.demandItemId}`;
  const status = mapPoolStatus(item.poolStatus, item.demandStatus);
  const sourceImage = nonEmpty(item.sourceImageUrl) || '';
  const task = item.candidateCollectionTask || undefined;
  const candidateCount = item.candidateCount ?? task?.resultCount ?? previewCandidate.length;
  const maxPoolSize = item.maxPoolSize ?? 5;
  const candidateCollectionStatus = resolveCandidateCollectionStatus(status, candidateCount, task);
  return {
    id: String(item.demandItemId),
    poolId: item.poolId ? String(item.poolId) : undefined,
    hasPool: Boolean(item.poolId),
    demandNo: item.poolNo || `PC-${item.demandItemId}`,
    orderNo: item.orderNo || '-',
    poolVersion: 1,
    demandTitle: title,
    searchKeyword: title,
    sourcePlatform: item.sourcePlatform || '未知来源',
    sourceUrl: item.sourceUrl || '',
    sourceTitle: nonEmpty(item.sourceTitle),
    sourceImageUrl: sourceImage,
    sourceDetailImageUrl: nonEmpty(item.sourceDetailImageUrl),
    sourcePackageImageUrl: nonEmpty(item.sourcePackageImageUrl),
    sourceCollectionStatus: resolveSourceCollectionStatus(
      item.demandStatus,
      item.sourceTitle,
      item.sourceImageUrl,
      item.sourceDetailImageUrl
    ),
    sourceCollectedAt: item.updatedAt || undefined,
    sourceCollectionMessage: resolveSourceCollectionMessage(
      item.demandStatus,
      item.sourceTitle,
      item.sourceImageUrl,
      item.sourceDetailImageUrl
    ),
    referenceImageUrl: sourceImage,
    packageImageUrl: nonEmpty(item.sourcePackageImageUrl) || sourceImage,
    candidateCollectionStatus,
    candidateCount,
    recommendedCandidateCount: task?.recommendedCount ?? Math.min(candidateCount, maxPoolSize),
    candidateCollectionMethod: resolveCandidateCollectionMethod(task, candidateCount),
    candidateCollectedAt: task?.finishedAt || (candidateCount ? item.updatedAt || undefined : undefined),
    candidateCollectionStartedAt: task?.startedAt || undefined,
    candidateCollectionFinishedAt: task?.finishedAt || undefined,
    candidateCollectionProgressPercent: task?.progressPercent,
    candidateCollectionMessage: resolveCandidateCollectionMessage(status, candidateCount, task),
    targetPriceMin: numberValue(item.targetPriceMin),
    targetPriceMax: numberValue(item.targetPriceMax),
    targetQuantity: item.targetQuantity ?? 0,
    expectedDelivery: item.deliveryExpectation || '待确认',
    targetSite: item.targetSite || '-',
    specialRequirement: item.specialRequirement || '进入详情查看采购要求。',
    targetMaterial: item.targetMaterial || undefined,
    targetPowerMode: item.targetPowerMode || undefined,
    targetSizeText: item.targetSizeText || undefined,
    targetPackageType: item.targetPackageType || undefined,
    ownerName: item.assignedBuyerName || '共享采购队列',
    status,
    top10Count: previewCandidate.length,
    poolCount: item.poolCount ?? previewCandidate.length,
    maxPoolSize,
    finalCandidateCount: item.finalCandidateCount,
    createdAt: '-',
    updatedAt: item.updatedAt || '-',
    pendingConfirmations: [],
    resultNotice: resolveResultNotice(status, Boolean(item.poolId)),
    candidates: previewCandidate
  };
}

function mapPoolItemToCandidate(item: PoolItemDto): ProcurementCandidateRecord {
  const candidate = item.candidate || item;
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
  };
}

function mapCandidateToRecord(candidate: CandidateSummaryDto, inPool: boolean): ProcurementCandidateRecord {
  const rankNo = candidate.rankNo ?? 0;
  const totalScore = candidate.totalScore ?? 0;
  const candidateId = candidate.candidateId != null ? String(candidate.candidateId) : String(candidate.offerId || rankNo || Date.now());
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
  };
}

function splitPipeText(text?: string, fallback: string[] = []) {
  const values = (text || '')
    .split('|')
    .map((item) => item.trim())
    .filter(Boolean);
  return values.length ? values : fallback;
}

function mapPoolStatus(poolStatus?: string | null, demandStatus?: string): ProcurementPoolStatus {
  const normalized = poolStatus || demandStatus || '';
  if (
    normalized === 'SOURCE_COLLECTING' ||
    normalized === 'POOL_CREATED' ||
    normalized === 'POOL_INQUIRY_RUNNING' ||
    normalized === 'POOL_PARTIAL_HANDOFF' ||
    normalized === 'POOL_EMPTY_REQUIRES_ACTION' ||
    normalized === 'POOL_INQUIRY_FINISHED' ||
    normalized === 'FINAL_TWO_CONFIRMED' ||
    normalized === 'SUMMARY_READY'
  ) {
    return normalized;
  }
  if (!poolStatus && (demandStatus === 'SCREENING' || demandStatus === 'COLLECTING' || demandStatus === 'MATERIAL_COLLECTING')) {
    return 'SOURCE_COLLECTING';
  }
  return 'POOL_EMPTY_REQUIRES_ACTION';
}

function mapInquiryStatus(itemStatus?: string, taskStatus?: string | null): ProcurementInquiryStatus {
  if (
    itemStatus === 'IN_POOL_WAITING_SEND' ||
    itemStatus === 'IN_POOL_WAITING_REPLY' ||
    itemStatus === 'FOLLOW_UP_1_SENT' ||
    itemStatus === 'FOLLOW_UP_2_SENT' ||
    itemStatus === 'FOLLOW_UP_3_SENT' ||
    itemStatus === 'REPLIED' ||
    itemStatus === 'PARTIAL_REPLY' ||
    itemStatus === 'NO_REPLY_HANDOFF' ||
    itemStatus === 'SEND_FAILED' ||
    itemStatus === 'REPLY_PARSE_FAILED' ||
    itemStatus === 'REMOVED_TERMINATED' ||
    itemStatus === 'CLOSED'
  ) {
    return itemStatus;
  }
  if (taskStatus === 'SENT' || taskStatus === 'CHATTING') {
    return 'IN_POOL_WAITING_REPLY';
  }
  if (taskStatus === 'HANDOFF') {
    return 'SEND_FAILED';
  }
  return 'IN_POOL_WAITING_SEND';
}

function resolveReplySummary(itemStatus?: string, taskStatus?: string | null) {
  if (taskStatus === 'SENT') {
    return '首条询价已发出，等待供应商回复。';
  }
  if (taskStatus === 'HANDOFF') {
    return '自动询价任务已转人工处理。';
  }
  if (itemStatus === 'IN_POOL_WAITING_SEND') {
    return '已进入待选池，等待发送首条询价。';
  }
  return '等待自动询价结果同步。';
}

function resolveResultNotice(status: ProcurementPoolStatus, hasPool: boolean) {
  if (!hasPool) {
    return '当前需求还没有待选池，可生成待选池后开始自动询价。';
  }
  if (status === 'SUMMARY_READY') {
    return '最终 2 个候选已确认，AI 总结已生成。';
  }
  if (status === 'POOL_INQUIRY_FINISHED') {
    return '本轮自动询价已收口，可确认最终 2 个候选。';
  }
  if (status === 'POOL_EMPTY_REQUIRES_ACTION') {
    return '当前待选池为空，可从备选池补入候选继续自动询价。';
  }
  return '待选池已生成，系统会对池内候选执行自动询价。';
}

function resolveSourceCollectionStatus(
  demandStatus?: string | null,
  sourceTitle?: string | null,
  sourceImageUrl?: string | null,
  sourceDetailImageUrl?: string | null
): ProcurementCollectionStatus {
  const hasTitle = Boolean(nonEmpty(sourceTitle));
  const hasImage = Boolean(nonEmpty(sourceImageUrl));
  const hasDetail = Boolean(nonEmpty(sourceDetailImageUrl));
  if (hasTitle && (hasImage || hasDetail)) {
    return 'SUCCESS';
  }
  if (hasTitle || hasImage || hasDetail) {
    return 'PARTIAL_SUCCESS';
  }
  if (demandStatus === 'SCREENING' || demandStatus === 'COLLECTING' || demandStatus === 'MATERIAL_COLLECTING' || demandStatus === 'SOURCE_COLLECTING') {
    return 'COLLECTING';
  }
  return 'COLLECTING';
}

function resolveSourceCollectionMessage(
  demandStatus?: string | null,
  sourceTitle?: string | null,
  sourceImageUrl?: string | null,
  sourceDetailImageUrl?: string | null
) {
  const status = resolveSourceCollectionStatus(demandStatus, sourceTitle, sourceImageUrl, sourceDetailImageUrl);
  if (status === 'SUCCESS') {
    return '源头商品标题、图片或详情已采集。';
  }
  if (status === 'PARTIAL_SUCCESS') {
    return '源头商品信息已部分采集，缺失内容等待补齐。';
  }
  return '原链接采集中，未采集到的信息不会在列表伪造展示。';
}

function resolveCandidateCollectionStatus(
  status: ProcurementPoolStatus,
  candidateCount: number,
  task?: CandidateCollectionTaskDto
): ProcurementCollectionStatus {
  const taskStatus = upper(task?.status);
  if (taskStatus === 'FAILED') {
    return 'FAILED';
  }
  if (taskStatus === 'PARTIAL_SUCCESS') {
    return 'PARTIAL_SUCCESS';
  }
  if (taskStatus === 'SUCCESS') {
    return 'SUCCESS';
  }
  if (taskStatus === 'RUNNING' || taskStatus === 'QUEUED') {
    return 'COLLECTING';
  }
  if (candidateCount > 0) {
    return 'SUCCESS';
  }
  if (status === 'SOURCE_COLLECTING') {
    return 'COLLECTING';
  }
  if (status === 'POOL_EMPTY_REQUIRES_ACTION') {
    return 'NOT_STARTED';
  }
  return 'COLLECTING';
}

function resolveCandidateCollectionMessage(status: ProcurementPoolStatus, candidateCount: number, task?: CandidateCollectionTaskDto) {
  const collectionStatus = resolveCandidateCollectionStatus(status, candidateCount, task);
  if (nonEmpty(task?.message)) {
    return task?.message?.trim();
  }
  if (collectionStatus === 'SUCCESS') {
    const resultCount = task?.resultCount ?? candidateCount;
    const recommendedCount = task?.recommendedCount;
    if (recommendedCount != null) {
      return `已完成 1688 图搜：采集 ${resultCount} 个，推荐 ${recommendedCount} 个。`;
    }
    return '已读取 1688 候选采集结果。';
  }
  if (collectionStatus === 'PARTIAL_SUCCESS') {
    const resultCount = task?.resultCount ?? candidateCount;
    return `1688 候选采集部分完成，当前采集 ${resultCount} 个。`;
  }
  if (collectionStatus === 'FAILED') {
    return '1688 候选采集失败，等待重新采集。';
  }
  if (collectionStatus === 'NOT_STARTED') {
    return '等待源头商品信息完成后启动 1688 候选采集。';
  }
  if (task?.progressPercent != null) {
    return `1688 候选采集中，当前进度 ${task.progressPercent}%。`;
  }
  return '1688 候选采集中，未完成前不展示候选商品卡片。';
}

function resolveCandidateCollectionMethod(task?: CandidateCollectionTaskDto, candidateCount = 0) {
  const searchMode = upper(task?.searchMode);
  if (searchMode === 'IMAGE_MULTI') {
    return '1688 图搜（多图）';
  }
  if (searchMode === 'IMAGE_SINGLE') {
    return '1688 图搜（单图）';
  }
  if (searchMode === 'KEYWORD') {
    return '1688 关键词搜索';
  }
  if (task || candidateCount > 0) {
    return '1688 图搜 / 候选采集';
  }
  return undefined;
}

function placeholderImage(label: string, tone: string, accent: string) {
  const safeLabel = escapeSvgText(label);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240" viewBox="0 0 320 240"><defs><linearGradient id="g" x1="0%" x2="100%" y1="0%" y2="100%"><stop stop-color="${tone}" offset="0%"/><stop stop-color="${accent}" offset="100%"/></linearGradient></defs><rect width="320" height="240" fill="url(#g)" rx="22"/><rect x="24" y="24" width="272" height="192" rx="18" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.3)"/><text x="160" y="126" font-size="18" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif">${safeLabel}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function escapeSvgText(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function scorePart(totalScore: number, ratio: number) {
  return Math.max(0, Math.round(totalScore * ratio));
}

function numberValue(value?: number) {
  return value == null ? 0 : Number(value);
}

function nonEmpty(value?: string | null) {
  return value && value.trim() ? value.trim() : undefined;
}

function upper(value?: string | null) {
  return value?.trim().toUpperCase();
}

function extractOfferId(candidateUrl?: string) {
  if (!candidateUrl) {
    return undefined;
  }
  const pathMatch = candidateUrl.match(/\/offer\/(\d+)\.html/);
  if (pathMatch) {
    return pathMatch[1];
  }
  const queryMatch = candidateUrl.match(/(?:offerId|offer_id|id)=(\d+)/);
  return queryMatch?.[1];
}
