import { apiFetch, parseApiResponse } from '../../shared/api'
import type { ReplenishmentPlanOverview, ReplenishmentPlanQuery } from './types'

export async function fetchReplenishmentPlanOverview(query: ReplenishmentPlanQuery) {
  const params = new URLSearchParams({
    storeCode: query.storeCode,
    siteCode: query.siteCode
  })
  return parseApiResponse<ReplenishmentPlanOverview>(
    await apiFetch(`/api/replenishment-plan/overview?${params.toString()}`),
    '补货计划加载失败'
  )
}
