import { ApiError, apiRequestJson, apiRequestNoContent, type ApiProblem } from '../../shared/api'
import type {
  OperationCalendarRuleScopeQuery,
  OperationConfigDefaultVersionItem,
  OperationConfigProductDimensionOptionsView,
  OperationConfigScopeView,
  OperationConfigVersionDetail,
  OperationConfigVersionRow
} from './types'

export class OperationsConfigApiError extends ApiError {
  constructor(status: number, message: string, problem?: ApiProblem) {
    super(status, message, problem)
    this.name = 'OperationsConfigApiError'
  }
}

async function requestJson<T>(path: string, failureLabel: string, init?: RequestInit) {
  try {
    return await apiRequestJson<T>(path, init, (status) => `${failureLabel}：${status}`)
  } catch (error) {
    if (error instanceof ApiError) {
      throw new OperationsConfigApiError(error.status, error.message, error.problem)
    }
    throw error
  }
}

async function requestNoContent(path: string, failureLabel: string, init?: RequestInit) {
  try {
    await apiRequestNoContent(path, init, (status) => `${failureLabel}：${status}`)
  } catch (error) {
    if (error instanceof ApiError) {
      throw new OperationsConfigApiError(error.status, error.message, error.problem)
    }
    throw error
  }
}

const JSON_HEADERS = { 'Content-Type': 'application/json' }

export function fetchOperationConfigScope(bossUserIds: number[] = []) {
  const params = new URLSearchParams()
  bossUserIds.forEach((bossUserId) => params.append('bossUserIds', String(bossUserId)))
  const query = params.toString()
  return requestJson<OperationConfigScopeView>(
    `/api/operations-config/scope${query ? `?${query}` : ''}`,
    '运营配置范围读取失败'
  )
}

export function fetchOperationConfigVersions() {
  return requestJson<OperationConfigVersionRow[]>(
    '/api/operations-config/versions',
    '运营配置版本读取失败'
  )
}

export function fetchOperationConfigVersionDetail(versionNo: string) {
  return requestJson<OperationConfigVersionDetail>(
    `/api/operations-config/versions/${encodeURIComponent(versionNo)}`,
    '运营配置版本详情读取失败'
  )
}

export function copyOperationConfigVersion(versionNo: string) {
  return requestJson<OperationConfigVersionRow>(
    `/api/operations-config/versions/${encodeURIComponent(versionNo)}/copies`,
    '运营配置版本复制失败',
    { method: 'POST' }
  )
}

export function updateOperationConfigVersion(
  versionNo: string,
  input: {
    configType: string
    displayName?: string | null
    summary?: string | null
    items: OperationConfigDefaultVersionItem[]
  }
) {
  return requestJson<OperationConfigVersionDetail>(
    `/api/operations-config/versions/${encodeURIComponent(versionNo)}`,
    '运营配置版本保存失败',
    { method: 'PUT', headers: JSON_HEADERS, body: JSON.stringify(input) }
  )
}

export function deleteOperationConfigVersion(versionNo: string) {
  return requestNoContent(
    `/api/operations-config/versions/${encodeURIComponent(versionNo)}`,
    '运营配置版本删除失败',
    { method: 'DELETE' }
  )
}

export function publishOperationConfigVersion(
  versionNo: string,
  input: { ownerUserId?: number | null; storeCode?: string | null; siteCode?: string | null; message?: string | null } = {}
) {
  return requestJson<OperationConfigVersionDetail>(
    `/api/operations-config/versions/${encodeURIComponent(versionNo)}/publish`,
    '运营配置版本发布失败',
    { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify(input) }
  )
}

export function disableOperationConfigVersion(versionNo: string, input: { reason?: string | null } = {}) {
  return requestJson<OperationConfigVersionDetail>(
    `/api/operations-config/versions/${encodeURIComponent(versionNo)}/disable`,
    '运营配置版本停用失败',
    { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify(input) }
  )
}

function productDimensionParams(query: OperationCalendarRuleScopeQuery) {
  const params = new URLSearchParams({
    ownerUserId: String(query.ownerUserId),
    storeCode: query.storeCode,
    siteCode: query.siteCode
  })
  if (query.bundleVersionId) {
    params.set('bundleVersionId', String(query.bundleVersionId))
  }
  ;(query.bossUserIds ?? []).forEach((bossUserId) => params.append('bossUserIds', String(bossUserId)))
  return params
}

export function fetchOperationConfigProductDimensionOptions(
  query: OperationCalendarRuleScopeQuery & {
    brandQuery?: string
    fulltypeQuery?: string
    limit?: number
  }
) {
  const params = productDimensionParams(query)
  if (query.brandQuery) {
    params.set('brandQuery', query.brandQuery)
  }
  if (query.fulltypeQuery) {
    params.set('fulltypeQuery', query.fulltypeQuery)
  }
  if (query.limit) {
    params.set('limit', String(query.limit))
  }
  return requestJson<OperationConfigProductDimensionOptionsView>(
    `/api/operations-config/product-dimensions/options?${params.toString()}`,
    '商品维度选项读取失败'
  )
}
