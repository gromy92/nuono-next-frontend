import type {
  LogisticsQuoteDraftFromNoteRequest,
  LogisticsQuoteNotePreviewRequest,
  LogisticsQuoteNotePreviewResponse,
  LogisticsQuoteOperationPriceItemsResponse,
  LogisticsQuoteSourceBundleAnalysisSummaryUpdateRequest,
  LogisticsQuoteSourceBundleFileCreateRequest,
  LogisticsQuoteSourceBundleFileUpdateRequest,
  LogisticsQuoteSourceBundleNoteCreateRequest,
  LogisticsQuoteSourceBundleNoteUpdateRequest,
  LogisticsQuoteSourceBundleCreateRequest,
  LogisticsQuoteWorkbenchResponse
} from './types'
import { apiRequestJson } from '../../shared/api'

const requestFailed = (status: number) => `Request failed: ${status}`
const JSON_HEADERS = { 'Content-Type': 'application/json' }

function requestJson<TResponse>(input: RequestInfo | URL, init?: RequestInit) {
  return apiRequestJson<TResponse>(input, init, requestFailed)
}

export async function fetchLogisticsQuoteWorkbench(
  bundleId?: number,
  noteId?: number,
  fileId?: number
): Promise<LogisticsQuoteWorkbenchResponse> {
  const url = new URL('/api/logistics-quote/workbench', window.location.origin)
  if (typeof bundleId === 'number') {
    url.searchParams.set('bundleId', String(bundleId))
  }
  if (typeof noteId === 'number') {
    url.searchParams.set('noteId', String(noteId))
  }
  if (typeof fileId === 'number') {
    url.searchParams.set('fileId', String(fileId))
  }
  return requestJson<LogisticsQuoteWorkbenchResponse>(
    url.pathname + url.search
  )
}

export async function fetchLogisticsQuoteOperationPriceItems(params?: {
  transportMode?: string
  forwarderId?: number
  priceStatus?: string
}): Promise<LogisticsQuoteOperationPriceItemsResponse> {
  const url = new URL('/api/logistics-quote/operations/price-items', window.location.origin)
  if (params?.transportMode) {
    url.searchParams.set('transportMode', params.transportMode)
  }
  if (typeof params?.forwarderId === 'number') {
    url.searchParams.set('forwarderId', String(params.forwarderId))
  }
  if (params?.priceStatus) {
    url.searchParams.set('priceStatus', params.priceStatus)
  }
  return requestJson<LogisticsQuoteOperationPriceItemsResponse>(
    url.pathname + url.search
  )
}

export async function createLogisticsQuoteSourceBundle(
  request: LogisticsQuoteSourceBundleCreateRequest
): Promise<LogisticsQuoteWorkbenchResponse> {
  return requestJson<LogisticsQuoteWorkbenchResponse>(
    '/api/logistics-quote/source-bundles',
    {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(request)
    }
  )
}

export async function updateLogisticsQuoteSourceBundleNote(
  bundleId: number,
  request: LogisticsQuoteSourceBundleNoteUpdateRequest,
  selectedFileId?: number
): Promise<LogisticsQuoteWorkbenchResponse> {
  const url = new URL(`/api/logistics-quote/source-bundles/${bundleId}/notes`, window.location.origin)
  if (typeof selectedFileId === 'number') {
    url.searchParams.set('selectedFileId', String(selectedFileId))
  }
  return requestJson<LogisticsQuoteWorkbenchResponse>(
    url.pathname + url.search,
    {
      method: 'PUT',
      headers: JSON_HEADERS,
      body: JSON.stringify(request)
    }
  )
}

export async function appendLogisticsQuoteSourceBundleFile(
  bundleId: number,
  request: LogisticsQuoteSourceBundleFileCreateRequest,
  selectedNoteId?: number,
  selectedFileId?: number
): Promise<LogisticsQuoteWorkbenchResponse> {
  const url = new URL(`/api/logistics-quote/source-bundles/${bundleId}/files`, window.location.origin)
  if (typeof selectedNoteId === 'number') {
    url.searchParams.set('selectedNoteId', String(selectedNoteId))
  }
  if (typeof selectedFileId === 'number') {
    url.searchParams.set('selectedFileId', String(selectedFileId))
  }
  return requestJson<LogisticsQuoteWorkbenchResponse>(
    url.pathname + url.search,
    {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(request)
    }
  )
}

export async function archiveLogisticsQuoteSourceBundleFile(
  bundleId: number,
  file: File,
  selectedNoteId?: number,
  fileId?: number
): Promise<LogisticsQuoteWorkbenchResponse> {
  const url = new URL(`/api/logistics-quote/source-bundles/${bundleId}/files/archive`, window.location.origin)
  if (typeof selectedNoteId === 'number') {
    url.searchParams.set('selectedNoteId', String(selectedNoteId))
  }
  if (typeof fileId === 'number') {
    url.searchParams.set('fileId', String(fileId))
  }

  const formData = new FormData()
  formData.append('file', file)
  return requestJson<LogisticsQuoteWorkbenchResponse>(
    url.pathname + url.search,
    {
      method: 'POST',
      body: formData
    }
  )
}

export async function updateLogisticsQuoteSourceBundleFile(
  bundleId: number,
  request: LogisticsQuoteSourceBundleFileUpdateRequest,
  selectedNoteId?: number,
  selectedFileId?: number
): Promise<LogisticsQuoteWorkbenchResponse> {
  const url = new URL(`/api/logistics-quote/source-bundles/${bundleId}/files`, window.location.origin)
  if (typeof selectedNoteId === 'number') {
    url.searchParams.set('selectedNoteId', String(selectedNoteId))
  }
  if (typeof selectedFileId === 'number') {
    url.searchParams.set('selectedFileId', String(selectedFileId))
  }
  return requestJson<LogisticsQuoteWorkbenchResponse>(
    url.pathname + url.search,
    {
      method: 'PUT',
      headers: JSON_HEADERS,
      body: JSON.stringify(request)
    }
  )
}

export async function appendLogisticsQuoteSourceBundleNote(
  bundleId: number,
  request: LogisticsQuoteSourceBundleNoteCreateRequest,
  selectedFileId?: number
): Promise<LogisticsQuoteWorkbenchResponse> {
  const url = new URL(`/api/logistics-quote/source-bundles/${bundleId}/notes`, window.location.origin)
  if (typeof selectedFileId === 'number') {
    url.searchParams.set('selectedFileId', String(selectedFileId))
  }
  return requestJson<LogisticsQuoteWorkbenchResponse>(
    url.pathname + url.search,
    {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(request)
    }
  )
}

export async function saveLogisticsQuoteDraftFromNote(
  bundleId: number,
  request: LogisticsQuoteDraftFromNoteRequest,
  selectedFileId?: number
): Promise<LogisticsQuoteWorkbenchResponse> {
  const url = new URL(`/api/logistics-quote/source-bundles/${bundleId}/quote-draft-from-note`, window.location.origin)
  if (typeof selectedFileId === 'number') {
    url.searchParams.set('selectedFileId', String(selectedFileId))
  }
  return requestJson<LogisticsQuoteWorkbenchResponse>(
    url.pathname + url.search,
    {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(request)
    }
  )
}

export async function updateLogisticsQuoteSourceBundleAnalysisSummary(
  bundleId: number,
  request: LogisticsQuoteSourceBundleAnalysisSummaryUpdateRequest,
  selectedNoteId?: number,
  selectedFileId?: number
): Promise<LogisticsQuoteWorkbenchResponse> {
  const url = new URL(`/api/logistics-quote/source-bundles/${bundleId}/analysis-summary`, window.location.origin)
  if (typeof selectedNoteId === 'number') {
    url.searchParams.set('selectedNoteId', String(selectedNoteId))
  }
  if (typeof selectedFileId === 'number') {
    url.searchParams.set('selectedFileId', String(selectedFileId))
  }
  return requestJson<LogisticsQuoteWorkbenchResponse>(
    url.pathname + url.search,
    {
      method: 'PUT',
      headers: JSON_HEADERS,
      body: JSON.stringify(request)
    }
  )
}

export async function previewLogisticsQuoteNote(
  request: LogisticsQuoteNotePreviewRequest
): Promise<LogisticsQuoteNotePreviewResponse> {
  return requestJson<LogisticsQuoteNotePreviewResponse>(
    '/api/logistics-quote/note-preview',
    {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(request)
    }
  )
}
