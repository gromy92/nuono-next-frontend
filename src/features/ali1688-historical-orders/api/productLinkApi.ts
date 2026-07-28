import { apiFetch, parseApiResponse } from '../../../shared/api'

import type {
  Ali1688HistoricalOrderProductLinkAudit,
  Ali1688HistoricalOrderProductLinkBatchRequest,
  Ali1688HistoricalOrderProductLinkBatchResult,
  Ali1688HistoricalOrderProductLinkCandidate,
  Ali1688HistoricalOrderProductLinkRequest,
  Ali1688HistoricalOrderProductLinkResult
} from '../types'

export function linkAli1688HistoricalOrderProduct(
  request: Ali1688HistoricalOrderProductLinkRequest
): Promise<Ali1688HistoricalOrderProductLinkResult> {
  return apiFetch('/api/procurement/ali1688-orders/product-links', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  }).then((response) =>
    parseApiResponse<Ali1688HistoricalOrderProductLinkResult>(response, '关联商品失败')
  )
}

export function linkAli1688HistoricalOrderProductBatch(
  request: Ali1688HistoricalOrderProductLinkBatchRequest
): Promise<Ali1688HistoricalOrderProductLinkBatchResult> {
  return apiFetch('/api/procurement/ali1688-orders/product-links/batch', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  }).then((response) =>
    parseApiResponse<Ali1688HistoricalOrderProductLinkBatchResult>(response, '批量关联商品失败')
  )
}

export function loadAli1688HistoricalOrderProductLinkCandidates(query: {
  assignmentId: number
  linkStatus?: 'linked' | 'unlinked' | string
  keyword?: string
}): Promise<Ali1688HistoricalOrderProductLinkCandidate[]> {
  const searchParams = new URLSearchParams()
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim()) {
      searchParams.set(key, String(value))
    }
  })
  return apiFetch(`/api/procurement/ali1688-orders/product-link-candidates?${searchParams.toString()}`).then((response) =>
    parseApiResponse<Ali1688HistoricalOrderProductLinkCandidate[]>(response, '读取商品关联候选失败')
  )
}

export function unlinkAli1688HistoricalOrderProduct(
  assignmentId: number
): Promise<Ali1688HistoricalOrderProductLinkResult> {
  return apiFetch(`/api/procurement/ali1688-orders/product-links/${encodeURIComponent(String(assignmentId))}/unlink`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: '{}'
  }).then((response) =>
    parseApiResponse<Ali1688HistoricalOrderProductLinkResult>(response, '解除商品关联失败')
  )
}

export function loadAli1688HistoricalOrderProductLinkAudits(
  assignmentId: number
): Promise<Ali1688HistoricalOrderProductLinkAudit[]> {
  return apiFetch(`/api/procurement/ali1688-orders/product-links/${encodeURIComponent(String(assignmentId))}/audits`).then((response) =>
    parseApiResponse<Ali1688HistoricalOrderProductLinkAudit[]>(response, '读取商品关联审计失败')
  )
}
