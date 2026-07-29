import type { CandidateCollectionTaskDto } from './dto'
import type {
  ProcurementCollectionStatus,
  ProcurementInquiryStatus,
  ProcurementPoolStatus
} from './types'
import { nonEmpty, upper } from './procurementMapperUtils'

export function mapPoolStatus(poolStatus?: string | null, demandStatus?: string): ProcurementPoolStatus {
  const normalized = poolStatus || demandStatus || ''
  if (
    normalized === 'SOURCE_COLLECTING'
    || normalized === 'POOL_CREATED'
    || normalized === 'POOL_INQUIRY_RUNNING'
    || normalized === 'POOL_PARTIAL_HANDOFF'
    || normalized === 'POOL_EMPTY_REQUIRES_ACTION'
    || normalized === 'POOL_INQUIRY_FINISHED'
    || normalized === 'FINAL_TWO_CONFIRMED'
    || normalized === 'SUMMARY_READY'
  ) {
    return normalized
  }
  if (!poolStatus && (demandStatus === 'SCREENING' || demandStatus === 'COLLECTING' || demandStatus === 'MATERIAL_COLLECTING')) {
    return 'SOURCE_COLLECTING'
  }
  return 'POOL_EMPTY_REQUIRES_ACTION'
}

export function mapInquiryStatus(itemStatus?: string, taskStatus?: string | null): ProcurementInquiryStatus {
  if (
    itemStatus === 'IN_POOL_WAITING_SEND'
    || itemStatus === 'IN_POOL_WAITING_REPLY'
    || itemStatus === 'FOLLOW_UP_1_SENT'
    || itemStatus === 'FOLLOW_UP_2_SENT'
    || itemStatus === 'FOLLOW_UP_3_SENT'
    || itemStatus === 'REPLIED'
    || itemStatus === 'PARTIAL_REPLY'
    || itemStatus === 'NO_REPLY_HANDOFF'
    || itemStatus === 'SEND_FAILED'
    || itemStatus === 'REPLY_PARSE_FAILED'
    || itemStatus === 'REMOVED_TERMINATED'
    || itemStatus === 'CLOSED'
  ) {
    return itemStatus
  }
  if (taskStatus === 'SENT' || taskStatus === 'CHATTING') return 'IN_POOL_WAITING_REPLY'
  if (taskStatus === 'HANDOFF') return 'SEND_FAILED'
  return 'IN_POOL_WAITING_SEND'
}

export function resolveReplySummary(itemStatus?: string, taskStatus?: string | null) {
  if (taskStatus === 'SENT') return '首条询价已发出，等待供应商回复。'
  if (taskStatus === 'HANDOFF') return '自动询价任务已转人工处理。'
  if (itemStatus === 'IN_POOL_WAITING_SEND') return '已进入待选池，等待发送首条询价。'
  return '等待自动询价结果同步。'
}

export function resolveResultNotice(status: ProcurementPoolStatus, hasPool: boolean) {
  if (!hasPool) return '当前需求还没有待选池，可生成待选池后开始自动询价。'
  if (status === 'SUMMARY_READY') return '最终 2 个候选已确认，AI 总结已生成。'
  if (status === 'POOL_INQUIRY_FINISHED') return '本轮自动询价已收口，可确认最终 2 个候选。'
  if (status === 'POOL_EMPTY_REQUIRES_ACTION') return '当前待选池为空，可从备选池补入候选继续自动询价。'
  return '待选池已生成，系统会对池内候选执行自动询价。'
}

export function resolveSourceCollectionStatus(
  demandStatus?: string | null,
  sourceTitle?: string | null,
  sourceImageUrl?: string | null,
  sourceDetailImageUrl?: string | null
): ProcurementCollectionStatus {
  const hasTitle = Boolean(nonEmpty(sourceTitle))
  const hasImage = Boolean(nonEmpty(sourceImageUrl))
  const hasDetail = Boolean(nonEmpty(sourceDetailImageUrl))
  if (hasTitle && (hasImage || hasDetail)) return 'SUCCESS'
  if (hasTitle || hasImage || hasDetail) return 'PARTIAL_SUCCESS'
  if (
    demandStatus === 'SCREENING'
    || demandStatus === 'COLLECTING'
    || demandStatus === 'MATERIAL_COLLECTING'
    || demandStatus === 'SOURCE_COLLECTING'
  ) {
    return 'COLLECTING'
  }
  return 'COLLECTING'
}

export function resolveSourceCollectionMessage(
  demandStatus?: string | null,
  sourceTitle?: string | null,
  sourceImageUrl?: string | null,
  sourceDetailImageUrl?: string | null
) {
  const status = resolveSourceCollectionStatus(demandStatus, sourceTitle, sourceImageUrl, sourceDetailImageUrl)
  if (status === 'SUCCESS') return '源头商品标题、图片或详情已采集。'
  if (status === 'PARTIAL_SUCCESS') return '源头商品信息已部分采集，缺失内容等待补齐。'
  return '原链接采集中，未采集到的信息不会在列表伪造展示。'
}

export function resolveCandidateCollectionStatus(
  status: ProcurementPoolStatus,
  candidateCount: number,
  task?: CandidateCollectionTaskDto
): ProcurementCollectionStatus {
  const taskStatus = upper(task?.status)
  if (taskStatus === 'FAILED') return 'FAILED'
  if (taskStatus === 'PARTIAL_SUCCESS') return 'PARTIAL_SUCCESS'
  if (taskStatus === 'SUCCESS') return 'SUCCESS'
  if (taskStatus === 'RUNNING' || taskStatus === 'QUEUED') return 'COLLECTING'
  if (candidateCount > 0) return 'SUCCESS'
  if (status === 'SOURCE_COLLECTING') return 'COLLECTING'
  if (status === 'POOL_EMPTY_REQUIRES_ACTION') return 'NOT_STARTED'
  return 'COLLECTING'
}

export function resolveCandidateCollectionMessage(
  status: ProcurementPoolStatus,
  candidateCount: number,
  task?: CandidateCollectionTaskDto
) {
  const collectionStatus = resolveCandidateCollectionStatus(status, candidateCount, task)
  if (nonEmpty(task?.message)) return task?.message?.trim()
  if (collectionStatus === 'SUCCESS') {
    const resultCount = task?.resultCount ?? candidateCount
    const recommendedCount = task?.recommendedCount
    return recommendedCount != null
      ? `已完成 1688 图搜：采集 ${resultCount} 个，推荐 ${recommendedCount} 个。`
      : '已读取 1688 候选采集结果。'
  }
  if (collectionStatus === 'PARTIAL_SUCCESS') {
    return `1688 候选采集部分完成，当前采集 ${task?.resultCount ?? candidateCount} 个。`
  }
  if (collectionStatus === 'FAILED') return '1688 候选采集失败，等待重新采集。'
  if (collectionStatus === 'NOT_STARTED') return '等待源头商品信息完成后启动 1688 候选采集。'
  if (task?.progressPercent != null) return `1688 候选采集中，当前进度 ${task.progressPercent}%。`
  return '1688 候选采集中，未完成前不展示候选商品卡片。'
}

export function resolveCandidateCollectionMethod(task?: CandidateCollectionTaskDto, candidateCount = 0) {
  const searchMode = upper(task?.searchMode)
  if (searchMode === 'IMAGE_MULTI') return '1688 图搜（多图）'
  if (searchMode === 'IMAGE_SINGLE') return '1688 图搜（单图）'
  if (searchMode === 'KEYWORD') return '1688 关键词搜索'
  return task || candidateCount > 0 ? '1688 图搜 / 候选采集' : undefined
}
