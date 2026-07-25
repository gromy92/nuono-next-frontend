import { apiFetch, parseApiResponse, readApiErrorMessage } from '../../shared/api'
import type {
  ProductImageAiExtractionSuggestionView,
  ProductImageAssetMetadataQuery,
  ProductImageAssetMetadataView,
  ProductImageAssetRemoveItem,
  ProductImageAssetRoleUpdateItem,
  ProductImageAssetUsageCreateRequest,
  ProductImageAssetUsageUpdateRequest,
  ProductImageProfileDetailView,
  ProductImageProfileListView,
  ProductImageProfileQuery,
  ProductImageProfileSaveRequest,
  ProductImageProfileSummaryListView,
  ProductImageRole,
} from './apiTypes'

const BASE_PATH = '/api/product-images'

function profilePath(profileId: number) {
  return `${BASE_PATH}/profiles/${encodeURIComponent(String(profileId))}`
}

export async function fetchProductImageProfiles(query: ProductImageProfileQuery) {
  const params = new URLSearchParams({
    ownerUserId: String(query.ownerUserId),
    storeCode: query.storeCode
  })
  if (query.keyword?.trim()) {
    params.set('keyword', query.keyword.trim())
  }

  const response = await apiFetch(`${BASE_PATH}/profiles?${params.toString()}`)
  return parseApiResponse<ProductImageProfileListView>(response, '商品图资料读取失败')
}

export async function fetchProductImageProfileSummaries(query: ProductImageProfileQuery) {
  const params = new URLSearchParams({
    ownerUserId: String(query.ownerUserId),
    storeCode: query.storeCode
  })
  if (query.keyword?.trim()) {
    params.set('keyword', query.keyword.trim())
  }

  const response = await apiFetch(`${BASE_PATH}/profile-summaries?${params.toString()}`)
  return parseApiResponse<ProductImageProfileSummaryListView>(response, '商品图资料列表读取失败')
}

export async function fetchProductImageProfileDetail(profileId: number, query: ProductImageProfileQuery) {
  const params = new URLSearchParams({
    ownerUserId: String(query.ownerUserId),
    storeCode: query.storeCode
  })

  const response = await apiFetch(`${profilePath(profileId)}?${params.toString()}`)
  return parseApiResponse<ProductImageProfileDetailView>(response, '商品图资料详情读取失败')
}

export async function saveProductImageProfile(request: ProductImageProfileSaveRequest) {
  const response = await apiFetch(`${BASE_PATH}/profiles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  })
  return parseApiResponse<ProductImageProfileDetailView>(response, '商品图资料保存失败')
}

export async function uploadProductImageProfileAsset(
  profileId: number,
  ownerUserId: number,
  storeCode: string,
  file: File,
  imageRole: ProductImageRole = 'MAIN'
) {
  const body = new FormData()
  body.append('ownerUserId', String(ownerUserId))
  body.append('storeCode', storeCode)
  body.append('imageRole', imageRole)
  body.append('file', file)

  const response = await apiFetch(`${profilePath(profileId)}/assets`, {
    method: 'POST',
    body
  })
  return parseApiResponse<ProductImageProfileDetailView>(response, '基础图上传失败')
}

export async function importProductImageProfileAssetUrls(
  profileId: number,
  ownerUserId: number,
  storeCode: string,
  imageUrls: string[],
  imageRole: ProductImageRole = 'MAIN'
) {
  const params = new URLSearchParams({
    ownerUserId: String(ownerUserId),
    storeCode
  })
  const response = await apiFetch(`${profilePath(profileId)}/assets/url-import?${params.toString()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageUrls, imageRole })
  })
  return parseApiResponse<ProductImageProfileDetailView>(response, '基础图 URL 导入失败')
}

export async function removeProductImageProfileAsset(
  profileId: number,
  assetId: number,
  ownerUserId: number,
  storeCode: string
) {
  const params = new URLSearchParams({
    ownerUserId: String(ownerUserId),
    storeCode
  })
  const response = await apiFetch(`${profilePath(profileId)}/assets/${encodeURIComponent(String(assetId))}?${params.toString()}`, {
    method: 'DELETE'
  })
  return parseApiResponse<ProductImageProfileDetailView>(response, '基础图移除失败')
}

export async function batchRemoveProductImageProfileAssets(
  profileId: number,
  ownerUserId: number,
  storeCode: string,
  assets: ProductImageAssetRemoveItem[]
) {
  const params = new URLSearchParams({
    ownerUserId: String(ownerUserId),
    storeCode
  })
  const response = await apiFetch(`${profilePath(profileId)}/assets/batch-remove?${params.toString()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ assets })
  })
  return parseApiResponse<ProductImageProfileDetailView>(response, '基础图批量移除失败')
}

export async function updateProductImageProfileAssetRole(
  profileId: number,
  ownerUserId: number,
  storeCode: string,
  asset: ProductImageAssetRoleUpdateItem
) {
  const params = new URLSearchParams({
    ownerUserId: String(ownerUserId),
    storeCode
  })
  const response = await apiFetch(`${profilePath(profileId)}/assets/role?${params.toString()}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(asset)
  })
  return parseApiResponse<ProductImageProfileDetailView>(response, '基础图分类更新失败')
}

export async function addProductImageProfileAssetUsages(
  profileId: number,
  ownerUserId: number,
  storeCode: string,
  request: ProductImageAssetUsageCreateRequest
) {
  const params = new URLSearchParams({
    ownerUserId: String(ownerUserId),
    storeCode
  })
  const response = await apiFetch(`${profilePath(profileId)}/assets/usages?${params.toString()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  })
  return parseApiResponse<ProductImageProfileDetailView>(response, '基础图复用失败')
}

export async function updateProductImageProfileAssetUsage(
  profileId: number,
  usageId: number,
  ownerUserId: number,
  storeCode: string,
  request: ProductImageAssetUsageUpdateRequest
) {
  const params = new URLSearchParams({
    ownerUserId: String(ownerUserId),
    storeCode
  })
  const response = await apiFetch(
    `${profilePath(profileId)}/asset-usages/${encodeURIComponent(String(usageId))}?${params.toString()}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    }
  )
  return parseApiResponse<ProductImageProfileDetailView>(response, '图片用途更新失败')
}

export async function removeProductImageProfileAssetUsage(
  profileId: number,
  usageId: number,
  ownerUserId: number,
  storeCode: string
) {
  const params = new URLSearchParams({
    ownerUserId: String(ownerUserId),
    storeCode
  })
  const response = await apiFetch(
    `${profilePath(profileId)}/asset-usages/${encodeURIComponent(String(usageId))}?${params.toString()}`,
    { method: 'DELETE' }
  )
  return parseApiResponse<ProductImageProfileDetailView>(response, '图片用途移除失败')
}

export async function fetchProductImageAssetMetadata(query: ProductImageAssetMetadataQuery) {
  const params = new URLSearchParams({
    ownerUserId: String(query.ownerUserId),
    storeCode: query.storeCode,
    productMasterId: String(query.productMasterId),
    imageUrl: query.imageUrl
  })
  const response = await apiFetch(`${BASE_PATH}/assets/metadata?${params.toString()}`)
  return parseApiResponse<ProductImageAssetMetadataView>(response, '图片信息读取失败')
}
