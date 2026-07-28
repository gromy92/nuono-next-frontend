import type {
  DemandListItemDto,
  RequirementConfirmationDetailResponse,
  RequirementConfirmationListResponse
} from './dto'
import type { FinalPickFlag, ProcurementRequirementRecord } from './types'
import { mapCandidateToRecord, mapPoolItemToCandidate } from './procurementCandidateMappers'
import { nonEmpty, numberValue, placeholderImage } from './procurementMapperUtils'
import {
  mapPoolStatus,
  resolveCandidateCollectionMessage,
  resolveCandidateCollectionMethod,
  resolveCandidateCollectionStatus,
  resolveResultNotice,
  resolveSourceCollectionMessage,
  resolveSourceCollectionStatus
} from './procurementStatusMappers'

export function mapListResponseToRequirements(
  response: RequirementConfirmationListResponse
): ProcurementRequirementRecord[] {
  return (response.items ?? []).map(mapListItemToRequirement)
}

export function mapDetailResponseToRequirement(
  response: RequirementConfirmationDetailResponse
): ProcurementRequirementRecord {
  const demand = response.demand
  if (!demand) throw new Error('后端未返回采购需求详情。')

  const pool = response.pool
  const poolItems = (pool?.items ?? []).map(mapPoolItemToCandidate)
  const backupCandidates = (response.backupCandidates ?? []).map((candidate) => mapCandidateToRecord(candidate, false))
  const finalCandidates = response.finalCandidates ?? []
  const finalByPoolItemId = new Map<string, FinalPickFlag>()
  finalCandidates.forEach((item) => finalByPoolItemId.set(String(item.poolItemId), item.finalPickType))
  const candidates = [...poolItems, ...backupCandidates].map((candidate) => ({
    ...candidate,
    finalPick: candidate.poolItemId && finalByPoolItemId.has(candidate.poolItemId)
      ? finalByPoolItemId.get(candidate.poolItemId) ?? null
      : candidate.finalPick
  }))

  const status = mapPoolStatus(pool?.status, demand.status)
  const title = nonEmpty(demand.sourceTitle) || nonEmpty(demand.orderTitle) || `采购需求 ${demand.demandItemId}`
  const sourceImage = nonEmpty(demand.sourceImageUrl) || placeholderImage('需求图', '#2563eb', '#0f766e')
  const candidateCount = candidates.length
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
    candidateCollectionStatus: resolveCandidateCollectionStatus(status, candidateCount),
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
  }
}

function mapListItemToRequirement(item: DemandListItemDto): ProcurementRequirementRecord {
  const previewCandidate = item.previewCandidate
    ? [mapCandidateToRecord(item.previewCandidate, Boolean(item.poolId))]
    : []
  const title = item.demandTitle || item.sourceTitle || item.orderTitle || `采购需求 ${item.demandItemId}`
  const status = mapPoolStatus(item.poolStatus, item.demandStatus)
  const sourceImage = nonEmpty(item.sourceImageUrl) || ''
  const task = item.candidateCollectionTask || undefined
  const candidateCount = item.candidateCount ?? task?.resultCount ?? previewCandidate.length
  const maxPoolSize = item.maxPoolSize ?? 5
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
    candidateCollectionStatus: resolveCandidateCollectionStatus(status, candidateCount, task),
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
  }
}
