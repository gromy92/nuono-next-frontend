import type { ProductImageProfileMissingField, ProductImageProfileReadinessStatus, ProductImageSummaryStatus } from './profileSummaryStatus'

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
  productTitle?: string | null
  brand?: string | null
  titleAr?: string | null
  titleEn?: string | null
  specSummary?: string | null
  coverImageUrl?: string | null
  assetCount?: number | null
  suiteCount?: number | null
  activeSuiteCount?: number | null
  hasAdoptedSuite?: boolean | null
  profileReadinessStatus?: ProductImageProfileReadinessStatus | null
  missingProfileFields?: ProductImageProfileMissingField[] | null
  imageStatus?: ProductImageSummaryStatus | null
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
