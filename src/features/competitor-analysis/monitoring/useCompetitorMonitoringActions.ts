import { App } from 'antd'
import { normalizeError } from '../../../shared/api'
import {
  fetchCompetitorRefreshRun,
  fetchCompetitorTask,
  requestCompetitorMonitoring,
  requestCompetitorRefresh,
  type CompetitorTask
} from '../api'
import { sameProductLine } from '../productList/competitorProductIdentity'
import type { CompetitorWatchProduct } from '../types'

export function useCompetitorMonitoringActions({
  selectedStoreCode,
  selectedSiteCode,
  setProducts,
  loadProductDetail,
  reloadProductBaselines,
  setActionLoading
}: {
  selectedStoreCode?: string
  selectedSiteCode?: string
  setProducts: React.Dispatch<React.SetStateAction<CompetitorWatchProduct[]>>
  loadProductDetail: (
    productId: string,
    options?: { showLoading?: boolean }
  ) => Promise<CompetitorWatchProduct | undefined>
  reloadProductBaselines: () => Promise<void>
  setActionLoading: (value: string | null) => void
}) {
  const { message } = App.useApp()

  const handleManualRefresh = async (product: CompetitorWatchProduct) => {
    if (!product.id) {
      message.warning('请先启用竞品分析')
      return
    }
    const activeKeywordCount =
      product.activeKeywordCount ??
      product.keywords.filter((keyword) => keyword.status === 'active').length
    if (activeKeywordCount <= 0) {
      message.warning('请先维护至少一个启用关键词')
      return
    }
    setActionLoading(`refresh-${product.id}`)
    try {
      const run = await requestCompetitorRefresh(product.id)
      const runId = run.runId
      setProducts((current) =>
        current.map((item) =>
          sameProductLine(item, product)
            ? {
                ...item,
                latestRunStatus: 'running',
                latestRunAt: item.latestRunAt || '-'
              }
            : item
        )
      )
      if (!runId) {
        message.success('抓取任务已提交')
        return
      }
      message.success(`抓取任务已提交：${runId}`)
      let latestRun = run
      for (let attempt = 0; attempt < 20; attempt += 1) {
        if (isTerminalRefreshStatus(latestRun.runStatus)) break
        await delay(900)
        latestRun = await fetchCompetitorRefreshRun(runId)
      }
      if (isSuccessfulRefreshStatus(latestRun.runStatus)) {
        await loadProductDetail(product.id, { showLoading: false })
        message.success('抓取完成，抓取结果已刷新')
        return
      }
      if (latestRun.runStatus && isTerminalRefreshStatus(latestRun.runStatus)) {
        message.error(
          latestRun.errorMessage || latestRun.errorCode || '抓取失败'
        )
        return
      }
      message.info('抓取仍在运行，稍后重新打开详情可查看结果')
    } catch (error) {
      message.error(normalizeError(error, '提交竞品抓取失败'))
    } finally {
      setActionLoading(null)
    }
  }

  const handleManualMonitoring = async () => {
    if (!selectedStoreCode || !selectedSiteCode) {
      message.warning('请先选择店铺和站点')
      return
    }
    setActionLoading('store-monitoring')
    try {
      const task = await requestCompetitorMonitoring(
        selectedStoreCode,
        selectedSiteCode
      )
      const taskId = task.taskId
      message.success(
        taskId ? `手动监控任务已提交：${taskId}` : '手动监控任务已提交'
      )
      if (!taskId) {
        await reloadProductBaselines()
        return
      }
      let latestTask = task
      for (let attempt = 0; attempt < 20; attempt += 1) {
        if (isTerminalTaskStatus(latestTask.status)) break
        await delay(900)
        latestTask = await fetchCompetitorTask(taskId)
      }
      if (latestTask.status?.toUpperCase() === 'SUCCEEDED') {
        await reloadProductBaselines()
        message.success(
          monitoringTaskSummary(latestTask) || '手动监控批次已提交商品抓取'
        )
        return
      }
      if (latestTask.status && isTerminalTaskStatus(latestTask.status)) {
        message.error(
          latestTask.message || latestTask.errorCode || '手动监控失败'
        )
        return
      }
      message.info('手动监控批次仍在提交，稍后刷新列表查看各商品抓取状态')
    } catch (error) {
      message.error(normalizeError(error, '提交手动监控失败'))
    } finally {
      setActionLoading(null)
    }
  }

  return { handleManualRefresh, handleManualMonitoring }
}

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function isTerminalRefreshStatus(status?: string) {
  const value = status?.toUpperCase()
  return value === 'SUCCEEDED' || value === 'PARTIAL_FAILED' || value === 'FAILED'
}

function isSuccessfulRefreshStatus(status?: string) {
  const value = status?.toUpperCase()
  return value === 'SUCCEEDED' || value === 'PARTIAL_FAILED'
}

function isTerminalTaskStatus(status?: string) {
  const value = status?.toUpperCase()
  return value === 'SUCCEEDED' || value === 'FAILED' || value === 'CANCELLED'
}

function monitoringTaskSummary(task: CompetitorTask) {
  if (!task.resultJson) return ''
  try {
    const payload = JSON.parse(task.resultJson) as {
      watchProductTotal?: number
      submittedCount?: number
      failedCount?: number
    }
    if (typeof payload.submittedCount !== 'number') return ''
    const total =
      typeof payload.watchProductTotal === 'number'
        ? payload.watchProductTotal
        : payload.submittedCount
    const failed =
      typeof payload.failedCount === 'number' ? payload.failedCount : 0
    return failed > 0
      ? `已提交 ${payload.submittedCount}/${total} 个商品，${failed} 个提交失败`
      : `已提交 ${payload.submittedCount} 个商品抓取`
  } catch {
    return ''
  }
}
