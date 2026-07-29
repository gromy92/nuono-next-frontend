import { buildSourceCollectionAli1688View } from '../source-collection/ali1688'
import type {
  Ali1688CandidateLevel,
  Ali1688CollectionStatus,
  Ali1688CollectionView,
  ProductSelectionSourceCollection
} from '../source-collection/types'

export type Ali1688TaskFilter = 'all' | 'collecting' | 'review' | 'ready' | 'exception'

export type Ali1688Task = {
  record: ProductSelectionSourceCollection
  view: Ali1688CollectionView
  group: Exclude<Ali1688TaskFilter, 'all'>
  progress: number
  recommendedCount: number
  candidateCount: number
}

type StatusMeta = {
  label: string
  color: string
  tone: 'neutral' | 'blue' | 'green' | 'orange' | 'red'
}

export const STATUS_META: Record<Ali1688CollectionStatus, StatusMeta> = {
  not_started: { label: '未开始', color: 'default', tone: 'neutral' },
  queued: { label: '排队中', color: 'blue', tone: 'blue' },
  running: { label: '采集中', color: 'processing', tone: 'blue' },
  success: { label: '采集成功', color: 'success', tone: 'green' },
  partial_success: { label: '部分成功', color: 'warning', tone: 'orange' },
  failed: { label: '采集失败', color: 'error', tone: 'red' }
}

export const CANDIDATE_LEVEL_META: Record<Ali1688CandidateLevel, StatusMeta> = {
  recommended: { label: '推荐', color: 'success', tone: 'green' },
  review: { label: '待确认', color: 'warning', tone: 'orange' },
  reject: { label: '淘汰', color: 'default', tone: 'neutral' }
}

export const TASK_FILTER_LABELS: Record<Ali1688TaskFilter, string> = {
  all: '全部',
  collecting: '待接入',
  review: '待确认',
  ready: 'Top5',
  exception: '异常'
}

const PROCUREMENT_PENDING_SLOT_COUNT = 5

export function buildAli1688Task(record: ProductSelectionSourceCollection): Ali1688Task {
  const view = buildSourceCollectionAli1688View(record)
  const candidateCount = view.candidateCount ?? view.candidates?.length ?? 0
  const recommendedCount =
    view.recommendedCount ?? view.candidates?.filter((candidate) => candidate.level === 'recommended').length ?? 0

  return {
    record,
    view,
    group: resolveTaskGroup(view),
    progress: normalizeProgress(view),
    recommendedCount,
    candidateCount
  }
}

export function getTaskId(task: Ali1688Task) {
  return task.view.taskId || task.view.id
}

export function getSourceCollectionId(task: Ali1688Task) {
  return task.view.sourceCollectionId || task.record.id
}

export function resolvePendingSlotCount(view: Ali1688CollectionView, candidateCount: number) {
  if (candidateCount > 0) return 0
  return view.status === 'queued' || view.status === 'running' ? PROCUREMENT_PENDING_SLOT_COUNT : 0
}

export function sortAli1688Tasks(first: Ali1688Task, second: Ali1688Task) {
  const groupWeight: Record<Ali1688Task['group'], number> = {
    ready: 1,
    review: 2,
    collecting: 3,
    exception: 4
  }
  if (groupWeight[first.group] !== groupWeight[second.group]) {
    return groupWeight[first.group] - groupWeight[second.group]
  }
  return (second.record.collectedAt || '').localeCompare(first.record.collectedAt || '')
}

function resolveTaskGroup(view: Ali1688CollectionView): Exclude<Ali1688TaskFilter, 'all'> {
  if (view.status === 'failed') return 'exception'
  if (view.status === 'queued' || view.status === 'running' || view.status === 'not_started') {
    return 'collecting'
  }
  if ((view.candidates || []).some((candidate) => candidate.selectedRankNo != null || candidate.level === 'recommended')) {
    return 'ready'
  }
  return 'review'
}

function normalizeProgress(view: Ali1688CollectionView) {
  if (view.progressPercent != null) {
    return Math.min(Math.max(view.progressPercent, 0), 100)
  }
  if (view.status === 'success' || view.status === 'partial_success') return 100
  if (view.status === 'queued') return 12
  if (view.status === 'running') return 48
  return 0
}
