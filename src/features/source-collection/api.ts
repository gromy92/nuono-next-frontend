import type {
  Ali1688CollectionView,
  ProductSelectionSourceCollection,
  SourceCollectionFormValue
} from './types'
import { apiFetch, readApiErrorMessage } from '../../shared/api'

type SourceCollectionPayload = {
  storeName: string
  storeCode?: string
  sourceType: 'marketplace-url' | 'image-search-source'
  collectionSource?: 'browser' | 'plugin' | string
  sourcePlatform: string
  sourceUrl?: string
  pageUrl?: string
  sourceTitle?: string
  sourceTitleCn?: string
  sourceTitleAr?: string
  sourceImageUrl?: string
  imageUrls: string[]
  priceSummary?: string
  moqHint?: string
  shippingFrom?: string
  specHints: string[]
  sourceDescriptionEn?: string
  sourceDescriptionAr?: string
  sourceSellingPointsEn?: string[]
  sourceSellingPointsAr?: string[]
  selectedText?: string
  selectedTextAr?: string
  notes?: string
  operatorName: string
}

export class SourceCollectionApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'SourceCollectionApiError'
    this.status = status
  }
}

export function loadSourceCollections(
  storeName: string,
  storeCode?: string
): Promise<ProductSelectionSourceCollection[]> {
  const params = new URLSearchParams({ storeName })
  if (storeCode) {
    params.set('storeCode', storeCode)
  }
  return getJson(`/api/product-selection/source-collections?${params.toString()}`)
}

export function loadAli1688Collections(
  storeName: string,
  storeCode?: string,
  _operatorUserId?: number,
  status?: string
): Promise<ProductSelectionSourceCollection[]> {
  const params = new URLSearchParams({ storeName })
  if (storeCode) {
    params.set('storeCode', storeCode)
  }
  if (status) {
    params.set('status', status)
  }
  return getJson<Ali1688CollectionView[]>(`/api/product-selection/ali1688-collections?${params.toString()}`)
    .then((views) => views.map(sourceCollectionFromAli1688View))
}

export function loadPurchaseOrderItemAli1688(itemId: string): Promise<ProductSelectionSourceCollection> {
  return getJson<Ali1688CollectionView>(
    `/api/procurement/purchase-orders/items/${encodeURIComponent(itemId)}/ali1688`
  ).then(sourceCollectionFromAli1688View)
}

export function createSourceCollection(
  values: SourceCollectionFormValue,
  storeName: string,
  storeCode: string | undefined,
  operatorName: string
): Promise<ProductSelectionSourceCollection> {
  const imageUrls = [values.sourceImageUrl || '', ...splitLines(values.imageUrlsText)]
    .map((item) => item.trim())
    .filter((item, index, list) => item && list.indexOf(item) === index)
  const payload: SourceCollectionPayload = {
    storeName,
    storeCode,
    sourceType: values.sourceType || 'marketplace-url',
    collectionSource: values.collectionSource || 'browser',
    sourcePlatform: values.sourcePlatform,
    sourceUrl: values.sourceUrl,
    pageUrl: values.pageUrl,
    sourceTitle: values.sourceTitle,
    sourceTitleCn: values.sourceTitleCn,
    sourceTitleAr: values.sourceTitleAr,
    sourceImageUrl: values.sourceImageUrl,
    imageUrls,
    priceSummary: values.priceSummary,
    moqHint: values.moqHint,
    shippingFrom: values.shippingFrom,
    specHints: splitLines(values.specHintsText),
    sourceDescriptionEn: values.sourceDescriptionEn,
    sourceDescriptionAr: values.sourceDescriptionAr,
    sourceSellingPointsEn: values.sourceSellingPointsEn,
    sourceSellingPointsAr: values.sourceSellingPointsAr,
    selectedText: values.selectedText,
    selectedTextAr: values.selectedTextAr,
    notes: values.notes,
    operatorName
  }
  return sendJson('/api/product-selection/source-collections', 'POST', payload)
}

export function recollectSourceCollection(
  collectionId: string,
  storeCode: string | undefined,
  operatorName: string
): Promise<ProductSelectionSourceCollection> {
  return sendJson(`/api/product-selection/source-collections/${encodeURIComponent(collectionId)}/recollect`, 'POST', {
    storeCode,
    operatorName
  })
}

export function loadSourceCollectionAli1688(collectionId: string): Promise<Ali1688CollectionView> {
  return getJson(`/api/product-selection/source-collections/${encodeURIComponent(collectionId)}/ali1688`)
}

export function recollectAli1688Collection(collectionId: string): Promise<Ali1688CollectionView> {
  return sendJson(`/api/product-selection/source-collections/${encodeURIComponent(collectionId)}/ali1688/recollect`, 'POST', {})
}

export function retryAli1688Collection(taskId: string): Promise<Ali1688CollectionView> {
  return sendJson(`/api/product-selection/ali1688-collections/${encodeURIComponent(taskId)}/retry`, 'POST', {})
}

async function parseResponse<TResponse>(response: Response): Promise<TResponse> {
  if (!response.ok) {
    const message = await readApiErrorMessage(response, `Request failed: ${response.status}`)
    throw new SourceCollectionApiError(response.status, message)
  }
  const payload = await response.json().catch(() => null)
  return payload as TResponse
}

async function getJson<TResponse>(url: string): Promise<TResponse> {
  return parseResponse<TResponse>(await apiFetch(url))
}

async function sendJson<TResponse>(url: string, method: 'POST' | 'PUT', body: unknown): Promise<TResponse> {
  return parseResponse<TResponse>(
    await apiFetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body || {})
    })
  )
}

function splitLines(value?: string) {
  return (value || '')
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
}

export function sourceCollectionFromAli1688View(view: Ali1688CollectionView): ProductSelectionSourceCollection {
  return {
    id: view.sourceCollectionId || view.taskId || view.id || '',
    collectionNo: view.sourceCollectionNo || '',
    storeId: view.storeId,
    storeName: view.storeName,
    storeCode: view.storeCode,
    siteCode: view.siteCode,
    sourceType: 'marketplace-url',
    collectionSource: view.collectionSource || 'browser',
    sourcePlatform: view.sourcePlatform || '未知平台',
    sourceUrl: view.sourceUrl,
    pageUrl: view.pageUrl,
    sourceTitle: view.sourceTitle || '',
    sourceTitleCn: view.sourceTitleCn,
    sourceTitleAr: '',
    sourceImageUrl: view.sourceImageUrl || '',
    imageUrls: view.sourceImageUrl ? [view.sourceImageUrl] : [],
    specHints: [],
    status: view.status === 'failed'
      ? 'failed'
      : view.status === 'not_started' || view.status === 'queued' || view.status === 'running' ? 'running' : 'success',
    statusText: view.status,
    collectedAt: view.finishedAt || view.startedAt || '',
    collectedBy: '系统',
    collectedFieldCount: 0,
    imageCount: view.sourceImageUrl ? 1 : 0,
    ali1688Collection: view
  }
}
