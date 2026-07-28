import { apiFetch, parseApiResponse } from '../../../shared/api'

import type {
  Ali1688HistoricalOrderDeleteRequest,
  Ali1688HistoricalOrderDeleteResult,
  Ali1688HistoricalOrderDetail,
  Ali1688HistoricalOrderQuery,
  Ali1688HistoricalOrderWorkbench,
  Ali1688OpenApiAuthorizationStart
} from '../types'

export function loadAli1688HistoricalOrderWorkbench(
  query?: Ali1688HistoricalOrderQuery
): Promise<Ali1688HistoricalOrderWorkbench> {
  const searchParams = new URLSearchParams()
  Object.entries(query || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim()) {
      searchParams.set(key, String(value))
    }
  })
  const queryString = searchParams.toString()
  const url = `/api/procurement/ali1688-orders/workbench${queryString ? `?${queryString}` : ''}`
  return apiFetch(url).then((response) =>
    parseApiResponse<Ali1688HistoricalOrderWorkbench>(response, '读取 1688 历史订单失败')
  )
}

export function createDevAli1688HistoricalOrderAuthorization(): Promise<Ali1688HistoricalOrderWorkbench> {
  return apiFetch('/api/procurement/ali1688-orders/authorizations/dev', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: '{}'
  }).then((response) =>
    parseApiResponse<Ali1688HistoricalOrderWorkbench>(response, '授权 1688 历史订单失败')
  )
}

export function startAli1688OpenApiAuthorization(
  query?: Pick<Ali1688HistoricalOrderQuery, 'storeCode' | 'siteCode'>
): Promise<Ali1688OpenApiAuthorizationStart> {
  const searchParams = new URLSearchParams()
  if (query?.storeCode?.trim()) {
    searchParams.set('storeCode', query.storeCode)
  }
  if (query?.siteCode?.trim()) {
    searchParams.set('siteCode', query.siteCode)
  }
  const queryString = searchParams.toString()
  return apiFetch(`/api/procurement/ali1688-orders/authorizations/open-api/start${queryString ? `?${queryString}` : ''}`)
    .then((response) =>
      parseApiResponse<Ali1688OpenApiAuthorizationStart>(response, '发起 1688 授权失败')
    )
}

export function runInitialAli1688HistoricalOrderSync(): Promise<Ali1688HistoricalOrderWorkbench> {
  return apiFetch('/api/procurement/ali1688-orders/sync-tasks/initial-backfill', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: '{}'
  }).then((response) =>
    parseApiResponse<Ali1688HistoricalOrderWorkbench>(response, '同步 1688 历史订单失败')
  )
}

export function runManualAli1688HistoricalOrderRefresh(): Promise<Ali1688HistoricalOrderWorkbench> {
  return apiFetch('/api/procurement/ali1688-orders/sync-tasks/manual-refresh', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: '{}'
  }).then((response) =>
    parseApiResponse<Ali1688HistoricalOrderWorkbench>(response, '刷新 1688 历史订单失败')
  )
}

export function deleteAli1688HistoricalOrder(
  orderId: string,
  request: Ali1688HistoricalOrderDeleteRequest
): Promise<Ali1688HistoricalOrderDeleteResult> {
  return apiFetch(`/api/procurement/ali1688-orders/${encodeURIComponent(orderId)}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  }).then((response) =>
    parseApiResponse<Ali1688HistoricalOrderDeleteResult>(response, '删除 1688 历史订单失败')
  )
}

export function loadAli1688HistoricalOrderDetail(
  orderId: string,
  query?: Pick<Ali1688HistoricalOrderQuery, 'storeCode' | 'siteCode'>
): Promise<Ali1688HistoricalOrderDetail> {
  const searchParams = new URLSearchParams()
  Object.entries(query || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim()) {
      searchParams.set(key, String(value))
    }
  })
  const queryString = searchParams.toString()
  const url = `/api/procurement/ali1688-orders/${encodeURIComponent(orderId)}${queryString ? `?${queryString}` : ''}`
  return apiFetch(url).then((response) =>
    parseApiResponse<Ali1688HistoricalOrderDetail>(response, '读取 1688 历史订单详情失败')
  )
}
