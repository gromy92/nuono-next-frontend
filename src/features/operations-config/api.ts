import type {
  OperationCalendarRule,
  OperationCalendarRuleBatchUpdateInput,
  OperationCalendarRuleCopyPreviousYearInput,
  OperationCalendarRuleDraftInput,
  OperationCalendarRuleScopeQuery,
  OperationConfigDefaultVersionItem,
  OperationConfigVersionDetail,
  OperationConfigVersionRow,
  OperationConfigBundleVersion,
  OperationConfigCurrentBundleView,
  OperationConfigBundleScopeStore,
  OperationConfigProductDimensionOptionsView,
  OperationConfigScopeView,
  OperationConfigDefaultVersion,
  OperationLifecycleRule,
  OperationLifecycleRuleDraftInput,
  OperationLifecycleRuleStateView,
  OperationLifecycleRecalculationInput,
  OperationLifecycleRecalculationJob
} from './types'

export class OperationsConfigApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'OperationsConfigApiError'
    this.status = status
  }
}

export async function fetchOperationConfigScope(bossUserIds: number[] = []) {
  const params = new URLSearchParams()
  bossUserIds.forEach((bossUserId) => params.append('bossUserIds', String(bossUserId)))
  const query = params.toString()
  const response = await fetch(`/api/operations-config/scope${query ? `?${query}` : ''}`)
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    const message =
      payload && typeof payload.message === 'string' && payload.message
        ? payload.message
        : `运营配置范围读取失败：${response.status}`
    throw new OperationsConfigApiError(response.status, message)
  }
  return payload as OperationConfigScopeView
}

export async function fetchOperationConfigBundleVersions() {
  const response = await fetch('/api/operations-config/bundles/versions')
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    const message =
      payload && typeof payload.message === 'string' && payload.message
        ? payload.message
        : `运营配置版本读取失败：${response.status}`
    throw new OperationsConfigApiError(response.status, message)
  }
  return payload as OperationConfigBundleVersion[]
}

export async function fetchOperationConfigVersions() {
  const response = await fetch('/api/operations-config/versions')
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    const message =
      payload && typeof payload.message === 'string' && payload.message
        ? payload.message
        : `运营配置版本读取失败：${response.status}`
    throw new OperationsConfigApiError(response.status, message)
  }
  return payload as OperationConfigVersionRow[]
}

export async function fetchOperationConfigVersionDetail(versionNo: string) {
  const response = await fetch(`/api/operations-config/versions/${encodeURIComponent(versionNo)}`)
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    const message =
      payload && typeof payload.message === 'string' && payload.message
        ? payload.message
        : `运营配置版本详情读取失败：${response.status}`
    throw new OperationsConfigApiError(response.status, message)
  }
  return payload as OperationConfigVersionDetail
}

export async function copyOperationConfigVersion(versionNo: string) {
  const response = await fetch(`/api/operations-config/versions/${encodeURIComponent(versionNo)}/copies`, {
    method: 'POST'
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    const message =
      payload && typeof payload.message === 'string' && payload.message
        ? payload.message
        : `运营配置版本复制失败：${response.status}`
    throw new OperationsConfigApiError(response.status, message)
  }
  return payload as OperationConfigVersionRow
}

export async function updateOperationConfigVersion(
  versionNo: string,
  input: {
    configType: string
    displayName?: string | null
    summary?: string | null
    items: OperationConfigDefaultVersionItem[]
  }
) {
  const response = await fetch(`/api/operations-config/versions/${encodeURIComponent(versionNo)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    const message =
      payload && typeof payload.message === 'string' && payload.message
        ? payload.message
        : `运营配置版本保存失败：${response.status}`
    throw new OperationsConfigApiError(response.status, message)
  }
  return payload as OperationConfigVersionDetail
}

export async function deleteOperationConfigVersion(versionNo: string) {
  const response = await fetch(`/api/operations-config/versions/${encodeURIComponent(versionNo)}`, {
    method: 'DELETE'
  })
  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    const message =
      payload && typeof payload.message === 'string' && payload.message
        ? payload.message
        : `运营配置版本删除失败：${response.status}`
    throw new OperationsConfigApiError(response.status, message)
  }
}

export async function publishOperationConfigVersion(
  versionNo: string,
  input: { ownerUserId?: number | null; storeCode?: string | null; siteCode?: string | null; message?: string | null } = {}
) {
  const response = await fetch(`/api/operations-config/versions/${encodeURIComponent(versionNo)}/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    const message =
      payload && typeof payload.message === 'string' && payload.message
        ? payload.message
        : `运营配置版本发布失败：${response.status}`
    throw new OperationsConfigApiError(response.status, message)
  }
  return payload as OperationConfigVersionDetail
}

export async function disableOperationConfigVersion(versionNo: string, input: { reason?: string | null } = {}) {
  const response = await fetch(`/api/operations-config/versions/${encodeURIComponent(versionNo)}/disable`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    const message =
      payload && typeof payload.message === 'string' && payload.message
        ? payload.message
        : `运营配置版本停用失败：${response.status}`
    throw new OperationsConfigApiError(response.status, message)
  }
  return payload as OperationConfigVersionDetail
}

export async function fetchOperationConfigDefaultVersions() {
  const response = await fetch('/api/operations-config/bundles/default-versions')
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    const message =
      payload && typeof payload.message === 'string' && payload.message
        ? payload.message
        : `运营配置默认版本读取失败：${response.status}`
    throw new OperationsConfigApiError(response.status, message)
  }
  return payload as OperationConfigDefaultVersion[]
}

export async function createOperationConfigBundleDraft(input: { displayName?: string | null }) {
  const response = await fetch('/api/operations-config/bundles/drafts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    const message =
      payload && typeof payload.message === 'string' && payload.message
        ? payload.message
        : `运营配置草稿创建失败：${response.status}`
    throw new OperationsConfigApiError(response.status, message)
  }
  return payload as OperationConfigBundleVersion
}

export async function updateOperationConfigBundleScope(
  bundleId: number,
  input: { bossUserIds?: number[]; stores: OperationConfigBundleScopeStore[] }
) {
  const response = await fetch(`/api/operations-config/bundles/${bundleId}/scope`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    const message =
      payload && typeof payload.message === 'string' && payload.message
        ? payload.message
        : `运营配置版本作用店铺保存失败：${response.status}`
    throw new OperationsConfigApiError(response.status, message)
  }
  return payload as OperationConfigBundleVersion
}

export async function publishOperationConfigBundleVersion(
  bundleId: number,
  input: { message?: string | null } = {}
) {
  const response = await fetch(`/api/operations-config/bundles/${bundleId}/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    const message =
      payload && typeof payload.message === 'string' && payload.message
        ? payload.message
        : `运营配置版本发布失败：${response.status}`
    throw new OperationsConfigApiError(response.status, message)
  }
  return payload as OperationConfigBundleVersion
}

export async function fetchCurrentOperationConfigBundle(query: OperationCalendarRuleScopeQuery) {
  const params = new URLSearchParams({
    ownerUserId: String(query.ownerUserId),
    storeCode: query.storeCode,
    siteCode: query.siteCode
  })
  const response = await fetch(`/api/operations-config/bundles/current?${params.toString()}`)
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    const message =
      payload && typeof payload.message === 'string' && payload.message
        ? payload.message
        : `当前运营配置版本读取失败：${response.status}`
    throw new OperationsConfigApiError(response.status, message)
  }
  return payload as OperationConfigCurrentBundleView
}

export async function copyOperationConfigBundleVersion(bundleId: number) {
  const response = await fetch(`/api/operations-config/bundles/${bundleId}/copies`, {
    method: 'POST'
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    const message =
      payload && typeof payload.message === 'string' && payload.message
        ? payload.message
        : `运营配置版本复制失败：${response.status}`
    throw new OperationsConfigApiError(response.status, message)
  }
  return payload as OperationConfigBundleVersion
}

export async function deleteOperationConfigBundleVersion(bundleId: number) {
  const response = await fetch(`/api/operations-config/bundles/${bundleId}`, {
    method: 'DELETE'
  })
  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    const message =
      payload && typeof payload.message === 'string' && payload.message
        ? payload.message
        : `运营配置版本删除失败：${response.status}`
    throw new OperationsConfigApiError(response.status, message)
  }
}

function calendarRuleScopeParams(query: OperationCalendarRuleScopeQuery) {
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

async function postCalendarRuleAction(path: string, body: unknown) {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    const message =
      payload && typeof payload.message === 'string' && payload.message
        ? payload.message
        : `业务日历操作失败：${response.status}`
    throw new OperationsConfigApiError(response.status, message)
  }
  return payload as OperationCalendarRule[]
}

export async function fetchActiveOperationCalendarRules(query: OperationCalendarRuleScopeQuery) {
  const params = calendarRuleScopeParams(query)
  const response = await fetch(`/api/operations-config/calendar-rules/active?${params.toString()}`)
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    const message =
      payload && typeof payload.message === 'string' && payload.message
        ? payload.message
        : `业务日历读取失败：${response.status}`
    throw new OperationsConfigApiError(response.status, message)
  }
  return payload as OperationCalendarRule[]
}

export async function fetchOperationCalendarRuleHistory(query: OperationCalendarRuleScopeQuery) {
  const params = calendarRuleScopeParams(query)
  const response = await fetch(`/api/operations-config/calendar-rules/history?${params.toString()}`)
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    const message =
      payload && typeof payload.message === 'string' && payload.message
        ? payload.message
        : `业务日历历史读取失败：${response.status}`
    throw new OperationsConfigApiError(response.status, message)
  }
  return payload as OperationCalendarRule[]
}

export function copyPreviousYearOperationCalendarRules(input: OperationCalendarRuleCopyPreviousYearInput) {
  return postCalendarRuleAction('/api/operations-config/calendar-rules/copy-previous-year', input)
}

export async function saveOperationCalendarRuleDraft(input: OperationCalendarRuleDraftInput) {
  const response = await fetch('/api/operations-config/calendar-rules/drafts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    const message =
      payload && typeof payload.message === 'string' && payload.message
        ? payload.message
        : `业务日历草稿保存失败：${response.status}`
    throw new OperationsConfigApiError(response.status, message)
  }
  return payload as OperationCalendarRule
}

export async function publishOperationCalendarRuleDraft(
  ruleId: number,
  input: Pick<OperationCalendarRuleScopeQuery, 'bossUserIds'> & { message?: string }
) {
  const response = await fetch(`/api/operations-config/calendar-rules/${ruleId}/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    const message =
      payload && typeof payload.message === 'string' && payload.message
        ? payload.message
        : `业务日历版本发布失败：${response.status}`
    throw new OperationsConfigApiError(response.status, message)
  }
  return payload as OperationCalendarRule
}

export async function disableOperationCalendarRule(
  ruleId: number,
  input: Pick<OperationCalendarRuleScopeQuery, 'bossUserIds'> & { message?: string }
) {
  const response = await fetch(`/api/operations-config/calendar-rules/${ruleId}/disable`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    const message =
      payload && typeof payload.message === 'string' && payload.message
        ? payload.message
        : `业务日历规则停用失败：${response.status}`
    throw new OperationsConfigApiError(response.status, message)
  }
  return payload as OperationCalendarRule
}

export function batchUpdateOperationCalendarRules(input: OperationCalendarRuleBatchUpdateInput) {
  return postCalendarRuleAction('/api/operations-config/calendar-rules/batch', input)
}

export async function fetchOperationConfigProductDimensionOptions(
  query: OperationCalendarRuleScopeQuery & {
    brandQuery?: string
    fulltypeQuery?: string
    limit?: number
  }
) {
  const params = calendarRuleScopeParams(query)
  if (query.brandQuery) {
    params.set('brandQuery', query.brandQuery)
  }
  if (query.fulltypeQuery) {
    params.set('fulltypeQuery', query.fulltypeQuery)
  }
  if (query.limit) {
    params.set('limit', String(query.limit))
  }
  const response = await fetch(`/api/operations-config/product-dimensions/options?${params.toString()}`)
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    const message =
      payload && typeof payload.message === 'string' && payload.message
        ? payload.message
        : `商品维度选项读取失败：${response.status}`
    throw new OperationsConfigApiError(response.status, message)
  }
  return payload as OperationConfigProductDimensionOptionsView
}

async function lifecycleRuleScopeParams(query: OperationCalendarRuleScopeQuery) {
  return calendarRuleScopeParams(query)
}

async function readLifecyclePayload<T>(response: Response, fallbackMessage: string) {
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    const message =
      payload && typeof payload.message === 'string' && payload.message
        ? payload.message
        : `${fallbackMessage}：${response.status}`
    throw new OperationsConfigApiError(response.status, message)
  }
  return payload as T
}

export async function fetchOperationLifecycleRuleState(query: OperationCalendarRuleScopeQuery) {
  const params = await lifecycleRuleScopeParams(query)
  const response = await fetch(`/api/operations-config/lifecycle-rules/state?${params.toString()}`)
  return readLifecyclePayload<OperationLifecycleRuleStateView>(response, '生命周期规则读取失败')
}

export async function createOperationLifecycleRuleDraftFromCurrent(query: OperationCalendarRuleScopeQuery) {
  const response = await fetch('/api/operations-config/lifecycle-rules/drafts/from-current', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(query)
  })
  return readLifecyclePayload<OperationLifecycleRule>(response, '生命周期规则草稿创建失败')
}

export async function saveOperationLifecycleRuleDraft(input: OperationLifecycleRuleDraftInput) {
  const response = await fetch('/api/operations-config/lifecycle-rules/drafts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  })
  return readLifecyclePayload<OperationLifecycleRule>(response, '生命周期规则草稿保存失败')
}

export async function publishOperationLifecycleRuleDraft(
  ruleId: number,
  input: Pick<OperationCalendarRuleScopeQuery, 'bossUserIds'> & { message?: string }
) {
  const response = await fetch(`/api/operations-config/lifecycle-rules/${ruleId}/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  })
  return readLifecyclePayload<OperationLifecycleRule>(response, '生命周期规则发布失败')
}

export async function recalculateOperationLifecycle(input: OperationLifecycleRecalculationInput) {
  const response = await fetch('/api/operations-config/lifecycle-rules/recalculate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  })
  return readLifecyclePayload<OperationLifecycleRecalculationJob>(response, '生命周期重算失败')
}
