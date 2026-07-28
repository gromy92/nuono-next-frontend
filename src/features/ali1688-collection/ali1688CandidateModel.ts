import { inquiryStatusMeta } from '../procurement-confirmation/statusMeta'
import type { ProcurementInquiryStatus } from '../procurement-confirmation/types'
import type { Ali1688CandidatePreview } from '../source-collection/types'

export type ProcurementStageMeta = {
  status: ProcurementInquiryStatus
  label: string
  color: string
  description: string
}

export type CandidateScoreBreakdown = {
  matchScore?: number
  specScore?: number
  priceScore?: number
  moqScore?: number
  supplierScore?: number
  deliveryScore?: number
}

export type CandidateScoring = {
  label: '综合分' | '规则分' | '待评分'
  totalScore?: number
  breakdown: CandidateScoreBreakdown
}

const PROCUREMENT_STAGE_LABELS: Record<ProcurementInquiryStatus, string> = {
  BACKUP_POOL: '待入Top5',
  IN_POOL_WAITING_SEND: '待自动询盘',
  IN_POOL_WAITING_REPLY: '自动询盘中',
  FOLLOW_UP_1_SENT: '沟通中',
  FOLLOW_UP_2_SENT: '沟通中',
  FOLLOW_UP_3_SENT: '沟通中',
  REPLIED: '已回复',
  PARTIAL_REPLY: '回复不完整',
  NO_REPLY_HANDOFF: '无回复转人工',
  SEND_FAILED: '发送失败',
  REPLY_PARSE_FAILED: '解析失败',
  REMOVED_TERMINATED: '已终止',
  CLOSED: '已收口'
}

const PROCUREMENT_STAGE_DESCRIPTIONS: Record<ProcurementInquiryStatus, string> = {
  BACKUP_POOL: '等待进入待选池',
  IN_POOL_WAITING_SEND: '等待发送询盘',
  IN_POOL_WAITING_REPLY: '询盘已发送，等待回复',
  FOLLOW_UP_1_SENT: '已催发 1 次',
  FOLLOW_UP_2_SENT: '已催发 2 次',
  FOLLOW_UP_3_SENT: '已催发 3 次',
  REPLIED: '供应商已回复',
  PARTIAL_REPLY: '报价字段待补齐',
  NO_REPLY_HANDOFF: '24小时无回复',
  SEND_FAILED: '需人工查看发送链路',
  REPLY_PARSE_FAILED: '需人工确认回复内容',
  REMOVED_TERMINATED: '已移出待选池',
  CLOSED: '自动询盘已收口'
}

export const SCORE_BREAKDOWN_ITEMS: Array<{
  key: keyof CandidateScoreBreakdown
  label: string
  max: number
}> = [
  { key: 'matchScore', label: '匹配', max: 35 },
  { key: 'specScore', label: '规格', max: 20 },
  { key: 'priceScore', label: '价格', max: 15 },
  { key: 'moqScore', label: 'MOQ', max: 10 },
  { key: 'supplierScore', label: '供应商', max: 12 },
  { key: 'deliveryScore', label: '物流', max: 8 }
]

export function resolvePendingSlotStage(): ProcurementStageMeta {
  return getProcurementStageMeta('BACKUP_POOL')
}

export function resolveCandidateStage(candidate: Ali1688CandidatePreview): ProcurementStageMeta {
  const candidateWithStage = candidate as Ali1688CandidatePreview & {
    inquiryStatus?: string
    procurementInquiryStatus?: string
    poolInquiryStatus?: string
  }
  const explicitStatus = [
    candidateWithStage.inquiryStatus,
    candidateWithStage.procurementInquiryStatus,
    candidateWithStage.poolInquiryStatus
  ].find(isProcurementInquiryStatus)

  if (explicitStatus) return getProcurementStageMeta(explicitStatus)
  if (candidate.level === 'reject') return getProcurementStageMeta('REMOVED_TERMINATED')
  if (candidate.selectedRankNo != null || candidate.level === 'recommended') {
    return getProcurementStageMeta('IN_POOL_WAITING_SEND')
  }
  return getProcurementStageMeta('BACKUP_POOL')
}

export function buildCandidateImages(candidate: Ali1688CandidatePreview, fallbackImage?: string) {
  const candidateWithImages = candidate as Ali1688CandidatePreview & { imageUrls?: string[] }
  return Array.from(
    new Set([candidate.imageUrl, ...(candidateWithImages.imageUrls || []), fallbackImage].filter(Boolean) as string[])
  )
}

export function resolveCandidateScoring(candidate: Ali1688CandidatePreview): CandidateScoring {
  const breakdown = candidate.scoreBreakdown || {}
  if (candidate.totalScore != null && candidate.scoreStatus === 'final') {
    return { label: '综合分', totalScore: candidate.totalScore, breakdown }
  }
  if (candidate.ruleScore != null) {
    return { label: '规则分', totalScore: candidate.ruleScore, breakdown }
  }
  return { label: '待评分', breakdown }
}

function getProcurementStageMeta(status: ProcurementInquiryStatus): ProcurementStageMeta {
  const meta = inquiryStatusMeta[status]
  return {
    status,
    label: PROCUREMENT_STAGE_LABELS[status] || meta.label,
    color: meta.color,
    description: PROCUREMENT_STAGE_DESCRIPTIONS[status] || meta.description
  }
}

function isProcurementInquiryStatus(status?: string): status is ProcurementInquiryStatus {
  return Boolean(status && Object.prototype.hasOwnProperty.call(inquiryStatusMeta, status))
}
