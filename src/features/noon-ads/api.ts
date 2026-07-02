import { apiFetch, readApiErrorMessage } from '../../shared/api'
import type {
  NoonAdvertisingDashboardQuery,
  NoonAdvertisingDashboardView,
  NoonAdvertisingLatestReportWindow,
  NoonAdvertisingLatestReportWindowQuery
} from './types'

export class NoonAdvertisingApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'NoonAdvertisingApiError'
    this.status = status
  }
}

export function buildNoonAdvertisingDashboardParams(query: NoonAdvertisingDashboardQuery) {
  return new URLSearchParams({
    projectCode: query.projectCode,
    storeCode: query.storeCode,
    siteCode: query.siteCode,
    dateFrom: query.dateFrom,
    dateTo: query.dateTo
  })
}

export function buildNoonAdvertisingLatestReportWindowParams(query: NoonAdvertisingLatestReportWindowQuery) {
  return new URLSearchParams({
    projectCode: query.projectCode,
    storeCode: query.storeCode,
    siteCode: query.siteCode
  })
}

export async function fetchNoonAdvertisingDashboard(query: NoonAdvertisingDashboardQuery) {
  const response = await apiFetch(`/api/noon-ads/dashboard?${buildNoonAdvertisingDashboardParams(query).toString()}`)
  if (!response.ok) {
    throw new NoonAdvertisingApiError(response.status, await readApiErrorMessage(response, `广告数据加载失败：${response.status}`))
  }
  return (await response.json()) as NoonAdvertisingDashboardView
}

export async function fetchNoonAdvertisingLatestReportWindow(query: NoonAdvertisingLatestReportWindowQuery) {
  const response = await apiFetch(`/api/noon-ads/report-windows/latest?${buildNoonAdvertisingLatestReportWindowParams(query).toString()}`)
  if (!response.ok) {
    throw new NoonAdvertisingApiError(response.status, await readApiErrorMessage(response, `广告报表窗口加载失败：${response.status}`))
  }
  return (await response.json()) as NoonAdvertisingLatestReportWindow
}
