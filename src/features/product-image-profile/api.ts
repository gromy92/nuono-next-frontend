import { apiFetch, parseApiResponse, readApiErrorMessage } from '../../shared/api'

const BASE_PATH = '/api/product-images'

export type ProductImageRole = 'MAIN' | 'SIZE' | 'DETAIL' | 'SCENE' | 'PACKAGE' | 'OTHER'
export type ProductImageAssetStatus = 'ACTIVE' | 'REMOVED'
export type ProductImageProcessingStatus = 'PENDING' | 'PROCESSED'
export type ProductImageComplianceStatus = 'PASS' | 'FAIL' | 'UNKNOWN'
export type ProductImageSectionType = 'SIZE' | 'CORE_FEATURE' | 'MATERIAL_DETAIL' | 'USAGE_SCENE' | 'PACKAGE_LIST'
export type ProductImageSuiteStatus =
  | 'DRAFT'
  | 'ADOPTED'
  | 'HISTORICAL'
  | 'DISCARDED'
  | 'PENDING_GENERATION'
  | 'GENERATING'
  | 'PENDING_REVIEW'
  | 'REGENERATING'
  | 'PUBLISHING'
  | 'ONLINE'
  | 'FAILED'
export type ProductImageSuiteAssetRole = 'MAIN' | 'SIZE' | 'CORE_FEATURE' | 'MATERIAL_DETAIL' | 'USAGE_SCENE' | 'PACKAGE_LIST'

export type ProductImageProfileAssetView = {
  id?: number | null
  usageId?: number | null
  imageUrl?: string | null
  contentType?: string | null
  sizeBytes?: number | null
  widthPx?: number | null
  heightPx?: number | null
  horizontalPpi?: number | null
  verticalPpi?: number | null
  colorSpace?: string | null
  imageRole?: ProductImageRole | null
  sortOrder?: number | null
  assetStatus?: ProductImageAssetStatus | null
  removable?: boolean | null
  processingNote?: string | null
  processingStatus?: ProductImageProcessingStatus | null
  processedAt?: string | null
  noonTechnicalCompliance?: ProductImageTechnicalComplianceView | null
}

export type ProductImageComplianceCheckView = {
  key?: string | null
  status?: ProductImageComplianceStatus | null
  actual?: string | null
  requirement?: string | null
  message?: string | null
}

export type ProductImageTechnicalComplianceView = {
  status?: ProductImageComplianceStatus | null
  policyVersion?: string | null
  policySource?: string | null
  checks?: ProductImageComplianceCheckView[] | null
}

export type ProductImageSectionView = {
  id?: number | null
  sectionType: ProductImageSectionType
  titleAr?: string | null
  titleEn?: string | null
  descriptionAr?: string | null
  descriptionEn?: string | null
  attributesText?: string | null
  focusPart?: string | null
  sortOrder?: number | null
  enabled?: boolean | null
}

export type ProductImageSuiteAssetView = {
  id?: number | null
  imageRole?: ProductImageSuiteAssetRole | null
  roleOrdinal?: number | null
  imageUrl?: string | null
  sortOrder?: number | null
}

export type ProductImageSuiteView = {
  id: number
  parentSuiteId?: number | null
  revisionNo?: number | null
  suiteName?: string | null
  skinId?: number | null
  skinName?: string | null
  generationTaskId?: string | null
  draftPackageJson?: string | null
  draftPromptText?: string | null
  suiteStatus: ProductImageSuiteStatus
  reviewComment?: string | null
  failureStage?: string | null
  failureReason?: string | null
  reviewedAt?: string | null
  publishedAt?: string | null
  adoptedAt?: string | null
  updatedAt?: string | null
  assets?: ProductImageSuiteAssetView[] | null
}

export type ProductImageProfileDetailView = {
  id?: number | null
  ownerUserId?: number | null
  storeCode?: string | null
  pskuCode?: string | null
  productIdentityKey?: string | null
  productMasterId?: number | null
  productVariantId?: number | null
  productTitle?: string | null
  brand?: string | null
  titleAr?: string | null
  titleEn?: string | null
  specSummary?: string | null
  productFactText?: string | null
  heroSellingPoints?: string[] | null
  updatedAt?: string | null
  assets?: ProductImageProfileAssetView[] | null
  sections?: ProductImageSectionView[] | null
  suites?: ProductImageSuiteView[] | null
}

export type ProductImageProfileSummaryView = {
  id?: number | null
  ownerUserId?: number | null
  storeCode?: string | null
  pskuCode?: string | null
  productIdentityKey?: string | null
  productMasterId?: number | null
  productVariantId?: number | null
  productTitle?: string | null
  brand?: string | null
  titleAr?: string | null
  titleEn?: string | null
  specSummary?: string | null
  coverImageUrl?: string | null
  assetCount?: number | null
  suiteCount?: number | null
  hasAdoptedSuite?: boolean | null
  updatedAt?: string | null
}

export type ProductImageProfileListView = {
  ownerUserId?: number | null
  storeCode?: string | null
  items?: ProductImageProfileDetailView[] | null
}

export type ProductImageProfileSummaryListView = {
  ownerUserId?: number | null
  storeCode?: string | null
  items?: ProductImageProfileSummaryView[] | null
}

export type ProductImageAssetMetadataView = {
  contentType?: string | null
  sizeBytes?: number | null
  widthPx?: number | null
  heightPx?: number | null
  horizontalPpi?: number | null
  verticalPpi?: number | null
  colorSpace?: string | null
}

export type ProductImageAiExtractionSuggestionView = {
  specSummary?: string | null
  titleEn?: string | null
  titleAr?: string | null
  sizeText?: string | null
  heroSellingPoints?: string[] | null
  packageText?: string | null
}

export type ProductImageAssetMetadataQuery = {
  ownerUserId: number
  storeCode: string
  productMasterId: number
  imageUrl: string
}

export type ProductImageAssetRemoveItem = {
  assetId?: number
  imageUrl?: string
}

export type ProductImageAssetRoleUpdateItem = ProductImageAssetRemoveItem & {
  imageRole: ProductImageRole
}

export type ProductImageAssetUsageCreateRequest = ProductImageAssetRemoveItem & {
  sourceRole?: ProductImageRole
  imageRoles: ProductImageRole[]
}

export type ProductImageAssetUsageUpdateRequest = {
  imageRole: ProductImageRole
  processingNote?: string
  processingStatus: ProductImageProcessingStatus
}

export type ProductImageSectionCommand = {
  sectionType: ProductImageSectionType
  titleAr?: string
  titleEn?: string
  descriptionAr?: string
  descriptionEn?: string
  attributesText?: string
  focusPart?: string
  sortOrder?: number
  enabled?: boolean
}

export type ProductImageProfileSaveRequest = {
  id?: number
  ownerUserId: number
  storeCode: string
  pskuCode: string
  productIdentityKey?: string
  productMasterId?: number
  productVariantId?: number
  productTitle?: string
  brand?: string
  titleAr?: string
  titleEn?: string
  specSummary?: string
  productFactText?: string
  heroSellingPoints?: string[]
  sections?: ProductImageSectionCommand[]
}

export type ProductImageSuiteAssetMoveRequest = {
  targetSuiteId?: number
  targetIndex?: number
}

export type ProductImageProfileQuery = {
  ownerUserId: number
  storeCode: string
  keyword?: string
}

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
