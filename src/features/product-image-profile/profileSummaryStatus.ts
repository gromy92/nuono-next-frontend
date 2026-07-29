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

export const imageSummaryStatusMeta: Record<ProductImageSummaryStatus, { color: string; label: string }> = {
  NOT_REQUESTED: { color: 'default', label: '未申请' },
  CANDIDATE: { color: 'blue', label: '候选' },
  GENERATING: { color: 'processing', label: '制作中' },
  PENDING_CONFIRMATION: { color: 'warning', label: '待确认' },
  PUBLISHING: { color: 'processing', label: '发布中' },
  ONLINE: { color: 'success', label: '已上线' },
  ACTION_REQUIRED: { color: 'error', label: '需处理' }
}

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
