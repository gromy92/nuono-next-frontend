import type {
  ProductSummarySurface,
  ProductWorkbenchContext,
  ProductWorkbenchPayload,
  ProductWorkbenchState
} from '../types'
import {
  areSnapshotPartsEqual,
  cloneRecordList,
  nowSyncTime
} from './common'
import { createProductMasterSnapshotPayload } from '../../product-domain/productMasterSnapshot'

export function buildProductWorkbenchState(payload: ProductWorkbenchPayload): ProductWorkbenchState {
  const baseline = createProductMasterSnapshotPayload(payload.baselineSnapshot ?? payload)
  const draft = createProductMasterSnapshotPayload(payload.draftSnapshot ?? payload.baselineSnapshot ?? payload)
  const fetchedAtCandidates = [
    payload.lastSyncedAt,
    typeof draft.storeContext.fetchedAt === 'string' ? draft.storeContext.fetchedAt : undefined,
    typeof baseline.storeContext.fetchedAt === 'string' ? baseline.storeContext.fetchedAt : undefined,
    nowSyncTime()
  ]
  const fetchedAt = fetchedAtCandidates.find((item) => typeof item === 'string' && item) ?? nowSyncTime()

  baseline.storeContext = {
    ...baseline.storeContext,
    fetchedAt
  }
  draft.storeContext = {
    ...draft.storeContext,
    fetchedAt:
      typeof draft.storeContext.fetchedAt === 'string' && draft.storeContext.fetchedAt
        ? draft.storeContext.fetchedAt
        : fetchedAt
  }

  return {
    baseline,
    draft,
    syncStatus: payload.syncStatus ?? (areSnapshotPartsEqual(draft, baseline) ? 'synced' : 'draft'),
    lastSyncedAt: fetchedAt,
    note:
      payload.note ??
      (payload.degraded
        ? `已按降级模式打开详情${payload.missingOperationalKeys?.length ? `，当前缺少 ${payload.missingOperationalKeys.join(' / ')}` : ''}。`
        : '已读取本地商品基线，可以开始调整商品信息和当前站点经营内容。'),
    keyContentHistory: cloneRecordList(payload.keyContentHistory ?? []),
    pendingKeyContentHistoryCount: Number(payload.pendingKeyContentHistoryCount ?? 0),
    pendingKeyContentHistoryVisibleAfter:
      typeof payload.pendingKeyContentHistoryVisibleAfter === 'string' && payload.pendingKeyContentHistoryVisibleAfter
        ? payload.pendingKeyContentHistoryVisibleAfter
        : undefined
  }
}

export function isPublicDetailReadonlyWorkbench(workbench?: ProductWorkbenchState | null) {
  if (!workbench) return false
  return [workbench.baseline?.mode, workbench.draft?.mode].some(
    (mode) => String(mode ?? '').trim().toLowerCase() === 'public-detail-readonly'
  )
}

export function buildProductWorkbenchContext(params: {
  mode?: 'mock' | 'real'
  source?: ProductWorkbenchContext['source']
  storeCode?: string
  skuParent?: string
  currentZCode?: string
  partnerSku?: string
  pskuCode?: string
  summaryPreview?: ProductSummarySurface | null
}): ProductWorkbenchContext {
  return {
    mode: params.mode ?? 'real',
    source: params.source ?? 'unknown',
    storeCode: params.storeCode,
    skuParent: params.currentZCode || params.skuParent,
    currentZCode: params.currentZCode || params.skuParent,
    partnerSku: params.partnerSku,
    pskuCode: params.pskuCode,
    summaryPreview: params.summaryPreview ?? null,
    openedAt: nowSyncTime()
  }
}

export function buildProductWorkbenchPayloadFromState(
  payload: ProductWorkbenchPayload,
  workbench: ProductWorkbenchState,
  overrides?: Partial<ProductWorkbenchPayload>
): ProductWorkbenchPayload {
  const nextDraft = createProductMasterSnapshotPayload(workbench.draft)
  return {
    ...payload,
    ...nextDraft,
    baselineSnapshot: createProductMasterSnapshotPayload(workbench.baseline),
    draftSnapshot: createProductMasterSnapshotPayload(workbench.draft),
    syncStatus: workbench.syncStatus,
    lastSyncedAt: workbench.lastSyncedAt,
    note: workbench.note,
    keyContentHistory: cloneRecordList(workbench.keyContentHistory),
    pendingKeyContentHistoryCount: workbench.pendingKeyContentHistoryCount,
    pendingKeyContentHistoryVisibleAfter: workbench.pendingKeyContentHistoryVisibleAfter,
    ...overrides
  }
}
