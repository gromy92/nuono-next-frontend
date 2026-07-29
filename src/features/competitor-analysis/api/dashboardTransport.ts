import { apiFetch, parseApiResponse } from '../../../shared/api'
import type { BackendCompetitorDashboard } from './backendContracts'
import type { CompetitorDashboardQuery } from './contracts'
import { mapDashboard } from './dashboardMapper'
import { appendSearchParam } from './transportValues'

export async function fetchCompetitorDashboard(query: CompetitorDashboardQuery, signal?: AbortSignal) {
  const params = new URLSearchParams({
    storeCode: query.storeCode,
    siteCode: query.siteCode,
    days: String(query.days || 7)
  })
  appendSearchParam(params, 'rankDirection', query.rankDirection)
  const response = await apiFetch(`/api/competitor-analysis/dashboard?${params}`, { signal })
  return mapDashboard(await parseApiResponse<BackendCompetitorDashboard>(response, '读取竞品看板失败'))
}
