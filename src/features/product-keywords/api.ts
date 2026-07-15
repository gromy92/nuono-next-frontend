import { apiFetch, readApiErrorMessage } from '../../shared/api'
import type {
  ProductCompetitorKeywordCommand,
  ProductKeywordCommand,
  ProductKeywordListRequest,
  ProductKeywordListView,
  ProductKeywordPanelView,
  ProductKeywordProductRequest,
  ProductKeywordUpdateCommand,
  ProductKeywordItem
} from './types'

export class ProductKeywordApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ProductKeywordApiError'
    this.status = status
  }
}

function appendParam(params: URLSearchParams, key: string, value: unknown) {
  if (value === undefined || value === null || value === '') {
    return
  }
  params.set(key, String(value))
}

export function buildProductKeywordListParams(params: ProductKeywordListRequest) {
  const search = new URLSearchParams()
  appendParam(search, 'storeCode', params.storeCode)
  appendParam(search, 'siteCode', params.siteCode)
  appendParam(search, 'partnerSku', params.partnerSku)
  appendParam(search, 'keyword', params.keywordNorm)
  appendParam(search, 'status', params.status)
  appendParam(search, 'limit', params.limit)
  return search
}

export function buildProductKeywordProductParams(params: ProductKeywordProductRequest) {
  const search = new URLSearchParams()
  appendParam(search, 'storeCode', params.storeCode)
  appendParam(search, 'siteCode', params.siteCode)
  return search
}

async function parseProductKeywordResponse<T>(response: Response, fallbackMessage: string) {
  if (!response.ok) {
    throw new ProductKeywordApiError(response.status, await readApiErrorMessage(response, fallbackMessage))
  }
  return (await response.json()) as T
}

export async function fetchProductKeywords(params: ProductKeywordListRequest) {
  const search = buildProductKeywordListParams(params).toString()
  const suffix = search ? `?${search}` : ''
  const response = await apiFetch(`/api/product-keywords${suffix}`)
  return parseProductKeywordResponse<ProductKeywordListView>(response, `关键词数据加载失败：${response.status}`)
}

export async function fetchProductKeywordProduct(partnerSku: string, params: ProductKeywordProductRequest) {
  const search = buildProductKeywordProductParams(params).toString()
  const suffix = search ? `?${search}` : ''
  const response = await apiFetch(`/api/product-keywords/products/${encodeURIComponent(partnerSku)}${suffix}`)
  return parseProductKeywordResponse<ProductKeywordPanelView>(response, `商品关键词加载失败：${response.status}`)
}

export async function addProductKeyword(body: ProductKeywordCommand) {
  const response = await apiFetch('/api/product-keywords', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  return parseProductKeywordResponse<ProductKeywordItem>(response, `关键词创建失败：${response.status}`)
}

export async function addProductCompetitorKeywords(body: ProductCompetitorKeywordCommand) {
  const response = await apiFetch('/api/product-keywords/competitor-keywords', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  return parseProductKeywordResponse<ProductKeywordListView>(response, `竞品关键词写入失败：${response.status}`)
}

export async function updateProductKeyword(keywordId: number, body: ProductKeywordUpdateCommand) {
  const response = await apiFetch(`/api/product-keywords/${keywordId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  return parseProductKeywordResponse<ProductKeywordItem>(response, `关键词更新失败：${response.status}`)
}
