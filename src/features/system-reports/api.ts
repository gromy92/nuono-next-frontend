import type {
  NoonDataCompletenessFilters,
  NoonDataCompletenessOverview,
  NoonDataGapFilters,
  NoonDataGapPatrol,
  NoonCallStoreDataSyncResult,
  NoonCallStoreDataView,
  StoreDataReportOverview
} from './types'
import { apiFetch } from '../../shared/api'

export class SystemReportsApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'SystemReportsApiError'
    this.status = status
  }
}

export function fetchStoreDataReportOverview(storeCode?: string) {
  const params = new URLSearchParams()
  if (storeCode?.trim()) {
    params.set('storeCode', storeCode.trim())
  }
  const suffix = params.toString() ? `?${params.toString()}` : ''
  return getJson<StoreDataReportOverview>(`/api/system-reports/store-data/overview${suffix}`, '店铺数据报表加载失败')
}

export function fetchNoonDataCompletenessOverview(filters?: NoonDataCompletenessFilters) {
  const suffix = queryString(filters)
  return getJson<NoonDataCompletenessOverview>(
    `/api/system-reports/noon-data-completeness/overview${suffix}`,
    '数据完整度加载失败'
  )
}

export function fetchNoonDataGapPatrol(filters?: NoonDataGapFilters) {
  const suffix = queryString(filters)
  return getJson<NoonDataGapPatrol>(
    `/api/system-reports/noon-data-completeness/gaps${suffix}`,
    '数据缺口巡检加载失败'
  )
}

export function fetchNoonCallStoreData() {
  return getJson<NoonCallStoreDataView>('/api/noon-call/store-data', 'Noon 店铺数据加载失败')
}

export function syncNoonCallStoreDataCategory(
  ownerUserId: number,
  storeCode: string,
  siteCode: string,
  category: string
) {
  return postJson<NoonCallStoreDataSyncResult>(
    `/api/noon-call/store-data/${ownerUserId}/${encodeURIComponent(storeCode)}/${encodeURIComponent(siteCode)}/${category}/sync`,
    'Noon 店铺数据同步提交失败'
  )
}

export function retryNoonDataGap(gapId: number) {
  return postJson(`/api/system-reports/noon-data-completeness/gaps/${gapId}/retry`, '缺口重试提交失败')
}

export function pauseNoonDataGap(gapId: number, reason?: string) {
  const suffix = queryString({ reason })
  return postJson(`/api/system-reports/noon-data-completeness/gaps/${gapId}/pause${suffix}`, '缺口暂停提交失败')
}

export function resumeNoonDataGap(gapId: number) {
  return postJson(`/api/system-reports/noon-data-completeness/gaps/${gapId}/resume`, '缺口恢复提交失败')
}

export function reAuditNoonDataGap(gapId: number) {
  return postJson(`/api/system-reports/noon-data-completeness/gaps/${gapId}/reaudit`, '缺口重审提交失败')
}

function queryString(filters?: Record<string, string | number | boolean | null | undefined>) {
  const params = new URLSearchParams()
  Object.entries(filters ?? {}).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      return
    }
    const text = String(value).trim()
    if (text) {
      params.set(key, text)
    }
  })
  const serialized = params.toString()
  return serialized ? `?${serialized}` : ''
}

async function getJson<TResponse>(url: string, fallback?: string): Promise<TResponse> {
  const response = await apiFetch(url)
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    const message = normalizeSystemReportErrorMessage(payload, response.status, fallback)
    throw new SystemReportsApiError(response.status, message)
  }
  return payload as TResponse
}

async function postJson<TResponse = unknown>(url: string, fallback?: string): Promise<TResponse> {
  const response = await apiFetch(url, { method: 'POST' })
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    const message = normalizeSystemReportErrorMessage(payload, response.status, fallback)
    throw new SystemReportsApiError(response.status, message)
  }
  return payload as TResponse
}

function normalizeSystemReportErrorMessage(payload: unknown, status: number, fallback?: string) {
  const rawMessage =
    payload && typeof payload === 'object' && 'message' in payload && typeof payload.message === 'string'
      ? payload.message.trim()
      : ''
  if (rawMessage && !isBackendDefaultEmptyMessage(rawMessage)) {
    return rawMessage
  }
  return fallback ? `${fallback}（后端返回 ${status}）` : `请求失败：${status}`
}

function isBackendDefaultEmptyMessage(messageText: string) {
  return messageText === 'No message available'
}
