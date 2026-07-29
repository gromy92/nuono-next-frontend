import type { CandidateCollectionTaskDto, CandidateSummaryDto } from './dto'
import {
  assertOptionalResponseNumbers,
  assertOptionalResponseStrings,
  responseRecord
} from '../../shared/responseDecoder'

export const CANDIDATE_NUMBER_FIELDS = [
  'candidateId',
  'rankNo',
  'totalScore',
  'fitScore',
  'specScore',
  'priceScore',
  'supplierScore',
  'logisticsScore'
] as const

export const CANDIDATE_STRING_FIELDS = [
  'offerId',
  'title',
  'supplierName',
  'candidateUrl',
  'mainImageUrl',
  'detailImageUrl',
  'deliveryImageUrl',
  'priceText',
  'moqText',
  'locationText',
  'materialText',
  'powerModeText',
  'sizeText',
  'packageText',
  'deliveryTimelineText',
  'resultCardText',
  'detailHighlightText',
  'attributeSnapshotText',
  'shippingSnapshotText',
  'packageSnapshotText',
  'badgesText',
  'reasonsText',
  'warningsText'
] as const

export function decodeCandidateResponse(value: unknown, path: string): CandidateSummaryDto {
  const record = responseRecord(value, path)
  assertOptionalResponseNumbers(record, CANDIDATE_NUMBER_FIELDS, path)
  assertOptionalResponseStrings(record, CANDIDATE_STRING_FIELDS, path)
  return record as CandidateSummaryDto
}

export function decodeCandidateCollectionTaskResponse(
  value: unknown,
  path: string
): CandidateCollectionTaskDto {
  const record = responseRecord(value, path)
  assertOptionalResponseNumbers(
    record,
    ['id', 'progressPercent', 'selectedImageCount', 'resultCount', 'recommendedCount'],
    path
  )
  assertOptionalResponseStrings(
    record,
    ['status', 'searchMode', 'searchPath', 'message', 'startedAt', 'finishedAt'],
    path
  )
  return record as CandidateCollectionTaskDto
}
