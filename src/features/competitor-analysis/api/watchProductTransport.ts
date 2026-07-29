import { apiFetch, parseApiResponse } from '../../../shared/api'
import type { CompetitorProductOption } from '../types'
import type {
  BackendDetailResponse,
  BackendListResponse,
  BackendProductOption,
  BackendRankHistoryResponse
} from './backendContracts'
import type {
  CompetitorProductOptionQuery,
  CompetitorWatchProductCreateInput,
  CompetitorWatchProductQuery
} from './contracts'
import {
  mapDetail,
  mapListItem,
  mapProductOption,
  mapRankPoint
} from './watchProductMapper'
import { appendBooleanParam, appendSearchParam } from './transportValues'

export async function fetchCompetitorWatchProducts(query: CompetitorWatchProductQuery = {}, signal?: AbortSignal) {
  const params = new URLSearchParams()
  appendSearchParam(params, 'storeCode', query.storeCode)
  appendSearchParam(params, 'siteCode', query.siteCode)
  appendSearchParam(params, 'productSearch', query.productSearch)
  appendSearchParam(params, 'keywordSearch', query.keywordSearch)
  appendSearchParam(params, 'competitorSearch', query.competitorSearch)
  appendSearchParam(params, 'status', query.status?.toUpperCase())
  appendBooleanParam(params, 'confirmedCompetitorCountZero', query.confirmedCompetitorCountZero)
  appendBooleanParam(params, 'pendingCandidateCountZero', query.pendingCandidateCountZero)
  appendSearchParam(params, 'sortBy', query.sortBy)
  if (query.page) {
    params.set('page', String(query.page))
  }
  if (query.pageSize) {
    params.set('pageSize', String(query.pageSize))
  }
  const suffix = params.toString() ? `?${params.toString()}` : ''
  const response = await apiFetch(`/api/competitor-analysis/watch-products${suffix}`, { signal })
  const payload = await parseApiResponse<BackendListResponse>(response, '读取竞品监控列表失败')
  return {
    items: (payload.items || []).map(mapListItem),
    pagination: payload.pagination
  }
}

export async function fetchCompetitorProductBaselines(query: CompetitorWatchProductQuery = {}, signal?: AbortSignal) {
  const params = new URLSearchParams()
  appendSearchParam(params, 'storeCode', query.storeCode)
  appendSearchParam(params, 'siteCode', query.siteCode)
  appendSearchParam(params, 'productSearch', query.productSearch)
  appendSearchParam(params, 'keywordSearch', query.keywordSearch)
  appendSearchParam(params, 'competitorSearch', query.competitorSearch)
  appendSearchParam(params, 'status', query.status?.toUpperCase())
  appendBooleanParam(params, 'confirmedCompetitorCountZero', query.confirmedCompetitorCountZero)
  appendBooleanParam(params, 'pendingCandidateCountZero', query.pendingCandidateCountZero)
  appendSearchParam(params, 'sortBy', query.sortBy)
  if (query.page) {
    params.set('page', String(query.page))
  }
  if (query.pageSize) {
    params.set('pageSize', String(query.pageSize))
  }
  const response = await apiFetch(`/api/competitor-analysis/product-baselines?${params}`, { signal })
  const payload = await parseApiResponse<BackendListResponse>(response, '读取商品基线列表失败')
  return {
    items: (payload.items || []).map(mapListItem),
    pagination: payload.pagination
  }
}

export async function fetchCompetitorWatchProductDetail(watchProductId: string, signal?: AbortSignal) {
  const response = await apiFetch(`/api/competitor-analysis/watch-products/${watchProductId}`, { signal })
  return mapDetail(await parseApiResponse<BackendDetailResponse>(response, '读取竞品监控详情失败'))
}

export async function fetchCompetitorProductOptions(query: CompetitorProductOptionQuery, signal?: AbortSignal) {
  const params = new URLSearchParams({
    storeCode: query.storeCode,
    siteCode: query.siteCode
  })
  appendSearchParam(params, 'keyword', query.keyword)
  if (query.limit) {
    params.set('limit', String(query.limit))
  }
  const response = await apiFetch(`/api/competitor-analysis/product-options?${params}`, { signal })
  const payload = await parseApiResponse<BackendProductOption[]>(response, '读取可监控商品失败')
  return payload.map(mapProductOption).filter((item): item is CompetitorProductOption => Boolean(item.productSiteOfferId || item.partnerSku))
}

export async function createCompetitorWatchProduct(input: CompetitorWatchProductCreateInput) {
  const response = await apiFetch('/api/competitor-analysis/watch-products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  })
  return mapDetail(await parseApiResponse<BackendDetailResponse>(response, '新增监控商品失败'))
}

export async function addCompetitorKeyword(watchProductId: string, keyword: string, locale?: string) {
  const response = await apiFetch(`/api/competitor-analysis/watch-products/${watchProductId}/keywords`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ keyword, locale })
  })
  return mapDetail(await parseApiResponse<BackendDetailResponse>(response, '新增关键词失败'))
}

export async function updateCompetitorKeyword(
  keywordId: string,
  input: { keyword?: string; locale?: string; status?: 'active' | 'paused'; displayOrder?: number }
) {
  const response = await apiFetch(`/api/competitor-analysis/keywords/${keywordId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...input,
      status: input.status?.toUpperCase()
    })
  })
  return mapDetail(await parseApiResponse<BackendDetailResponse>(response, '更新关键词失败'))
}

export async function deleteCompetitorKeyword(keywordId: string) {
  const response = await apiFetch(`/api/competitor-analysis/keywords/${keywordId}`, {
    method: 'DELETE'
  })
  return mapDetail(await parseApiResponse<BackendDetailResponse>(response, '删除关键词失败'))
}

export async function addManualCompetitor(watchProductId: string, input: string, keywordId: string) {
  const response = await apiFetch(`/api/competitor-analysis/watch-products/${watchProductId}/manual-competitors`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input, keywordId })
  })
  return mapDetail(await parseApiResponse<BackendDetailResponse>(response, '手工添加竞品失败'))
}

export async function confirmCompetitorCandidate(keywordId: string, competitorProductId: string) {
  const response = await apiFetch(
    `/api/competitor-analysis/keywords/${keywordId}/candidates/${competitorProductId}/confirm`,
    { method: 'POST' }
  )
  return mapDetail(await parseApiResponse<BackendDetailResponse>(response, '确认竞品失败'))
}

export async function ignoreCompetitorCandidate(keywordId: string, competitorProductId: string) {
  const response = await apiFetch(
    `/api/competitor-analysis/keywords/${keywordId}/candidates/${competitorProductId}/ignore`,
    { method: 'POST' }
  )
  return mapDetail(await parseApiResponse<BackendDetailResponse>(response, '忽略竞品失败'))
}

export async function removeCompetitorCandidate(keywordId: string, competitorProductId: string) {
  const response = await apiFetch(
    `/api/competitor-analysis/keywords/${keywordId}/candidates/${competitorProductId}/remove`,
    { method: 'POST' }
  )
  return mapDetail(await parseApiResponse<BackendDetailResponse>(response, '移除竞品失败'))
}

export async function fetchCompetitorRankHistory(
  watchProductId: string,
  query: { keywordId: string; rangeDays: number },
  signal?: AbortSignal
) {
  const params = new URLSearchParams({
    keywordId: query.keywordId,
    rangeDays: String(query.rangeDays)
  })
  const response = await apiFetch(`/api/competitor-analysis/watch-products/${watchProductId}/rank-history?${params}`, {
    signal
  })
  const payload = await parseApiResponse<BackendRankHistoryResponse>(response, '读取排名历史失败')
  const rows = Array.isArray(payload) ? payload : payload.items || []
  return rows.map(mapRankPoint)
}
