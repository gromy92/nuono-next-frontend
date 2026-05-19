import type {
  LogisticsQuoteDraftFromNoteRequest,
  LogisticsQuoteNotePreviewRequest,
  LogisticsQuoteNotePreviewResponse,
  LogisticsQuoteOperationPriceAdjustmentRequest,
  LogisticsQuoteOperationPriceAdjustmentResponse,
  LogisticsQuoteOperationPriceItemsResponse,
  LogisticsQuoteSourceBundleAnalysisSummaryUpdateRequest,
  LogisticsQuoteSourceBundleFileCreateRequest,
  LogisticsQuoteSourceBundleFileUpdateRequest,
  LogisticsQuoteSourceBundleNoteCreateRequest,
  LogisticsQuoteSourceBundleNoteUpdateRequest,
  LogisticsQuoteSourceBundleCreateRequest,
  LogisticsQuoteWorkbenchResponse
} from './types'

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
  const response = await fetch(url.pathname + url.search)
  return readJson<LogisticsQuoteWorkbenchResponse>(response)
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
  const response = await fetch(url.pathname + url.search)
  return readJson<LogisticsQuoteOperationPriceItemsResponse>(response)
}

export async function saveLogisticsQuoteOperationPriceAdjustment(
  request: LogisticsQuoteOperationPriceAdjustmentRequest
): Promise<LogisticsQuoteOperationPriceAdjustmentResponse> {
  const response = await fetch('/api/logistics-quote/operations/price-adjustments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  })
  return readJson<LogisticsQuoteOperationPriceAdjustmentResponse>(response)
}

export async function createLogisticsQuoteSourceBundle(
  request: LogisticsQuoteSourceBundleCreateRequest
): Promise<LogisticsQuoteWorkbenchResponse> {
  const response = await fetch('/api/logistics-quote/source-bundles', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  })
  return readJson<LogisticsQuoteWorkbenchResponse>(response)
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
  const response = await fetch(url.pathname + url.search, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  })
  return readJson<LogisticsQuoteWorkbenchResponse>(response)
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
  const response = await fetch(url.pathname + url.search, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  })
  return readJson<LogisticsQuoteWorkbenchResponse>(response)
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
  const response = await fetch(url.pathname + url.search, {
    method: 'POST',
    body: formData
  })
  return readJson<LogisticsQuoteWorkbenchResponse>(response)
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
  const response = await fetch(url.pathname + url.search, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  })
  return readJson<LogisticsQuoteWorkbenchResponse>(response)
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
  const response = await fetch(url.pathname + url.search, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  })
  return readJson<LogisticsQuoteWorkbenchResponse>(response)
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
  const response = await fetch(url.pathname + url.search, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  })
  return readJson<LogisticsQuoteWorkbenchResponse>(response)
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
  const response = await fetch(url.pathname + url.search, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  })
  return readJson<LogisticsQuoteWorkbenchResponse>(response)
}

export async function previewLogisticsQuoteNote(
  request: LogisticsQuoteNotePreviewRequest
): Promise<LogisticsQuoteNotePreviewResponse> {
  const response = await fetch('/api/logistics-quote/note-preview', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  })
  return readJson<LogisticsQuoteNotePreviewResponse>(response)
}
