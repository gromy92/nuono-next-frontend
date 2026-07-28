import { apiFetch, parseApiResponse } from '../../../shared/api'

import type {
  Ali1688SkuPurchaseBatchSaveRequest,
  Ali1688SkuPurchaseBatchSaveResult,
  Ali1688SkuPurchaseBatchSourceMatchPreviewRequest,
  Ali1688SkuPurchaseBatchSourceMatchPreviewResult,
  Ali1688SkuPurchaseBatchSourceMatchSaveRequest,
  Ali1688SkuPurchaseBatchSourceMatchSaveResult,
  Ali1688SkuPurchaseHistoryQuery,
  Ali1688SkuPurchaseHistoryView
} from '../types'

export function loadAli1688SkuPurchaseHistory(
  query?: Ali1688SkuPurchaseHistoryQuery
): Promise<Ali1688SkuPurchaseHistoryView> {
  const searchParams = new URLSearchParams()
  Object.entries(query || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim()) {
      searchParams.set(key, String(value))
    }
  })
  const queryString = searchParams.toString()
  const url = `/api/procurement/ali1688-orders/sku-purchase-history${queryString ? `?${queryString}` : ''}`
  return apiFetch(url).then((response) =>
    parseApiResponse<Ali1688SkuPurchaseHistoryView>(response, '读取 SKU 采购历史失败')
  )
}

export function saveAli1688SkuPurchaseBatches(
  request: Ali1688SkuPurchaseBatchSaveRequest
): Promise<Ali1688SkuPurchaseBatchSaveResult> {
  return apiFetch('/api/procurement/ali1688-orders/sku-purchase-history/batches', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  }).then((response) =>
    parseApiResponse<Ali1688SkuPurchaseBatchSaveResult>(response, '保存 SKU 采购批次失败')
  )
}

export function previewAli1688SkuPurchaseBatchSourceMatch(
  request: Ali1688SkuPurchaseBatchSourceMatchPreviewRequest
): Promise<Ali1688SkuPurchaseBatchSourceMatchPreviewResult> {
  return apiFetch('/api/procurement/ali1688-orders/sku-purchase-history/batches/source-match/preview', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  }).then((response) =>
    parseApiResponse<Ali1688SkuPurchaseBatchSourceMatchPreviewResult>(response, '匹配 1688 来源失败')
  )
}

export function saveAli1688SkuPurchaseBatchSourceMatch(
  request: Ali1688SkuPurchaseBatchSourceMatchSaveRequest
): Promise<Ali1688SkuPurchaseBatchSourceMatchSaveResult> {
  return apiFetch('/api/procurement/ali1688-orders/sku-purchase-history/batches/source-match', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  }).then((response) =>
    parseApiResponse<Ali1688SkuPurchaseBatchSourceMatchSaveResult>(response, '保存 1688 来源失败')
  )
}
