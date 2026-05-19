import type {
  Ali1688CollectionView,
  ProductSelectionSourceCollection
} from './types'

export function buildSourceCollectionAli1688View(record: ProductSelectionSourceCollection): Ali1688CollectionView {
  if (record.ali1688Collection) {
    return record.ali1688Collection
  }

  return {
    status: 'not_started',
    progressPercent: 0,
    searchMode: '主图图搜',
    candidateCount: 0,
    recommendedCount: 0,
    message: '暂无真实1688候选采集任务。',
    canGenerateProcurementOrder: false,
    candidates: []
  }
}

export function normalizeAli1688Progress(view: Ali1688CollectionView) {
  if (view.progressPercent != null) {
    return Math.min(Math.max(view.progressPercent, 0), 100)
  }
  if (view.status === 'success' || view.status === 'partial_success') {
    return 100
  }
  if (view.status === 'failed' || view.status === 'not_started') {
    return 0
  }
  if (view.status === 'queued') {
    return 12
  }
  return 48
}
