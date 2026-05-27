import type {
  SalesAnalyticsQuery,
  SalesAnalyticsSummary,
  SalesActivityWindow,
  SalesActivityWindowInput,
  SalesActivityWindowSnapshot,
  SalesProductDetail,
  SalesProductRow,
  SalesHistoryBackfillResult,
  SalesTrendBucket
} from './types'
import { apiFetch } from '../../shared/api'

export class SalesAnalyticsApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'SalesAnalyticsApiError'
    this.status = status
  }
}

export function fetchSalesAnalyticsSummary(query: SalesAnalyticsQuery) {
  return getJson<SalesAnalyticsSummary>(`/api/sales-data/analytics/summary?${queryParams(query).toString()}`)
}

export function fetchSalesAnalyticsTrends(query: SalesAnalyticsQuery, granularity: string) {
  const params = queryParams(query)
  params.set('granularity', granularity)
  return getJson<SalesTrendBucket[]>(`/api/sales-data/analytics/trends?${params.toString()}`)
}

export function fetchSalesAnalyticsProducts(query: SalesAnalyticsQuery) {
  return getJson<SalesProductRow[]>(`/api/sales-data/analytics/products?${queryParams(query).toString()}`)
}

export function fetchActiveSalesActivityWindows(query: SalesAnalyticsQuery) {
  return getJson<SalesActivityWindowSnapshot>(`/api/sales-data/activity-windows/active?${queryParams(query).toString()}`)
}

export function fetchSalesActivityWindowHistory(query: SalesAnalyticsQuery) {
  return getJson<SalesActivityWindow[]>(`/api/sales-data/activity-windows/history?${queryParams(query).toString()}`)
}

export async function saveSalesActivityWindow(input: SalesActivityWindowInput) {
  const response = await apiFetch('/api/sales-data/activity-windows', {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify(input)
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    const message =
      payload && typeof payload.message === 'string' && payload.message
        ? payload.message
        : `活动配置保存失败：${response.status}`
    throw new SalesAnalyticsApiError(response.status, message)
  }
  return payload as SalesActivityWindow
}

export function fetchSalesProductDetail(query: SalesAnalyticsQuery, partnerSku: string, sku: string) {
  const params = queryParams(query)
  params.set('partnerSku', partnerSku)
  params.set('sku', sku)
  return getJson<SalesProductDetail>(`/api/sales-data/analytics/product-detail?${params.toString()}`)
}

export async function requestSalesHistoryBackfill(input: Pick<SalesAnalyticsQuery, 'storeCode' | 'siteCode' | 'dateFrom' | 'dateTo'>) {
  const response = await apiFetch('/api/sales-data/analytics/history-backfill', {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify(input)
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    const message =
      payload && typeof payload.message === 'string' && payload.message
        ? payload.message
        : `历史补全提交失败：${response.status}`
    throw new SalesAnalyticsApiError(response.status, message)
  }
  return payload as SalesHistoryBackfillResult
}

export async function exportSalesAnalyticsCsv(query: SalesAnalyticsQuery) {
  const response = await apiFetch(`/api/sales-data/analytics/export?${queryParams(query).toString()}`)
  if (!response.ok) {
    throw new SalesAnalyticsApiError(response.status, `导出失败：${response.status}`)
  }
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'sales-analytics.csv'
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function queryParams(query: SalesAnalyticsQuery) {
  const params = new URLSearchParams({
    storeCode: query.storeCode,
    siteCode: query.siteCode,
    dateFrom: query.dateFrom,
    dateTo: query.dateTo
  })
  if (query.search?.trim()) {
    params.set('search', query.search.trim())
  }
  if (query.brand?.trim()) {
    params.set('brand', query.brand.trim())
  }
  if (query.productFulltype?.trim()) {
    params.set('productFulltype', query.productFulltype.trim())
  }
  if (query.dataQualityCode?.trim()) {
    params.set('dataQualityCode', query.dataQualityCode.trim())
  }
  if (query.lifecycleCode?.trim()) {
    params.set('lifecycleCode', query.lifecycleCode.trim())
  }
  const partnerSkuList = Array.from(new Set((query.partnerSkuList || []).map((item) => item.trim()).filter(Boolean)))
  if (partnerSkuList.length) {
    params.set('partnerSkuList', partnerSkuList.join(','))
  }
  return params
}

async function getJson<TResponse>(url: string): Promise<TResponse> {
  const response = await apiFetch(url)
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    const message =
      payload && typeof payload.message === 'string' && payload.message
        ? payload.message
        : `请求失败：${response.status}`
    throw new SalesAnalyticsApiError(response.status, message)
  }
  return payload as TResponse
}
