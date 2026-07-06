import type {
  SalesForecastFollowUpInput,
  SalesForecastFollowUpResult,
  SalesForecastDetail,
  SalesForecastExportOptions,
  SalesForecastOverview,
  SalesForecastQuery,
  SalesForecastRunStatus
} from './types'

export class SalesForecastApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'SalesForecastApiError'
    this.status = status
  }
}

export function fetchSalesForecastOverview(query: SalesForecastQuery) {
  const params = new URLSearchParams({
    storeCode: query.storeCode,
    siteCode: query.siteCode
  })
  return getJson<SalesForecastOverview>(`/api/sales-forecast/overview?${params.toString()}`)
}

export function fetchSalesForecastDetail(query: SalesForecastQuery, partnerSku: string) {
  const params = new URLSearchParams({
    storeCode: query.storeCode,
    siteCode: query.siteCode,
    partnerSku
  })
  return getJson<SalesForecastDetail>(`/api/sales-forecast/detail?${params.toString()}`)
}

export function setSalesForecastFollowUp(input: SalesForecastFollowUpInput) {
  return postJson<SalesForecastFollowUpResult>('/api/sales-forecast/follow-ups', input)
}

export function recalculateSalesForecast(query: SalesForecastQuery) {
  const params = new URLSearchParams({
    storeCode: query.storeCode,
    siteCode: query.siteCode
  })
  return postJson<SalesForecastRunStatus>(`/api/sales-forecast/recalculate?${params.toString()}`, null)
}

export async function exportSalesForecastCsv(query: SalesForecastQuery, options: SalesForecastExportOptions) {
  const params = new URLSearchParams({
    storeCode: query.storeCode,
    siteCode: query.siteCode,
    forecastWindow: String(options.forecastWindow),
    searchKeyword: options.searchKeyword,
    lifecycleFilter: options.lifecycleFilter,
    riskFilter: options.riskFilter,
    confidenceFilter: options.confidenceFilter
  })
  const response = await fetch(`/api/sales-forecast/export?${params.toString()}`)
  const content = await response.text()
  if (!response.ok) {
    throw new SalesForecastApiError(response.status, content || `请求失败：${response.status}`)
  }
  const disposition = response.headers.get('Content-Disposition') || ''
  const filenameMatch = disposition.match(/filename="?([^"]+)"?/i)
  return {
    filename: filenameMatch?.[1] || 'sales-forecast.csv',
    content
  }
}

async function getJson<TResponse>(url: string): Promise<TResponse> {
  const response = await fetch(url)
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    const message =
      payload && typeof payload.message === 'string' && payload.message
        ? payload.message
        : `请求失败：${response.status}`
    throw new SalesForecastApiError(response.status, message)
  }
  return payload as TResponse
}

async function postJson<TResponse>(url: string, body: unknown): Promise<TResponse> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    const message =
      payload && typeof payload.message === 'string' && payload.message
        ? payload.message
        : `请求失败：${response.status}`
    throw new SalesForecastApiError(response.status, message)
  }
  return payload as TResponse
}
