import { apiFetch, parseApiResponse } from '../../../shared/api'

import type {
  Ali1688ExcelImportBatch,
  Ali1688ExcelImportBatchDetail,
  Ali1688ExcelImportCommitResult,
  Ali1688ExcelImportPreview,
  Ali1688ExcelImportPreviewRequest,
  Ali1688ExcelImportSource,
  Ali1688ExcelImportSourceCreateRequest,
  Ali1688HistoricalOrderQuery
} from '../types'

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
  return apiFetch(url).then((response) =>
    parseApiResponse<Ali1688ExcelImportSource[]>(response, '初始化 Excel 导入失败')
  )
}

export function createAli1688ExcelImportSource(
  body: Ali1688ExcelImportSourceCreateRequest
): Promise<Ali1688ExcelImportSource> {
  return apiFetch('/api/procurement/ali1688-orders/excel-imports/sources', {
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
  return apiFetch(url).then((response) =>
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
  return apiFetch(url).then((response) =>
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
  return apiFetch(`/api/procurement/ali1688-orders/excel-imports/preview?${searchParams.toString()}`, {
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
  return apiFetch(`/api/procurement/ali1688-orders/excel-imports/${batchId}/commit?${searchParams.toString()}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: '{}'
  }).then((response) =>
    parseApiResponse<Ali1688ExcelImportCommitResult>(response, '确认导入 1688 Excel 失败')
  )
}
