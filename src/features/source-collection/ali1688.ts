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

export type Ali1688GatewayBanner = {
  message: string
  description: string
}

export type Ali1688FieldRestriction = 'detail_blocked' | 'gateway_blocked' | 'plugin_assisted'

export function resolveAli1688GatewayBanner(view: Ali1688CollectionView): Ali1688GatewayBanner | undefined {
  const status = view.gatewayStatus?.userFacingStatus
  if (status === 'blocked_by_captcha') {
    return {
      message: '1688 自动采集受限',
      description: view.gatewayStatus?.userFacingMessage || '系统已暂停自动采集。'
    }
  }
  if (status === 'login_required') {
    return {
      message: '1688 登录失效',
      description: view.gatewayStatus?.userFacingMessage || '系统已暂停自动采集。'
    }
  }
  if (status === 'cooling_down') {
    return {
      message: '1688 访问频繁 / 冷却中',
      description: view.gatewayStatus?.userFacingMessage || '系统冷却中。'
    }
  }
  if (status === 'unavailable') {
    return {
      message: '1688 自动采集通道暂不可用',
      description: view.gatewayStatus?.userFacingMessage || '系统已暂停自动采集。'
    }
  }
  return undefined
}

export function resolveAli1688FieldRestriction(view: Ali1688CollectionView): Ali1688FieldRestriction | undefined {
  if (view.detailCompletionStatus === 'blocked_by_captcha') {
    return 'detail_blocked'
  }
  if (isAli1688PluginAssistedResult(view)) {
    return 'plugin_assisted'
  }
  return resolveAli1688GatewayBanner(view) ? 'gateway_blocked' : undefined
}

export function canCreateAli1688PluginAssignment(view: Ali1688CollectionView, taskId?: string) {
  if (!taskId) {
    return false
  }
  if (view.pluginAssistAvailable === false) {
    return false
  }
  if (view.pluginAssistAvailable === true) {
    return true
  }
  const gatewayStatus = view.gatewayStatus?.userFacingStatus
  return gatewayStatus === 'blocked_by_captcha'
    || gatewayStatus === 'login_required'
    || gatewayStatus === 'cooling_down'
    || gatewayStatus === 'unavailable'
}

export function isAli1688PluginAssistedResult(view: Ali1688CollectionView) {
  const assignmentStatus = view.pluginAssignment?.status
  return assignmentStatus === 'created'
    || assignmentStatus === 'running'
    || assignmentStatus === 'accepted'
    || Boolean(view.failureCode?.startsWith('plugin_'))
}

export function resolveAli1688PluginStatusLabel(status?: string) {
  if (status === 'created') {
    return '待插件采集'
  }
  if (status === 'running') {
    return '插件采集中'
  }
  if (status === 'accepted') {
    return '插件候选已接收'
  }
  if (status === 'failed') {
    return '插件采集失败'
  }
  if (status === 'cancelled') {
    return '插件任务已取消'
  }
  if (status === 'expired') {
    return '插件任务已过期'
  }
  return '插件任务'
}
