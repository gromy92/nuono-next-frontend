import { parseApiResponse } from '../../shared/api'
import type {
  Ali1688ExcelImportBatch,
  Ali1688ExcelImportBatchDetail,
  Ali1688ExcelImportCommitResult,
  Ali1688ExcelImportPreview,
  Ali1688ExcelImportPreviewRequest,
  Ali1688HistoricalOrderAssignmentRequest,
  Ali1688HistoricalOrderAssignmentResult,
  Ali1688ExcelImportSource,
  Ali1688ExcelImportSourceCreateRequest,
  Ali1688HistoricalOrderAssignmentAdjustRequest,
  Ali1688HistoricalOrderAssignmentRecord,
  Ali1688HistoricalOrderDetail,
  Ali1688HistoricalOrderDeleteRequest,
  Ali1688HistoricalOrderDeleteResult,
  Ali1688HistoricalOrderProductLinkAudit,
  Ali1688HistoricalOrderProductLinkCandidate,
  Ali1688HistoricalOrderProductLinkRequest,
  Ali1688HistoricalOrderProductLinkResult,
  Ali1688HistoricalOrderQuery,
  Ali1688HistoricalOrderWorkbench,
  Ali1688SkuPurchaseHistoryQuery,
  Ali1688SkuPurchaseHistoryView
} from './types'

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
  return fetch(url).then((response) =>
    parseApiResponse<Ali1688HistoricalOrderWorkbench>(response, '读取 1688 历史订单失败')
  )
}

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
  return fetch(url).then((response) =>
    parseApiResponse<Ali1688SkuPurchaseHistoryView>(response, '读取 SKU 采购历史失败')
  )
}

export function createDevAli1688HistoricalOrderAuthorization(): Promise<Ali1688HistoricalOrderWorkbench> {
  return fetch('/api/procurement/ali1688-orders/authorizations/dev', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: '{}'
  }).then((response) =>
    parseApiResponse<Ali1688HistoricalOrderWorkbench>(response, '授权 1688 历史订单失败')
  )
}

export function loadAli1688ExcelImportSources(
  query?: Pick<Ali1688HistoricalOrderQuery, 'storeCode' | 'siteCode'>
): Promise<Ali1688ExcelImportSource[]> {
  const searchParams = new URLSearchParams()
  Object.entries(query || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim()) {
      searchParams.set(key, String(value))
    }
  })
  const queryString = searchParams.toString()
  const url = `/api/procurement/ali1688-orders/excel-imports/sources${queryString ? `?${queryString}` : ''}`
  return fetch(url).then((response) =>
    parseApiResponse<Ali1688ExcelImportSource[]>(response, '初始化 Excel 导入失败')
  )
}

export function createAli1688ExcelImportSource(
  body: Ali1688ExcelImportSourceCreateRequest
): Promise<Ali1688ExcelImportSource> {
  return fetch('/api/procurement/ali1688-orders/excel-imports/sources', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  }).then((response) =>
    parseApiResponse<Ali1688ExcelImportSource>(response, '初始化 Excel 导入失败')
  )
}

export function loadAli1688ExcelImportBatches(
  query?: Pick<Ali1688HistoricalOrderQuery, 'storeCode' | 'siteCode'>
): Promise<Ali1688ExcelImportBatch[]> {
  const searchParams = new URLSearchParams()
  Object.entries(query || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim()) {
      searchParams.set(key, String(value))
    }
  })
  const queryString = searchParams.toString()
  const url = `/api/procurement/ali1688-orders/excel-imports${queryString ? `?${queryString}` : ''}`
  return fetch(url).then((response) =>
    parseApiResponse<Ali1688ExcelImportBatch[]>(response, '读取 1688 Excel 导入历史失败')
  )
}

export function loadAli1688ExcelImportBatchDetail(
  batchId: number,
  query?: Pick<Ali1688HistoricalOrderQuery, 'storeCode' | 'siteCode'>
): Promise<Ali1688ExcelImportBatchDetail> {
  const searchParams = new URLSearchParams()
  Object.entries(query || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim()) {
      searchParams.set(key, String(value))
    }
  })
  const queryString = searchParams.toString()
  const url = `/api/procurement/ali1688-orders/excel-imports/${batchId}${queryString ? `?${queryString}` : ''}`
  return fetch(url).then((response) =>
    parseApiResponse<Ali1688ExcelImportBatchDetail>(response, '读取 1688 Excel 导入详情失败')
  )
}

export function previewAli1688ExcelImport(
  request: Ali1688ExcelImportPreviewRequest
): Promise<Ali1688ExcelImportPreview> {
  const searchParams = new URLSearchParams()
  searchParams.set('authorizationId', String(request.authorizationId))
  if (request.storeCode?.trim()) {
    searchParams.set('storeCode', request.storeCode)
  }
  if (request.siteCode?.trim()) {
    searchParams.set('siteCode', request.siteCode)
  }
  const formData = new FormData()
  formData.append('file', request.file)
  return fetch(`/api/procurement/ali1688-orders/excel-imports/preview?${searchParams.toString()}`, {
    method: 'POST',
    body: formData
  }).then((response) =>
    parseApiResponse<Ali1688ExcelImportPreview>(response, '预览 1688 Excel 导入失败')
  )
}

export function commitAli1688ExcelImport(
  batchId: number,
  query?: Pick<Ali1688HistoricalOrderQuery, 'storeCode' | 'siteCode'>
): Promise<Ali1688ExcelImportCommitResult> {
  const searchParams = new URLSearchParams()
  if (query?.storeCode?.trim()) {
    searchParams.set('storeCode', query.storeCode)
  }
  if (query?.siteCode?.trim()) {
    searchParams.set('siteCode', query.siteCode)
  }
  return fetch(`/api/procurement/ali1688-orders/excel-imports/${batchId}/commit?${searchParams.toString()}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: '{}'
  }).then((response) =>
    parseApiResponse<Ali1688ExcelImportCommitResult>(response, '确认导入 1688 Excel 失败')
  )
}

export function runInitialAli1688HistoricalOrderSync(): Promise<Ali1688HistoricalOrderWorkbench> {
  return fetch('/api/procurement/ali1688-orders/sync-tasks/initial-backfill', {
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
  return fetch('/api/procurement/ali1688-orders/sync-tasks/manual-refresh', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: '{}'
  }).then((response) =>
    parseApiResponse<Ali1688HistoricalOrderWorkbench>(response, '刷新 1688 历史订单失败')
  )
}

export function assignAli1688HistoricalOrderLines(
  request: Ali1688HistoricalOrderAssignmentRequest
): Promise<Ali1688HistoricalOrderAssignmentResult> {
  return fetch('/api/procurement/ali1688-orders/assignments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  }).then((response) =>
    parseApiResponse<Ali1688HistoricalOrderAssignmentResult>(response, '分配 1688 历史订单货品失败')
  )
}

export function loadAli1688HistoricalOrderItemAssignments(
  itemId: string
): Promise<Ali1688HistoricalOrderAssignmentRecord[]> {
  return fetch(`/api/procurement/ali1688-orders/items/${encodeURIComponent(itemId)}/assignments`).then((response) =>
    parseApiResponse<Ali1688HistoricalOrderAssignmentRecord[]>(response, '读取 1688 分配记录失败')
  )
}

export function adjustAli1688HistoricalOrderAssignment(
  assignmentId: number,
  request: Ali1688HistoricalOrderAssignmentAdjustRequest
): Promise<Ali1688HistoricalOrderAssignmentResult> {
  return fetch(`/api/procurement/ali1688-orders/assignments/${encodeURIComponent(String(assignmentId))}/adjust`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  }).then((response) =>
    parseApiResponse<Ali1688HistoricalOrderAssignmentResult>(response, '调整 1688 分配记录失败')
  )
}

export function revokeAli1688HistoricalOrderAssignment(
  assignmentId: number
): Promise<Ali1688HistoricalOrderAssignmentResult> {
  return fetch(`/api/procurement/ali1688-orders/assignments/${encodeURIComponent(String(assignmentId))}/revoke`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: '{}'
  }).then((response) =>
    parseApiResponse<Ali1688HistoricalOrderAssignmentResult>(response, '撤回 1688 分配记录失败')
  )
}

export function linkAli1688HistoricalOrderProduct(
  request: Ali1688HistoricalOrderProductLinkRequest
): Promise<Ali1688HistoricalOrderProductLinkResult> {
  return fetch('/api/procurement/ali1688-orders/product-links', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  }).then((response) =>
    parseApiResponse<Ali1688HistoricalOrderProductLinkResult>(response, '关联商品失败')
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
  return fetch(`/api/procurement/ali1688-orders/product-link-candidates?${searchParams.toString()}`).then((response) =>
    parseApiResponse<Ali1688HistoricalOrderProductLinkCandidate[]>(response, '读取商品关联候选失败')
  )
}

export function unlinkAli1688HistoricalOrderProduct(
  assignmentId: number
): Promise<Ali1688HistoricalOrderProductLinkResult> {
  return fetch(`/api/procurement/ali1688-orders/product-links/${encodeURIComponent(String(assignmentId))}/unlink`, {
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
  return fetch(`/api/procurement/ali1688-orders/product-links/${encodeURIComponent(String(assignmentId))}/audits`).then((response) =>
    parseApiResponse<Ali1688HistoricalOrderProductLinkAudit[]>(response, '读取商品关联审计失败')
  )
}

export function deleteAli1688HistoricalOrder(
  orderId: string,
  request: Ali1688HistoricalOrderDeleteRequest
): Promise<Ali1688HistoricalOrderDeleteResult> {
  return fetch(`/api/procurement/ali1688-orders/${encodeURIComponent(orderId)}`, {
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
  return fetch(url).then((response) =>
    parseApiResponse<Ali1688HistoricalOrderDetail>(response, '读取 1688 历史订单详情失败')
  )
}
