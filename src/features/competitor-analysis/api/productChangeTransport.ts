import { apiFetch, parseApiResponse } from '../../../shared/api'
import type { CompetitorProductChangesResult } from '../types'
import type { BackendProductChangeResponse } from './backendContracts'
import {
  mapProductChangeBaselineSummary,
  mapProductChangeGroup
} from './productChangeMapper'

export async function fetchCompetitorProductChanges(
  watchProductId: string,
  limit = 100,
  signal?: AbortSignal
): Promise<CompetitorProductChangesResult> {
  const params = new URLSearchParams({ limit: String(limit) })
  const response = await apiFetch(`/api/competitor-analysis/watch-products/${watchProductId}/product-changes?${params}`, {
    signal
  })
  const payload = await parseApiResponse<BackendProductChangeResponse>(response, '读取商品详情变化失败')
  const rows = Array.isArray(payload) ? payload : payload.items || []
  return {
    items: rows.map(mapProductChangeGroup),
    baselineSummary: Array.isArray(payload) ? undefined : mapProductChangeBaselineSummary(payload.baselineSummary)
  }
}
