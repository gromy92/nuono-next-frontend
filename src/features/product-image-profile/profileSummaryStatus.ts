export type ProductImageProfileReadinessStatus = 'COMPLETE' | 'INCOMPLETE'

export type ProductImageProfileMissingField =
  | 'BRAND'
  | 'BILINGUAL_TITLE'
  | 'SPEC_SUMMARY'
  | 'PRODUCT_FACTS'
  | 'BASE_IMAGE'

export type ProductImageSummaryStatus =
  | 'NOT_REQUESTED'
  | 'CANDIDATE'
  | 'GENERATING'
  | 'PENDING_CONFIRMATION'
  | 'PUBLISHING'
  | 'ONLINE'
  | 'ACTION_REQUIRED'

export function summarizeImageStatus(statuses: readonly string[]): ProductImageSummaryStatus {
  const activeStatuses = statuses.filter((status) => status !== 'HISTORICAL' && status !== 'DISCARDED')
  if (activeStatuses.includes('FAILED')) return 'ACTION_REQUIRED'
  if (activeStatuses.some((status) => status === 'PENDING_REVIEW' || status === 'ADOPTED')) return 'PENDING_CONFIRMATION'
  if (activeStatuses.includes('PUBLISHING')) return 'PUBLISHING'
  if (activeStatuses.some((status) => ['PENDING_GENERATION', 'GENERATING', 'REGENERATING'].includes(status))) return 'GENERATING'
  if (activeStatuses.includes('ONLINE')) return 'ONLINE'
  if (activeStatuses.includes('DRAFT')) return 'CANDIDATE'
  return 'NOT_REQUESTED'
}
