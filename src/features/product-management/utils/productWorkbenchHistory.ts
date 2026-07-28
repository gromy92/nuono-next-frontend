import type {
  ProductSyncStatus,
  ProductWorkbenchContext,
  ProductWorkbenchState,
  ProductWorkbenchSurfaceState
} from '../types'
import { productSyncStatusMeta } from '../../product-baseline'
import {
  cloneRecordList,
  normalizeProductSyncStatus,
  nowSyncTime,
  textInputValue
} from './common'

export function buildLocalProductRecentAction(params: {
  actionType: 'save' | 'pull' | 'publish-current' | 'rollback-draft'
  resultStatus: ProductSyncStatus
  message?: string
  targetSiteCode?: string
  workbench: ProductWorkbenchState
}) {
  return {
    occurredAt: nowSyncTime(),
    actionType: params.actionType,
    resultStatus: params.resultStatus,
    message: params.message,
    targetSiteCode: params.targetSiteCode,
    skuParent: textInputValue(params.workbench.draft.identity.skuParent) || undefined,
    partnerSku: textInputValue(params.workbench.draft.identity.partnerSku) || undefined,
    pskuCode: textInputValue(params.workbench.draft.identity.pskuCode) || undefined,
    offerCode: textInputValue(params.workbench.draft.identity.offerCode) || undefined,
    degraded: Boolean(params.workbench.draft.degraded)
  } satisfies Record<string, unknown>
}

export function prependRecentAction(
  recentActions: Array<Record<string, unknown>>,
  nextAction: Record<string, unknown>
) {
  return [nextAction, ...cloneRecordList(recentActions)].slice(0, 20)
}

export function productWorkbenchSourceLabel(source: ProductWorkbenchContext['source']) {
  switch (source) {
    case 'list-row':
      return '从商品列表进入'
    case 'quick-open':
      return '从快捷打开进入'
    case 'init-carrier':
      return '从初始化载体进入'
    case 'manual-open':
      return '手动打开详情'
    case 'route-open':
      return '从页面路由进入'
    default:
      return '从当前工作台进入'
  }
}

export function productWorkbenchSurfaceStatusMeta(
  surfaceState: ProductWorkbenchSurfaceState,
  workbench: ProductWorkbenchState | null
) {
  if (surfaceState.status === 'loading') {
    return {
      color: 'processing' as const,
      label: '正在建立工作台',
      note: surfaceState.message || '正在读取本地商品基线与草稿。'
    }
  }
  if (surfaceState.status === 'error') {
    return {
      color: 'warning' as const,
      label: '工作台打开失败',
      note: surfaceState.message
    }
  }
  if (surfaceState.status === 'ready' && workbench?.syncStatus) {
    const syncMeta = productSyncStatusMeta(workbench.syncStatus)
    return {
      color: syncMeta.color,
      label: `工作台已就绪 · ${syncMeta.label}`,
      note: workbench.note
    }
  }
  return {
    color: 'default' as const,
    label: '工作台待打开',
    note: '从商品列表选择一条商品后，工作台会在当前页面内建立。'
  }
}

export function productWorkbenchActionLabel(actionType: unknown) {
  if (actionType === 'save') return '保存草稿'
  if (actionType === 'pull') return '从 Noon 同步'
  if (actionType === 'publish-current') return '发布当前修改'
  if (actionType === 'rollback-draft') return '回滚草稿'
  return '最近动作'
}

export function productWorkbenchActionResultMeta(resultStatus: unknown) {
  const syncStatus = normalizeProductSyncStatus(resultStatus)
  if (syncStatus) return productSyncStatusMeta(syncStatus)
  return {
    color: 'default' as const,
    label: textInputValue(resultStatus) || '已记录'
  }
}

export function productHistoryEntryMeta(params: {
  usingMock: boolean
  isCurrentWorkbench: boolean
  pendingCount?: number
  historyCount?: number
  historyMetaReady?: boolean
  pendingVisibleAfter?: string
}) {
  const {
    usingMock,
    isCurrentWorkbench,
    pendingCount = 0,
    historyCount = 0,
    historyMetaReady = false,
    pendingVisibleAfter
  } = params

  if (usingMock) {
    return {
      tagLabel: '样本态演示',
      tagColor: 'default' as const,
      note: '当前展示的是样本态历史。'
    }
  }

  if (!isCurrentWorkbench) {
    if (historyMetaReady) {
      if (pendingCount > 0) {
        return {
          tagLabel: `待转正式 ${pendingCount}`,
          tagColor: 'processing' as const,
          note: pendingVisibleAfter
            ? `这条商品已有待转正式记录，预计 ${pendingVisibleAfter} 后可进入正式历史；完整内容请先进入详情。`
            : '这条商品已有待转正式记录；完整内容请先进入详情。'
        }
      }
      if (historyCount > 0) {
        return {
          tagLabel: `正式历史 ${historyCount}`,
          tagColor: 'success' as const,
          note: '这条商品已有正式历史；完整变更内容请先进入详情。'
        }
      }
      return {
        tagLabel: '暂无正式历史',
        tagColor: 'default' as const,
        note: '当前没有待转正式或正式历史记录；如需查看后续变更，请先进入详情。'
      }
    }
    return {
      tagLabel: '需先进入详情',
      tagColor: 'default' as const,
      note: '先进入详情后，再查看真实历史和待转正式状态。'
    }
  }

  if (pendingCount > 0) {
    return {
      tagLabel: `待转正式 ${pendingCount}`,
      tagColor: 'processing' as const,
      note: '最近发布的关键内容改动还在观察期内。'
    }
  }
  if (historyCount > 0) {
    return {
      tagLabel: `正式历史 ${historyCount}`,
      tagColor: 'success' as const,
      note: '当前已回读正式历史。'
    }
  }
  return {
    tagLabel: '暂无正式历史',
    tagColor: 'default' as const,
    note: '当前还没有进入正式历史的关键内容变更。'
  }
}
