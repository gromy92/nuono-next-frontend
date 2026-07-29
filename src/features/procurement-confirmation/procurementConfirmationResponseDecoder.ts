import type {
  DemandDetailDto,
  DemandListItemDto,
  FinalCandidateDto,
  PoolDto,
  PoolItemDto,
  RequirementConfirmationDetailResponse,
  RequirementConfirmationListResponse,
  SummaryDto
} from './dto'
import {
  assertOptionalResponseNumbers,
  assertOptionalResponseStrings,
  assertResponseStringUnion,
  optionalResponseArray,
  optionalResponseRecord,
  requiredResponseBoolean,
  requiredResponseNumber,
  requiredResponseString,
  responseFieldPath,
  responseRecord
} from '../../shared/responseDecoder'
import {
  CANDIDATE_NUMBER_FIELDS,
  CANDIDATE_STRING_FIELDS,
  decodeCandidateCollectionTaskResponse,
  decodeCandidateResponse
} from './procurementCandidateResponseDecoder'

const DEMAND_NUMBER_FIELDS = [
  'orderId',
  'ownerUserId',
  'lineNo',
  'targetPriceMin',
  'targetPriceMax',
  'targetQuantity',
  'currentPoolId'
] as const

const DEMAND_STRING_FIELDS = [
  'orderNo',
  'orderTitle',
  'sourcePlatform',
  'sourceUrl',
  'sourceTitle',
  'sourceImageUrl',
  'sourceDetailImageUrl',
  'sourcePackageImageUrl',
  'targetSite',
  'specialRequirement',
  'targetMaterial',
  'targetPowerMode',
  'targetSizeText',
  'targetPackageType',
  'deliveryExpectation',
  'status',
  'assignedBuyerName',
  'createdAt',
  'updatedAt'
] as const

function decodeListItem(value: unknown, path: string): DemandListItemDto {
  const record = responseRecord(value, path)
  requiredResponseNumber(record, 'demandItemId', path)
  assertOptionalResponseNumbers(
    record,
    [
      'orderId',
      'ownerUserId',
      'targetPriceMin',
      'targetPriceMax',
      'targetQuantity',
      'poolId',
      'poolCount',
      'maxPoolSize',
      'finalCandidateCount',
      'candidateCount'
    ],
    path
  )
  assertOptionalResponseStrings(
    record,
    [
      'orderNo',
      'orderTitle',
      'demandTitle',
      'demandStatus',
      'sourcePlatform',
      'sourceUrl',
      'sourceTitle',
      'sourceImageUrl',
      'sourceDetailImageUrl',
      'sourcePackageImageUrl',
      'targetSite',
      'specialRequirement',
      'targetMaterial',
      'targetPowerMode',
      'targetSizeText',
      'targetPackageType',
      'deliveryExpectation',
      'assignedBuyerName',
      'poolNo',
      'poolStatus',
      'updatedAt'
    ],
    path
  )
  const task = optionalResponseRecord(record, 'candidateCollectionTask', path)
  if (task) decodeCandidateCollectionTaskResponse(task, responseFieldPath(path, 'candidateCollectionTask'))
  const previewCandidate = optionalResponseRecord(record, 'previewCandidate', path)
  if (previewCandidate) decodeCandidateResponse(previewCandidate, responseFieldPath(path, 'previewCandidate'))
  return record as unknown as DemandListItemDto
}

function decodeDemand(value: unknown, path: string): DemandDetailDto {
  const record = responseRecord(value, path)
  requiredResponseNumber(record, 'demandItemId', path)
  assertOptionalResponseNumbers(record, DEMAND_NUMBER_FIELDS, path)
  assertOptionalResponseStrings(record, DEMAND_STRING_FIELDS, path)
  return record as unknown as DemandDetailDto
}

function decodePoolItem(value: unknown, path: string): PoolItemDto {
  const record = responseRecord(value, path)
  requiredResponseNumber(record, 'poolItemId', path)
  requiredResponseNumber(record, 'candidateId', path)
  assertOptionalResponseNumbers(
    record,
    [
      ...CANDIDATE_NUMBER_FIELDS,
      'sourceRankNo',
      'poolRankNo',
      'inquiryTaskId',
      'removedBy'
    ],
    path
  )
  assertOptionalResponseStrings(
    record,
    [
      ...CANDIDATE_STRING_FIELDS,
      'status',
      'joinSource',
      'joinedAt',
      'firstSentAt',
      'noReplyDeadlineAt',
      'lastFollowUpAt',
      'lastReplyAt',
      'closedAt',
      'removedAt',
      'removeReason',
      'quotePriceText',
      'quoteMoqText',
      'quoteDeliveryText',
      'replySummary',
      'riskNote',
      'inquiryTaskStatus',
      'inquiryExecutionStage',
      'plannedChannel',
      'activeChannel',
      'channelFallbackReason',
      'externalInquiryId',
      'externalInquiryUrl',
      'externalResultStatus',
      'replySource',
      'replyParseStatus',
      'replyParseError'
    ],
    path
  )
  const candidate = optionalResponseRecord(record, 'candidate', path)
  if (candidate) decodeCandidateResponse(candidate, responseFieldPath(path, 'candidate'))
  return record as unknown as PoolItemDto
}

function decodePool(value: unknown, path: string): PoolDto {
  const record = responseRecord(value, path)
  assertOptionalResponseNumbers(
    record,
    [
      'poolId',
      'poolCount',
      'maxPoolSize',
      'candidateSourceLimit',
      'summaryInputSnapshotId'
    ],
    path
  )
  assertOptionalResponseStrings(
    record,
    [
      'poolNo',
      'status',
      'autoCreatedAt',
      'inquiryStartedAt',
      'inquiryFinishedAt',
      'finalConfirmedAt',
      'summaryReadyAt',
      'summaryText'
    ],
    path
  )
  optionalResponseArray(record, 'items', path)?.forEach((item, index) =>
    decodePoolItem(item, `${path}.items[${index}]`)
  )
  return record as unknown as PoolDto
}

function decodeFinalCandidate(value: unknown, path: string): FinalCandidateDto {
  const record = responseRecord(value, path)
  requiredResponseNumber(record, 'poolItemId', path)
  requiredResponseNumber(record, 'candidateId', path)
  assertResponseStringUnion(record, 'finalPickType', ['PRIMARY', 'BACKUP'], path)
  assertOptionalResponseNumbers(record, [...CANDIDATE_NUMBER_FIELDS, 'id', 'snapshotId', 'confirmedBy'], path)
  assertOptionalResponseStrings(record, [...CANDIDATE_STRING_FIELDS, 'decisionNote', 'confirmedAt'], path)
  const candidate = optionalResponseRecord(record, 'candidate', path)
  if (candidate) decodeCandidateResponse(candidate, responseFieldPath(path, 'candidate'))
  return record as unknown as FinalCandidateDto
}

function decodeSummary(value: unknown, path: string): SummaryDto {
  const record = responseRecord(value, path)
  assertOptionalResponseStrings(record, ['summaryText'], path)
  assertOptionalResponseNumbers(record, ['snapshotId'], path)
  return record as SummaryDto
}

export function decodeRequirementConfirmationListResponse(
  payload: unknown
): RequirementConfirmationListResponse {
  const record = responseRecord(payload)
  requiredResponseString(record, 'mode', '$')
  requiredResponseBoolean(record, 'ready', '$')
  assertOptionalResponseStrings(record, ['message'], '$')
  assertOptionalResponseNumbers(record, ['page', 'pageSize', 'total'], '$')
  optionalResponseArray(record, 'items', '$')?.forEach((item, index) =>
    decodeListItem(item, `$.items[${index}]`)
  )
  return record as unknown as RequirementConfirmationListResponse
}

export function decodeRequirementConfirmationDetailResponse(
  payload: unknown
): RequirementConfirmationDetailResponse {
  const record = responseRecord(payload)
  requiredResponseString(record, 'mode', '$')
  requiredResponseBoolean(record, 'ready', '$')
  assertOptionalResponseStrings(record, ['message'], '$')
  decodeDemand(record.demand, '$.demand')
  const pool = optionalResponseRecord(record, 'pool', '$')
  if (pool) decodePool(pool, '$.pool')
  optionalResponseArray(record, 'backupCandidates', '$')?.forEach((candidate, index) =>
    decodeCandidateResponse(candidate, `$.backupCandidates[${index}]`)
  )
  optionalResponseArray(record, 'finalCandidates', '$')?.forEach((candidate, index) =>
    decodeFinalCandidate(candidate, `$.finalCandidates[${index}]`)
  )
  const summary = optionalResponseRecord(record, 'summary', '$')
  if (summary) decodeSummary(summary, '$.summary')
  return record as unknown as RequirementConfirmationDetailResponse
}
