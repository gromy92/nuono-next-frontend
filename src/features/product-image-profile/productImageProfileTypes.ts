import type {
  ProductImageComplianceStatus,
  ProductImageProcessingStatus,
  ProductImageRole as ApiImageRole,
  ProductImageSuiteAssetRole as ApiSuiteAssetRole,
  ProductImageSuiteStatus as ApiSuiteStatus
} from './api'
import type {
  ProductImageProfileMissingField,
  ProductImageProfileReadinessStatus,
  ProductImageSummaryStatus
} from './profileSummaryStatus'

export type ImageRole = ApiImageRole
export type SuiteStatus = ApiSuiteStatus
export type SuiteAssetRole = ApiSuiteAssetRole
export type ProductImageProfileTabKey = 'assets' | 'elements' | 'suites'

export type ProfileAsset = {
  id: string
  backendId?: number
  usageId?: number
  title: string
  imageUrl?: string
  contentType?: string
  sizeBytes?: number
  widthPx?: number
  heightPx?: number
  horizontalPpi?: number
  verticalPpi?: number
  colorSpace?: string
  imageRole: ImageRole
  sortOrder: number
  assetStatus: 'ACTIVE' | 'REMOVED'
  accent: string
  removable?: boolean
  processingNote: string
  processingStatus: ProductImageProcessingStatus
  processedAt?: string
  noonTechnicalCompliance?: {
    status?: ProductImageComplianceStatus | null
    policyVersion?: string | null
    policySource?: string | null
    checks?: Array<{
      key?: string | null
      status?: ProductImageComplianceStatus | null
      actual?: string | null
      requirement?: string | null
      message?: string | null
    }> | null
  }
}

export type SimpleImageSection = {
  titleAr: string
  titleEn: string
  descriptionAr: string
  descriptionEn: string
  attributesText?: string
}

export type RepeatableImageSection = SimpleImageSection & {
  id: string
  focusPart?: string
}

export type ProductImageSuiteAsset = {
  id: string
  backendId?: number
  imageRole: SuiteAssetRole
  roleOrdinal: number
  title: string
  imageUrl?: string
  sortOrder: number
  accent: string
}

export type ProductImageSuite = {
  id: string
  backendId?: number
  suiteName: string
  skinId?: number
  skinName: string
  generationTaskId?: string
  draftPackageJson?: string
  draftPromptText?: string
  suiteStatus: SuiteStatus
  reviewComment?: string
  failureReason?: string
  publishedAt?: string
  createdAt: string
  adoptedAt?: string
  assets: ProductImageSuiteAsset[]
}

export type ProductImageProfile = {
  id: string
  backendId?: number
  ownerUserId?: number
  storeCode?: string
  productIdentityKey?: string
  productMasterId?: number
  pskuCode: string
  productTitle: string
  brand: string
  titleAr: string
  titleEn: string
  specSummary: string
  productFactText: string
  heroSellingPoints: string[]
  updatedAt: string
  assetCount?: number
  coverImageUrl?: string
  detailLoaded?: boolean
  hasAdoptedSuite?: boolean
  suiteCount?: number
  activeSuiteCount?: number
  profileReadinessStatus?: ProductImageProfileReadinessStatus
  missingProfileFields?: ProductImageProfileMissingField[]
  imageStatus?: ProductImageSummaryStatus
  assets: ProfileAsset[]
  sizeSection: SimpleImageSection
  coreFeatures: RepeatableImageSection[]
  materialDetails: RepeatableImageSection[]
  usageScene: SimpleImageSection
  packageList: SimpleImageSection
  suites: ProductImageSuite[]
}

export type ImageRoleOption = { label: string; value: ImageRole; disabled?: boolean }
