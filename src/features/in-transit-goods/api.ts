import type {
  InTransitBatch,
  InTransitBatchFreightCost,
  InTransitBatchFilters,
  InTransitBatchList,
  InTransitContract,
  InTransitForwarderFreightComparison,
  InTransitForwarder,
  InTransitForwarderAlias,
  InTransitFreightStatistics,
  InTransitGoodsLine,
  InTransitGoodsLineList,
  InTransitImportConfirm,
  InTransitImportPreview,
  InTransitLogisticsNode,
  InTransitLogisticsNodeList,
  InTransitSkuFreightCostHistory,
  SaveInTransitGoodsLineRequest,
  SaveInTransitForwarderAliasRequest,
  SaveInTransitLogisticsNodeRequest,
  SaveInTransitBatchRequest
} from './types'
import { apiFetch, readApiErrorMessage } from '../../shared/api'

async function readJson<TResponse>(response: Response): Promise<TResponse> {
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    const errorMessage =
      payload && typeof payload.message === 'string' && payload.message
        ? payload.message
        : `Request failed: ${response.status}`
    throw new Error(errorMessage)
  }
  return payload as TResponse
}

export async function fetchInTransitContract(): Promise<InTransitContract> {
  const response = await apiFetch('/api/in-transit-goods/contracts')
  return readJson<InTransitContract>(response)
}

export async function fetchInTransitForwarders(): Promise<InTransitForwarder[]> {
  const response = await apiFetch('/api/in-transit-goods/forwarders')
  return readJson<InTransitForwarder[]>(response)
}

export async function saveInTransitForwarderAlias(
  request: SaveInTransitForwarderAliasRequest
): Promise<InTransitForwarderAlias> {
  const response = await apiFetch('/api/in-transit-goods/forwarder-aliases', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  })
  return readJson<InTransitForwarderAlias>(response)
}

export async function fetchInTransitBatches(filters: InTransitBatchFilters = {}): Promise<InTransitBatchList> {
  const url = new URL('/api/in-transit-goods/batches', window.location.origin)
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      url.searchParams.set(key, String(value))
    }
  })
  const response = await apiFetch(url.pathname + url.search)
  return readJson<InTransitBatchList>(response)
}

export async function saveInTransitBatch(request: SaveInTransitBatchRequest): Promise<InTransitBatch> {
  const response = await apiFetch('/api/in-transit-goods/batches', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  })
  return readJson<InTransitBatch>(response)
}

export async function fetchInTransitGoodsLines(batchId: number): Promise<InTransitGoodsLineList> {
  const response = await apiFetch(`/api/in-transit-goods/batches/${batchId}/lines`)
  return readJson<InTransitGoodsLineList>(response)
}

export async function saveInTransitGoodsLine(
  batchId: number,
  request: SaveInTransitGoodsLineRequest
): Promise<InTransitGoodsLine> {
  const response = await apiFetch(`/api/in-transit-goods/batches/${batchId}/lines`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  })
  return readJson<InTransitGoodsLine>(response)
}

export async function deleteInTransitGoodsLine(batchId: number, lineId: number): Promise<InTransitGoodsLineList> {
  const response = await apiFetch(`/api/in-transit-goods/batches/${batchId}/lines/${lineId}`, {
    method: 'DELETE'
  })
  return readJson<InTransitGoodsLineList>(response)
}

export async function fetchInTransitLogisticsNodes(batchId: number): Promise<InTransitLogisticsNodeList> {
  const response = await apiFetch(`/api/in-transit-goods/batches/${batchId}/nodes`)
  return readJson<InTransitLogisticsNodeList>(response)
}

export async function saveInTransitLogisticsNode(
  batchId: number,
  request: SaveInTransitLogisticsNodeRequest
): Promise<InTransitLogisticsNode> {
  const response = await apiFetch(`/api/in-transit-goods/batches/${batchId}/nodes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  })
  return readJson<InTransitLogisticsNode>(response)
}

export async function deleteInTransitLogisticsNode(
  batchId: number,
  nodeId: number
): Promise<InTransitLogisticsNodeList> {
  const response = await apiFetch(`/api/in-transit-goods/batches/${batchId}/nodes/${nodeId}`, {
    method: 'DELETE'
  })
  return readJson<InTransitLogisticsNodeList>(response)
}

export async function fetchInTransitBatchFreightCosts(batchId: number): Promise<InTransitBatchFreightCost> {
  const response = await apiFetch(`/api/in-transit-goods/batches/${batchId}/freight-costs`)
  return readJson<InTransitBatchFreightCost>(response)
}

export async function fetchInTransitFreightStatistics(filters: {
  fromMonth?: string
  toMonth?: string
  standardForwarderId?: number
} = {}): Promise<InTransitFreightStatistics> {
  const url = new URL('/api/in-transit-goods/freight-costs/statistics', window.location.origin)
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      url.searchParams.set(key, String(value))
    }
  })
  const response = await apiFetch(url.pathname + url.search)
  return readJson<InTransitFreightStatistics>(response)
}

export async function fetchInTransitSkuFreightHistory(params: {
  psku: string
  targetSiteCode: string
  fromMonth?: string
  toMonth?: string
}): Promise<InTransitSkuFreightCostHistory> {
  const url = new URL('/api/in-transit-goods/freight-costs/sku-history', window.location.origin)
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      url.searchParams.set(key, String(value))
    }
  })
  const response = await apiFetch(url.pathname + url.search)
  return readJson<InTransitSkuFreightCostHistory>(response)
}

export async function fetchInTransitForwarderFreightComparison(params: {
  psku: string
  targetSiteCode: string
  transportMode?: string
  destinationCode?: string
}): Promise<InTransitForwarderFreightComparison> {
  const url = new URL('/api/in-transit-goods/freight-costs/forwarder-comparison', window.location.origin)
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      url.searchParams.set(key, String(value))
    }
  })
  const response = await apiFetch(url.pathname + url.search)
  return readJson<InTransitForwarderFreightComparison>(response)
}

export async function previewInTransitImport(file: File): Promise<InTransitImportPreview> {
  const formData = new FormData()
  formData.append('file', file)
  const response = await apiFetch('/api/in-transit-goods/import-preview', {
    method: 'POST',
    body: formData
  })
  return readJson<InTransitImportPreview>(response)
}

export async function confirmInTransitImport(importBatchId: number): Promise<InTransitImportConfirm> {
  const response = await apiFetch(`/api/in-transit-goods/imports/${importBatchId}/confirm`, {
    method: 'POST'
  })
  return readJson<InTransitImportConfirm>(response)
}

export async function downloadInTransitImportTemplate(): Promise<Blob> {
  const response = await apiFetch('/api/in-transit-goods/import-template')
  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response, '导入模板下载失败'))
  }
  return response.blob()
}
