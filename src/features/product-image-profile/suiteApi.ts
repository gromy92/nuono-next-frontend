import { apiFetch, parseApiResponse, readApiErrorMessage } from '../../shared/api'
import type {
  ProductImageAiExtractionSuggestionView,
  ProductImageProfileDetailView,
  ProductImageSuiteAssetMoveRequest,
} from './apiTypes'

const BASE_PATH = '/api/product-images'

function profilePath(profileId: number) {
  return `${BASE_PATH}/profiles/${encodeURIComponent(String(profileId))}`
}

export async function adoptProductImageSuite(
  profileId: number,
  suiteId: number,
  ownerUserId: number,
  storeCode: string
) {
  const params = new URLSearchParams({
    ownerUserId: String(ownerUserId),
    storeCode
  })
  const response = await apiFetch(`${profilePath(profileId)}/suites/${encodeURIComponent(String(suiteId))}/adopt?${params.toString()}`, {
    method: 'POST'
  })
  return parseApiResponse<ProductImageProfileDetailView>(response, 'AI 套图采用失败')
}

export async function createProductImageSuiteDraft(
  profileId: number,
  ownerUserId: number,
  storeCode: string,
  skinId: number
) {
  const params = new URLSearchParams({
    ownerUserId: String(ownerUserId),
    storeCode
  })
  const response = await apiFetch(`${profilePath(profileId)}/suites/ai-draft?${params.toString()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ skinId })
  })
  return parseApiResponse<ProductImageProfileDetailView>(response, '申请做图失败')
}

export async function approveProductImageSuite(
  profileId: number,
  suiteId: number,
  ownerUserId: number,
  storeCode: string
) {
  const params = new URLSearchParams({ ownerUserId: String(ownerUserId), storeCode })
  const response = await apiFetch(`${profilePath(profileId)}/suites/${suiteId}/approve?${params.toString()}`, {
    method: 'POST'
  })
  return parseApiResponse<ProductImageProfileDetailView>(response, '审核通过失败')
}

export async function rejectProductImageSuite(
  profileId: number,
  suiteId: number,
  ownerUserId: number,
  storeCode: string,
  request: { assetIds: number[]; comment: string; wholeSuite: boolean }
) {
  const params = new URLSearchParams({ ownerUserId: String(ownerUserId), storeCode })
  const response = await apiFetch(`${profilePath(profileId)}/suites/${suiteId}/reject?${params.toString()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  })
  return parseApiResponse<ProductImageProfileDetailView>(response, '审核不通过提交失败')
}

export async function retryProductImageSuite(
  profileId: number,
  suiteId: number,
  ownerUserId: number,
  storeCode: string
) {
  const params = new URLSearchParams({ ownerUserId: String(ownerUserId), storeCode })
  const response = await apiFetch(`${profilePath(profileId)}/suites/${suiteId}/retry?${params.toString()}`, {
    method: 'POST'
  })
  return parseApiResponse<ProductImageProfileDetailView>(response, '重试失败')
}

export async function extractProductImageFacts(
  profileId: number,
  ownerUserId: number,
  storeCode: string
) {
  const params = new URLSearchParams({
    ownerUserId: String(ownerUserId),
    storeCode
  })
  const response = await apiFetch(`${profilePath(profileId)}/ai-extract?${params.toString()}`, {
    method: 'POST'
  })
  return parseApiResponse<ProductImageAiExtractionSuggestionView>(response, '商品资料 AI 提取失败')
}

export async function discardProductImageSuite(
  profileId: number,
  suiteId: number,
  ownerUserId: number,
  storeCode: string
) {
  const params = new URLSearchParams({
    ownerUserId: String(ownerUserId),
    storeCode
  })
  const response = await apiFetch(`${profilePath(profileId)}/suites/${encodeURIComponent(String(suiteId))}/discard?${params.toString()}`, {
    method: 'POST'
  })
  return parseApiResponse<ProductImageProfileDetailView>(response, 'AI 套图废弃失败')
}

export async function deleteProductImageSuite(
  profileId: number,
  suiteId: number,
  ownerUserId: number,
  storeCode: string
) {
  const params = new URLSearchParams({
    ownerUserId: String(ownerUserId),
    storeCode
  })
  const response = await apiFetch(`${profilePath(profileId)}/suites/${encodeURIComponent(String(suiteId))}?${params.toString()}`, {
    method: 'DELETE'
  })
  return parseApiResponse<ProductImageProfileDetailView>(response, 'AI 套图删除失败')
}

export async function deleteProductImageSuiteAsset(
  profileId: number,
  suiteId: number,
  assetId: number,
  ownerUserId: number,
  storeCode: string
) {
  const params = new URLSearchParams({
    ownerUserId: String(ownerUserId),
    storeCode
  })
  const response = await apiFetch(
    `${profilePath(profileId)}/suites/${encodeURIComponent(String(suiteId))}/assets/${encodeURIComponent(String(assetId))}?${params.toString()}`,
    { method: 'DELETE' }
  )
  return parseApiResponse<ProductImageProfileDetailView>(response, 'AI 套图图片删除失败')
}

export async function moveProductImageSuiteAsset(
  profileId: number,
  suiteId: number,
  assetId: number,
  ownerUserId: number,
  storeCode: string,
  request: ProductImageSuiteAssetMoveRequest
) {
  const params = new URLSearchParams({
    ownerUserId: String(ownerUserId),
    storeCode
  })
  const response = await apiFetch(
    `${profilePath(profileId)}/suites/${encodeURIComponent(String(suiteId))}/assets/${encodeURIComponent(String(assetId))}/move?${params.toString()}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    }
  )
  return parseApiResponse<ProductImageProfileDetailView>(response, 'AI 套图图片移动失败')
}

export async function fetchProductImageAssetPreviewUrl(imageUrl: string, signal?: AbortSignal) {
  const preview = await fetchProductImageAssetPreview(imageUrl, signal)
  return preview.previewUrl
}

export async function fetchProductImageAssetPreview(imageUrl: string, signal?: AbortSignal) {
  const response = await apiFetch(imageUrl, { signal })
  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response, '商品图读取失败'))
  }
  const blob = await response.blob()
  return {
    previewUrl: URL.createObjectURL(blob),
    sizeBytes: blob.size,
    contentType: blob.type
  }
}
