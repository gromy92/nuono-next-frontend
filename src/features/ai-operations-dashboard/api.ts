import type { AiOperationsDashboardOverview, AiOperationsDashboardQuery } from './types'

export class AiOperationsDashboardApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'AiOperationsDashboardApiError'
    this.status = status
  }
}

export function fetchAiOperationsDashboardOverview(query: AiOperationsDashboardQuery) {
  const params = new URLSearchParams({
    datePreset: query.datePreset
  })
  if (query.storeCode) {
    params.set('storeCode', query.storeCode)
  }
  if (query.siteCode) {
    params.set('siteCode', query.siteCode)
  }
  return getJson<AiOperationsDashboardOverview>(`/api/ai-operations-dashboard/overview?${params.toString()}`)
}

async function getJson<TResponse>(url: string): Promise<TResponse> {
  const response = await fetch(url)
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    const message =
      payload && typeof payload.message === 'string' && payload.message
        ? payload.message
        : `请求失败：${response.status}`
    throw new AiOperationsDashboardApiError(response.status, message)
  }
  return payload as TResponse
}
