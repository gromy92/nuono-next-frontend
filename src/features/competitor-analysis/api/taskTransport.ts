import { apiFetch, parseApiResponse } from '../../../shared/api'
import type { CompetitorRefreshRun, CompetitorTask } from './contracts'
import { mapRefreshRun, mapTask } from './taskMapper'

export async function requestCompetitorRefresh(watchProductId: string) {
  const response = await apiFetch(`/api/competitor-analysis/watch-products/${watchProductId}/refresh`, {
    method: 'POST'
  })
  return mapRefreshRun(await parseApiResponse<CompetitorRefreshRun>(response, '提交竞品刷新失败'))
}

export async function fetchCompetitorRefreshRun(runId: string) {
  const response = await apiFetch(`/api/competitor-analysis/refresh-runs/${runId}`)
  return mapRefreshRun(await parseApiResponse<CompetitorRefreshRun>(response, '读取竞品刷新状态失败'))
}

export async function fetchCompetitorTask(taskId: string) {
  const response = await apiFetch(`/api/competitor-analysis/tasks/${taskId}`)
  return mapTask(await parseApiResponse<CompetitorTask>(response, '读取竞品刷新任务失败'))
}

export async function requestCompetitorMonitoring(storeCode: string, siteCode: string) {
  const params = new URLSearchParams({ storeCode, siteCode })
  const response = await apiFetch(`/api/competitor-analysis/monitoring-runs/manual?${params}`, {
    method: 'POST'
  })
  return mapTask(await parseApiResponse<CompetitorTask>(response, '提交手动监控失败'))
}
